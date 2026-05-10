import puppeteer from 'puppeteer-extra';
import ProxyPlugin from 'puppeteer-extra-plugin-proxy';
import { TUI } from './tui.js';
import fs from 'fs/promises';
import { performance } from 'perf_hooks';

// ===== Modula proxy handler with rotation (HTTP/SOCKS5) =====
export class ProxyRotation {
  constructor(proxyList) {
    this.proxies = proxyList.filter(p => p.trim());
    this.currentIndex = 0;
    this.failedProxies = [];
  }

  get next() {
    if (this.proxies.length === 0) return null;
    const candidate = this.proxies[this.currentIndex % this.proxies.length];
    this.currentIndex++;
    return candidate;
  }

  markFailed(proxy) {
    if (!this.failedProxies.includes(proxy)) {
      this.failedProxies.push(proxy);
    }
    this.proxies = this.proxies.filter(p => p !== proxy);
    this.currentIndex = 0;
  }
}

// ===== Crown Nexus Engine =====
export class CrownNexusEngine {
  constructor(targetUrl, proxyList) {
    this.targetUrl = targetUrl;
    this.proxyHandler = new ProxyRotation(proxyList);
    this.browser = null;
    this.page = null;
    this.stats = {
      loadTimes: [],
      successRate: 0,
      currentProxy: 'None',
      activeTabCount: 0
    };
    this.tui = new TUI();
    this.running = false;
  }

  async init() {
    // Configure Puppeteer for maximum stealth & no trace
    puppeteer.use(
      ProxyPlugin({
        address: this.proxyHandler.next,
        onError: (err, page) => {
          this.tui.updateStats({ error: true, msg: err.message });
        }
      })
    );

    // Launch headless browser with environment isolation
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-features=TranslateUI'
      ],
      ignoreDefaultArgs: ['--enable-automation'],
      defaultViewport: null,
      timeout: 30000,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });

    this.page = await this.browser.newPage();

    // Set realistic viewport & userAgent for bypass
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Block unnecessary resources for speed
    await this.page.setRequestInterception(true);
    this.page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    this.tui.start();
    this.running = true;
  }

  async run() {
    const start = performance.now();
    let success = false;
    let errorMsg = '';

    try {
      // Navigate with timeout handling
      const response = await this.page.goto(this.targetUrl, {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 60000
      });

      const loadTime = performance.now() - start;
      this.stats.loadTimes.push(loadTime);
      if (this.stats.loadTimes.length > 20) this.stats.loadTimes.shift();

      success = response?.ok() || response?.status() < 400;
      await this.page.screenshot({ path: 'crown-nexus-screenshot.png', fullPage: true });

    } catch (err) {
      errorMsg = err.message;
      success = false;
      // Rotate proxy on failure
      this.proxyHandler.markFailed(this.stats.currentProxy);
    } finally {
      const avgLoadTime = this.stats.loadTimes.reduce((a, b) => a + b, 0) / this.stats.loadTimes.length || 0;
      this.stats.successRate = this.stats.successRate * 0.9 + (success ? 0.1 : 0);
      this.stats.currentProxy = this.proxyHandler.proxies[0] || 'None';

      this.tui.updateStats({
        loadTime: avgLoadTime.toFixed(0) + 'ms',
        successRate: (this.stats.successRate * 100).toFixed(1) + '%',
        proxy: this.stats.currentProxy.substring(0, 30),
        status: success ? '✅' : '❌ ' + errorMsg,
        lastProxy: this.proxyHandler.next?.substring(0, 20) ?? 'None'
      });
    }

    await this.close();
    return success;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.running = false;
    }
  }
}

// ===== CLI entry point =====
if (import.meta.url === new URL(import.meta.url).href) {
  (async () => {
    const args = process.argv.slice(2);
    const targetUrl = args[0] || 'https://www.google.com';
    const proxyFile = args[1] || 'proxies.txt';

    let proxyList = [];
    try {
      const data = await fs.readFile(proxyFile, 'utf-8');
      proxyList = data.split('\n').filter(p => p.trim()).map(p => p.trim());
    } catch {
      proxyList = ['http://localhost:8080']; // fallback dummy
    }

    const engine = new CrownNexusEngine(targetUrl, proxyList);
    await engine.init();

    const result = await engine.run();
    await engine.tui.stop();
    process.exit(result ? 0 : 1);
  })();
}