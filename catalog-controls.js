(() => {
  'use strict';

  function productHref(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const protocol = new URL(value, window.location.href).protocol;
      const allowed = protocol === 'https:' || protocol === 'http:' || (protocol === 'file:' && location.protocol === 'file:');
      return allowed ? value : null;
    } catch {
      return null;
    }
  }

  function bindFilter(root, onChange) {
    const trigger = root.querySelector('.catalog-filter-trigger');
    const panel = root.querySelector('.catalog-filter-panel');
    const close = panel.querySelector('.catalog-filter-close');

    function closePanel(restoreFocus = true) {
      if (panel.hidden) return;
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus) trigger.focus({ preventScroll: true });
    }

    trigger.addEventListener('click', () => {
      if (!panel.hidden) {
        closePanel();
        return;
      }
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      (panel.querySelector('input:checked') ?? close).focus({ preventScroll: true });
    });
    close.addEventListener('click', () => closePanel());
    panel.addEventListener('change', event => {
      if (event.target.matches('input[type=radio]:checked')) onChange(event.target.value);
    });
    root.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || panel.hidden) return;
      event.preventDefault();
      closePanel();
    });
    root.addEventListener('focusout', event => {
      if (event.relatedTarget && !root.contains(event.relatedTarget)) closePanel(false);
    });
    document.addEventListener('pointerdown', event => {
      if (!root.contains(event.target)) closePanel(false);
    });
  }

  window.catalogControls = { bindFilter, productHref };
})();
