// Applies the stored or system theme before the first paint, so there is no flash. Mirrors themeUtils.ts.
// Loaded as a blocking classic script from index.html (not inline, so the CSP needs no 'unsafe-inline').
(function () {
  try {
    var stored = localStorage.getItem('funkos.theme');
    var system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var theme = stored === 'light' || stored === 'dark' ? stored : system;
    document.documentElement.classList.add(theme);
  } catch {
    /* storage blocked: the provider decides after mount */
  }
})();
