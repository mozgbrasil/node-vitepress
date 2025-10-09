(function () {
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  const append = (el) => document.head.appendChild(el);

  if (isLocal) {
    const devBase = `http://${window.location.hostname}:5002`;
    // 1) Vite client para HMR
    const viteClient = document.createElement('script');
    viteClient.type = 'module';
    viteClient.src = devBase + '/@vite/client';
    append(viteClient);

    // 2) Preâmbulo do React Fast Refresh
    const preamble = document.createElement('script');
    preamble.type = 'module';
    preamble.textContent = `
      import RefreshRuntime from '${devBase}/@react-refresh';
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
    `;
    append(preamble);

    // 3) Seu módulo (depois do preâmbulo)
    const s = document.createElement('script');
    s.type = 'module';
    s.src = devBase + '/src/index.ts';
    append(s);
  } else {
    // Ensure production env for any libs checking process.env at runtime
    const g = window;
    g.process = g.process || { env: {} };
    g.process.env = g.process.env || {};
    g.process.env.NODE_ENV = 'production';

    // Use UMD production bundle to avoid DCE warning when loading directly from CDN
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/node-web-components@latest';
    append(s);
  }
})();
