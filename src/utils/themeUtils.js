/**
 * Get the current theme from localStorage or system preference.
 * Fallback is 'light'.
 */
export const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return 'light';
};

/**
 * Apply a theme and store it in localStorage.
 * Also sets the `data-theme` attribute for Tailwind or CSS variable support.
 */
export const setTheme = (theme) => {
  if (theme !== 'light' && theme !== 'dark') return;

  document.documentElement.setAttribute('data-theme', theme);
  document.body.classList.remove('light-theme', 'dark-theme');
  document.body.classList.add(`${theme}-theme`);
  localStorage.setItem('theme', theme);
};

/**
 * Toggle between light and dark themes and apply it.
 */
export const toggleTheme = () => {
  const currentTheme = getInitialTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  return newTheme;
};
