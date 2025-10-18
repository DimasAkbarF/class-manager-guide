// script.js

// 1) load daftar user (hash) dari /data/users.json
let daftarUsers = [];
async function loadUsers() {
  try {
    const res = await fetch('/data/users.json', {cache: "no-store"});
    if (!res.ok) throw new Error('Gagal memuat daftar user');
    daftarUsers = await res.json();
  } catch (err) {
    console.error('Error load users:', err);
    daftarUsers = [];
  }
}

// 2) fungsi hash
async function sha256Hex(str) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 3) login handler
async function login() {
  const nimInput = document.getElementById('nim');
  const errEl = document.getElementById('error-message');
  errEl.classList.add('hidden');
  const nim = nimInput.value.trim();
  if (!nim) {
    errEl.textContent = 'Masukkan NIM.';
    errEl.classList.remove('hidden');
    return;
  }

  // pastikan daftar users sudah dimuat
  if (!daftarUsers.length) {
    await loadUsers();
    if (!daftarUsers.length) {
      errEl.textContent = 'Daftar user tidak tersedia. Hubungi admin?Bendahara kelas.';
      errEl.classList.remove('hidden');
      return;
    }
  }

  // hash input user
  const hash = await sha256Hex(nim);

  // cari kecocokan
  const found = daftarUsers.find(u => u.hash === hash);
  if (found) {
    // simpan ke localStorage: hanya nama dan hash (bukan NIM mentah)
    localStorage.setItem('user', JSON.stringify({nama: found.nama, hash}));
    window.location.href = 'dashboard.html';
  } else {
    errEl.textContent = '❌ NIM tidak ditemukan! Pastikan Anda terdaftar.';
    errEl.classList.remove('hidden');
  }
}

// 4) cek auth di halaman dashboard
function checkAuthOrRedirect() {
  const raw = localStorage.getItem('user');
  if (!raw) {
    window.location.href = 'index.html';
    return null;
  }
  try {
    const user = JSON.parse(raw);
    // opsional: bisa juga cross-check hash terhadap users.json untuk validasi tambahan
    return user;
  } catch {
    window.location.href = 'index.html';
    return null;
  }
}

// 5) logout
function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// ketika index.html diload, bisa pre-load daftar users supaya cepat
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' ) {
  loadUsers();
}

// kalau kita di dashboard, render data user
if (window.location.pathname.endsWith('dashboard.html')) {
  // pastikan DOM siap
  document.addEventListener('DOMContentLoaded', async () => {
    // optional: load daftarUsers untuk double-check (tidak wajib)
    await loadUsers();

    const user = checkAuthOrRedirect();
    if (!user) return;
    const el = document.getElementById('user-info');
    if (el) el.textContent = `Halo, ${user.nama}`; // jangan tampilkan NIM menta
    // sambungkan tombol logout
    const outBtn = document.getElementById('btn-logout');
    if (outBtn) outBtn.addEventListener('click', logout);
  });
}
