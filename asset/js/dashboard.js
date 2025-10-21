document.addEventListener('DOMContentLoaded', () => {
  const copyBtn = document.getElementById('copy-btn');
  const linkInput = document.getElementById('website-link');

  // Buat elemen notifikasi dinamis (biar gak ganggu HTML)
  const toast = document.createElement('div');
  toast.className = `
    fixed bottom-6 right-6 flex items-center gap-2
    bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg
    opacity-0 translate-y-3 transition-all duration-500 select-none
    pointer-events-none text-sm font-medium
  `;
  toast.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" 
         viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
    </svg>
    <span>Tautan berhasil disalin!</span>
  `;
  document.body.appendChild(toast);

  const showToast = () => {
    toast.classList.replace('opacity-0', 'opacity-100');
    toast.classList.replace('translate-y-3', 'translate-y-0');
    setTimeout(() => {
      toast.classList.replace('opacity-100', 'opacity-0');
      toast.classList.replace('translate-y-0', 'translate-y-3');
    }, 2000);
  };

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(linkInput.value);
      showToast();
    } catch {
      alert('❌ Gagal menyalin tautan!');
    }
  });
});


    const btnToggleTheme = document.getElementById('btn-toggle-theme');
  const iconSun = document.getElementById('icon-sun');
  const iconMoon = document.getElementById('icon-moon');
  const themeLabel = document.getElementById('theme-label');

  btnToggleTheme.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');

    // Simpan preferensi
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Ganti ikon & label
    if (isDark) {
      iconSun.classList.remove('hidden');
      iconMoon.classList.add('hidden');
      themeLabel.textContent = 'Light';
    } else {
      iconSun.classList.add('hidden');
      iconMoon.classList.remove('hidden');
      themeLabel.textContent = 'Dark';
    }
  });

  // Atur tema awal
  window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      iconSun.classList.remove('hidden');
      iconMoon.classList.add('hidden');
      themeLabel.textContent = 'Light';
    } else {
      document.body.classList.add('light-mode');
      iconSun.classList.add('hidden');
      iconMoon.classList.remove('hidden');
      themeLabel.textContent = 'Dark';
    }
  });