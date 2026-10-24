/**
 * npm run capture -- --url <url> --name <file-stem> [--widths 1280,390] [--out docs/evidence/screenshots]
 *
 * Full-page screenshots at real viewport widths using Edge/Chrome over the
 * DevTools protocol (Node's built-in WebSocket; no extra dependency).
 *
 * Why not `--screenshot --window-size=390`? Headless Edge enforces a minimum
 * window width, so a "390px" capture is silently a crop of a wider layout.
 * Emulation.setDeviceMetricsOverride gives a true 390px layout viewport.
 *
 * It also MEASURES horizontal overflow (document width vs viewport width),
 * because "no horizontal scrolling" is an acceptance criterion, and prints it.
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
];

function arg(name: string, fallback?: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : fallback;
  if (value === undefined) throw new Error(`Missing ${name}`);
  return value;
}

const url = arg('--url');
const name = arg('--name');
const widths = arg('--widths', '1280,390').split(',').map(Number);
const outDir = path.resolve(arg('--out', 'docs/evidence/screenshots'));
const browser = CANDIDATES.find((candidate) => existsSync(candidate));
if (!browser) throw new Error('No Edge or Chrome found');

/** The few fields of DevTools responses this script reads. */
interface CdpResult {
  data?: string;
  result: { value: string };
}

const port = 9300 + Math.floor(Math.random() * 500);
const profile = await mkdtemp(path.join(tmpdir(), 'swo-cdp-'));
const child = spawn(
  browser,
  [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--headless=new',
    '--disable-gpu',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

async function waitForTarget(): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = (await response.json()) as Array<{
        type: string;
        webSocketDebuggerUrl: string;
      }>;
      const page = targets.find((target) => target.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // browser still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Browser did not expose a debugging target');
}

try {
  const socket = new WebSocket(await waitForTarget());
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map<number, (value: CdpResult) => void>();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    pending.get(message.id)?.(message.result);
  });
  const send = (method: string, params: object = {}) =>
    new Promise<CdpResult>((resolve) => {
      nextId += 1;
      pending.set(nextId, resolve);
      socket.send(JSON.stringify({ id: nextId, method, params }));
    });

  await mkdir(outDir, { recursive: true });
  for (const width of widths) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
    await send('Page.navigate', { url });
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const measured = await send('Runtime.evaluate', {
      returnByValue: true,
      expression:
        'JSON.stringify({ inner: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })',
    });
    const { inner, scrollWidth, height } = JSON.parse(measured.result.value) as {
      inner: number;
      scrollWidth: number;
      height: number;
    };

    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height, scale: 1 },
    });
    if (!shot.data) throw new Error(`The browser returned no image data for ${width}px`);
    const file = path.join(outDir, `${name}-${width}.png`);
    await writeFile(file, Buffer.from(shot.data, 'base64'));
    const overflow = scrollWidth > inner;
    console.log(
      `${width}px: viewport ${inner}, document ${scrollWidth}, height ${height} -> ` +
        `${overflow ? `HORIZONTAL OVERFLOW (+${scrollWidth - inner}px)` : 'no horizontal overflow'}  ${path.relative(process.cwd(), file)}`,
    );
    if (overflow) process.exitCode = 1;
  }
  socket.close();
} finally {
  child.kill();
  await new Promise((resolve) => setTimeout(resolve, 500));
  await rm(profile, { recursive: true, force: true }).catch(() => undefined);
}
