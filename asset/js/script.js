// asset/js/script.js

// 1) load daftar user (hash) dari /data/users.json
let daftarUsers = [];
async function loadUsers() {
  try {
    // Gunakan path relatif agar kompatibel di localhost / IP LAN
    const res = await fetch('./data/users.json', { cache: "no-store" });
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

// === Variabel dan Fungsi Toast ===
// Variabel global untuk mengelola timer toast
let toastTimer;

/**
 * Menampilkan notifikasi toast dengan pesan kustom.
 * @param {string} message - Pesan yang ingin ditampilkan di toast.
 */
function showToast(message) {
    const toast = document.getElementById('toast-failure');
    if (!toast) return; // Guard clause jika elemen tidak ada
    const toastMessage = document.getElementById('toast-message');

    // Hapus timer sebelumnya jika ada (mencegah toast berkedip)
    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    // Atur pesan kesalahan
    if (toastMessage) toastMessage.textContent = message;

    // Tampilkan toast dengan menganimasikannya masuk
    toast.classList.remove('translate-x-[120%]', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');

    // Atur timer untuk menyembunyikan toast secara otomatis setelah 3 detik
    toastTimer = setTimeout(() => {
        hideToast();
    }, 3000); // 3000ms = 3 detik
}

/**
 * Menyembunyikan notifikasi toast.
 */
function hideToast() {
    const toast = document.getElementById('toast-failure');
    if (!toast) return; // Guard clause

    // Sembunyikan toast dengan menganimasikannya keluar
    toast.classList.add('translate-x-[120%]', 'opacity-0');
    toast.classList.remove('translate-x-0', 'opacity-100');

    // Hapus timer jika ada
    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
}
// === Akhir Fungsi Toast ===


// 3) login handler (SUDAH DIINTEGRASIKAN DENGAN TOAST)
async function login() {
  const nimInput = document.getElementById('nim');
  const errEl = document.getElementById('error-message');
  errEl.classList.add('hidden'); // Sembunyikan error inline dulu
  
  const nim = nimInput.value.trim();
  if (!nim) {
    const pesan = 'Masukkan NIM.';
    showToast(pesan); // Panggil Toast
    errEl.textContent = pesan;
    errEl.classList.remove('hidden');
    return;
  }

  // pastikan daftar users sudah dimuat
  if (!daftarUsers.length) {
    await loadUsers();
    if (!daftarUsers.length) {
      const pesan = 'Daftar user tidak tersedia. Hubungi admin/bendahara kelas.';
      showToast(pesan); // Panggil Toast
      errEl.textContent = pesan;
      errEl.classList.remove('hidden');
      return;
    }
  }

  // hash input user
  const hash = await sha256Hex(nim);

  // cari kecocokan
  const found = daftarUsers.find(u => u.hash === hash);
  if (found) {
    // BERHASIL
    hideToast(); // Sembunyikan toast jika mungkin sedang tampil
    // simpan ke localStorage: hanya nama dan hash (bukan NIM mentah)
    localStorage.setItem('user', JSON.stringify({nama: found.nama, hash}));
    window.location.href = './dashboard.html';
  } else {
    // GAGAL
    const pesan = '❌ NIM tidak ditemukan! Pastikan Anda terdaftar.';
    showToast(pesan); // Panggil Toast
    errEl.textContent = pesan;
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

// --- Event Listeners ---

// ketika index.html diload, bisa pre-load daftar users supaya cepat
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' ) {
  document.addEventListener('DOMContentLoaded', loadUsers);
}

// kalau kita di dashboard, render data user
if (window.location.pathname.endsWith('dashboard.html')) {
  // pastikan DOM siap
  document.addEventListener('DOMContentLoaded', async () => {
    // optional: load daftarUsers untuk double-check (tidak wajib)
    await loadUsers();

    const user = checkAuthOrRedirect();
    if (!user) return;
    
    // Tampilkan nama user
    const el = document.getElementById('user-info');
    if (el) el.textContent = `Halo, ${user.nama}`; // jangan tampilkan NIM mentah
    
    // sambungkan tombol logout
    const outBtn = document.getElementById('btn-logout');
    if (outBtn) outBtn.addEventListener('click', logout);
  });
}