import { products } from "./main.js";
console.log(products);

// Mobile menu toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenu = document.getElementById('mobileMenu');

mobileMenuToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');
});

// Dark mode toggle
const darkToggle = document.getElementById('darkToggle');
const themeIcon = document.getElementById('themeIcon');

// Check for saved theme preference
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
  themeIcon.textContent = '☀️';
} else {
  document.documentElement.classList.remove('dark');
  themeIcon.textContent = '🌙';
}

darkToggle.addEventListener('click', () => {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.theme = 'light';
    themeIcon.textContent = '🌙';
  } else {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
    themeIcon.textContent = '☀️';
  }
});
