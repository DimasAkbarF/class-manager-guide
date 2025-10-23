// asset/js/script.js

// ===== PERFORMANCE OPTIMIZATIONS =====

// Preconnect hints untuk external resources (akan dipindah ke HTML)
const preconnectOrigins = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com', 
  'https://fonts.gstatic.com'
];

// Cache users data dengan optimasi
let usersCache = null;
const CACHE_KEY = 'users_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function loadUsersWithCache() {
    // Gunakan memory cache pertama untuk menghindari localStorage I/O blocking
    if (usersCache && (Date.now() - usersCache.timestamp < CACHE_DURATION)) {
        return usersCache.data;
    }
    
    // Cek localStorage cache
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                usersCache = { data, timestamp }; // Isi memory cache
                return data;
            }
        }
    } catch (e) {
        console.warn('LocalStorage cache unavailable:', e);
    }
    
    // Fallback: fetch fresh data dengan timeout
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const response = await fetch('./data/users.json', { 
            cache: "no-store",
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const users = await response.json();
        
        // Update both caches
        usersCache = { data: users, timestamp: Date.now() };
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(usersCache));
        } catch (e) {
            // Ignore localStorage errors
        }
        
        return users;
    } catch (err) {
        console.error('Error loading users:', err);
        // Return stale cache if available, even if expired
        if (usersCache?.data) {
            return usersCache.data;
        }
        return [];
    }
}

// ===== CORE FUNCTIONALITY =====

let daftarUsers = [];

async function loadUsers() {
  try {
    daftarUsers = await loadUsersWithCache();
  } catch (err) {
    console.error('Error load users:', err);
    daftarUsers = [];
  }
}

// Preload users immediately for index page
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
  // Start loading users immediately, don't wait for DOMContentLoaded
  loadUsers().catch(console.error);
}

// 2) fungsi hash (optimized)
async function sha256Hex(str) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== TOAST MANAGEMENT =====

let toastTimer;

function showToast(message) {
    const toast = document.getElementById('toast-failure');
    if (!toast) return;
    const toastMessage = document.getElementById('toast-message');

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    if (toastMessage) toastMessage.textContent = message;

    // Force reflow untuk memastikan animasi berjalan
    toast.style.display = 'block';
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-[120%]', 'opacity-0');
        toast.classList.add('translate-x-0', 'opacity-100');
    });

    toastTimer = setTimeout(() => {
        hideToast();
    }, 3000);
}

function hideToast() {
    const toast = document.getElementById('toast-failure');
    if (!toast) return;

    toast.classList.add('translate-x-[120%]', 'opacity-0');
    toast.classList.remove('translate-x-0', 'opacity-100');

    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
    
    // Sembunyikan setelah animasi selesai
    setTimeout(() => {
        toast.style.display = 'none';
    }, 300);
}

// ===== LOGIN HANDLER (OPTIMIZED) =====

async function login() {
  const nimInput = document.getElementById('nim');
  const errEl = document.getElementById('error-message');
  errEl.classList.add('hidden');
  
  const nim = nimInput.value.trim();
  if (!nim) {
    const pesan = 'Masukkan NIM.';
    showToast(pesan);
    errEl.textContent = pesan;
    errEl.classList.remove('hidden');
    nimInput.focus();
    return;
  }

  // Show loading state immediately
  const submitBtn = document.querySelector('button[type="submit"]');
  const originalText = submitBtn?.textContent;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memeriksa...';
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
  }

  try {
    // Ensure users are loaded (gunakan cache)
    if (!daftarUsers.length) {
      await loadUsers();
      if (!daftarUsers.length) {
        const pesan = 'Daftar user tidak tersedia. Hubungi admin/bendahara kelas.';
        showToast(pesan);
        errEl.textContent = pesan;
        errEl.classList.remove('hidden');
        return;
      }
    }

    // Hash input user
    const hash = await sha256Hex(nim);

    // Cari kecocokan
    const found = daftarUsers.find(u => u.hash === hash);
    if (found) {
      // BERHASIL
      hideToast();
      
      // Prepare user data untuk localStorage
      const userData = { nama: found.nama, hash };
      
      // Simpan ke localStorage dan redirect
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Show success feedback sebelum redirect
      if (submitBtn) {
        submitBtn.textContent = 'Berhasil!';
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        submitBtn.classList.add('bg-green-500');
      }
      
      // Small delay untuk UX feedback kemudian redirect
      setTimeout(() => {
        window.location.href = './dashboard.html';
      }, 500);
      
    } else {
      // GAGAL
      const pesan = '❌ NIM tidak ditemukan! Pastikan Anda terdaftar.';
      showToast(pesan);
      errEl.textContent = pesan;
      errEl.classList.remove('hidden');
      nimInput.focus();
    }
  } catch (error) {
    console.error('Login error:', error);
    const pesan = 'Terjadi kesalahan sistem. Coba lagi.';
    showToast(pesan);
    errEl.textContent = pesan;
    errEl.classList.remove('hidden');
  } finally {
    // Reset button state
    if (submitBtn && !submitBtn.classList.contains('bg-green-500')) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }
}

// ===== AUTH MANAGEMENT =====

function checkAuthOrRedirect() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) {
      window.location.href = 'index.html';
      return null;
    }
    const user = JSON.parse(raw);
    return user;
  } catch {
    window.location.href = 'index.html';
    return null;
  }
}

function logout() {
  // Clear auth data
  localStorage.removeItem('user');
  // Clear cache on logout for security
  usersCache = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (e) {
    // Ignore errors
  }
  window.location.href = 'index.html';
}

// ===== EVENT LISTENERS & INITIALIZATION =====

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
  // Attach login handler to form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      login();
    });
    
    // Enter key support
    const nimInput = document.getElementById('nim');
    if (nimInput) {
      nimInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          login();
        }
      });
    }
  }

  // Dashboard initialization
  if (window.location.pathname.endsWith('dashboard.html')) {
    (async () => {
      // Preload users untuk validasi (non-blocking)
      loadUsers().catch(console.error);
      
      const user = checkAuthOrRedirect();
      if (!user) return;
      
      // Tampilkan nama user secepatnya
      const el = document.getElementById('user-info');
      if (el) {
        el.textContent = `Halo, ${user.nama} 👋`;
        // Make visible if hidden
        el.classList.remove('invisible', 'opacity-0');
      }
      
      // Attach logout handler
      const outBtn = document.getElementById('btn-logout');
      if (outBtn) {
        outBtn.addEventListener('click', logout);
      }
    })();
  }
});

// // Service Worker registration untuk caching advanced (optional)
// if ('serviceWorker' in navigator && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/')) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then(registration => console.log('SW registered: ', registration))
//       .catch(registrationError => console.log('SW registration failed: ', registrationError));
//   });
// }