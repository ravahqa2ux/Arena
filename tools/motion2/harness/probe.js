const path = require('path');
const { execSync } = require('child_process');
const G = execSync('npm root -g').toString().trim();
const { chromium } = require(path.join(G, '@playwright/mcp/node_modules/playwright'));
const bins = {
  shell: '/inner_container/opt/playwright/chromium_headless_shell-1232/chrome-headless-shell-linux64/chrome-headless-shell',
  chrome: '/inner_container/opt/playwright/chromium-1232/chrome-linux64/chrome',
};
(async () => {
  for (const [name, bin] of Object.entries(bins)) {
    for (const extra of [[], ['--disable-crash-reporter', '--disable-crashpad-for-testing', '--no-zygote']]) {
      try {
        const b = await chromium.launch({ executablePath: bin, headless: true, timeout: 30000,
          args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...extra] });
        const p = await b.newPage();
        const r = await p.evaluate(() => {
          const c = document.createElement('canvas');
          const gl = c.getContext('webgl2');
          if (!gl) return 'no webgl2';
          const d = gl.getExtension('WEBGL_debug_renderer_info');
          return gl.getParameter(d ? d.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
        });
        console.log('OK', name, extra.join(' '), '=>', r);
        await b.close();
      } catch (e) { console.log('FAIL', name, extra.join(' '), String(e.message).split('\n')[0]); }
    }
  }
})();
