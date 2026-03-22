// ========== DARK MODE FUNCTIONALITY ==========
document.addEventListener('DOMContentLoaded', () => {
    const darkToggle = document.getElementById('darkToggle');
    const themeIcon = document.getElementById('themeIcon');
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark' || 
       (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark');
        if (themeIcon) themeIcon.textContent = '☀️';
    } else {
        htmlElement.classList.remove('dark');
        if (themeIcon) themeIcon.textContent = '🌙';
    }

    darkToggle?.addEventListener('click', () => {
        htmlElement.classList.toggle('dark');

        const isDark = htmlElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        if (themeIcon) themeIcon.textContent = isDark ? '☀️' : '🌙';
    });
});