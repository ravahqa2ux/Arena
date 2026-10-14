// Shared Playwright helpers for driving the ARENA build headlessly.
const path = require('path');
const { execSync } = require('child_process');

const G = execSync('npm root -g').toString().trim();
const { chromium } = require(path.join(G, '@playwright/mcp/node_modules/playwright'));

const CHROME =
  '/inner_container/opt/playwright/chromium_headless_shell-1232/chrome-headless-shell-linux64/chrome-headless-shell';
const HOME = '/projects/sandbox/_work/home';

async function launch({ file, width = 1280, height = 720, debug = true } = {}) {
  require('fs').mkdirSync(HOME, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    env: { ...process.env, HOME },
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--autoplay-policy=no-user-gesture-required',
      '--mute-audio',
    ],
  });
  const page = await browser.newPage({ viewport: { width, height } });
  const logs = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack || ''}`));
  if (debug) await page.addInitScript(() => { globalThis.ARENA_DEBUG_HOOK = true; });
  await page.goto('file://' + file, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => globalThis.__arena && globalThis.__arena.store.get().boot.ready, null, {
    timeout: 240000,
    polling: 500,
  });
  return { browser, page, logs };
}

async function startMatch(page, opts = {}) {
  await page.evaluate((o) => {
    const { game, store } = globalThis.__arena;
    store.set({ settings: { ...store.get().settings, quality: o.quality || 'baixa' } });
    if (o.weather || o.timeOfDay) store.set({ matchSettings: { ...store.get().matchSettings, ...o } });
    o.training ? game.startTraining() : game.startMatch();
    store.get().go('match');
  }, opts);
  await page.waitForFunction(() => globalThis.__arena.game.actors.length > 0, null, { timeout: 120000 });
}

module.exports = { launch, startMatch, chromium, CHROME };
