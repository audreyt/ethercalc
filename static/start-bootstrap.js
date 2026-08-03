try {
  window.history.pushState({}, '', './');
} catch (_error) {
  // History mutation is optional (for example, in a sandboxed embed).
}
