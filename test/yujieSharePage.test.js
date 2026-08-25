import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

describe('Yujie Share Page Static Contract Tests', () => {
  const rootDir = process.cwd();

  const yujieHtmlPath = path.join(rootDir, 'yujie', 'index.html');
  const viteConfigPath = path.join(rootDir, 'vite.config.js');
  const yujieSharePagePath = path.join(rootDir, 'src', 'pages', 'YujieSharePage.jsx');
  const yujieMainPath = path.join(rootDir, 'src', 'yujie-main.jsx');
  const appPath = path.join(rootDir, 'src', 'App.jsx');
  const layoutPath = path.join(rootDir, 'src', 'components', 'Layout.jsx');
  const heroJpgPath = path.join(rootDir, 'public', 'images', 'yujie', 'yujie_share_hero.jpg');
  const imagesDir = path.join(rootDir, 'public', 'images', 'yujie');

  it('1. yujie/index.html includes canonical, OG/Twitter meta, absolute OG image, image/jpeg, dimensions, and script entry', () => {
    expect(fs.existsSync(yujieHtmlPath)).toBe(true);
    const html = fs.readFileSync(yujieHtmlPath, 'utf-8');

    expect(html).toMatch(/<link\s+rel=["']canonical["']\s+href=["']https:\/\/[^"']+\/yujie\/?["']/);
    expect(html).toMatch(/<meta\s+property=["']og:image["']\s+content=["']https:\/\/[^"']+\/images\/yujie\/yujie_share_hero\.jpg["']/);
    expect(html).toMatch(/<meta\s+property=["']og:image:type["']\s+content=["']image\/jpeg["']/);
    expect(html).toMatch(/<meta\s+property=["']og:image:width["']\s+content=["']1672["']/);
    expect(html).toMatch(/<meta\s+property=["']og:image:height["']\s+content=["']941["']/);
    expect(html).toMatch(/<meta\s+name=["']twitter:card["']\s+content=["']summary_large_image["']/);
    expect(html).toMatch(/src=["']\/src\/yujie-main\.jsx["']/);
  });

  it('2. vite.config.js configures multi-page inputs and main app files do not import share page', () => {
    expect(fs.existsSync(viteConfigPath)).toBe(true);
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');

    expect(viteConfig).toMatch(/index\.html/);
    expect(viteConfig).toMatch(/yujie\/index\.html/);

    if (fs.existsSync(appPath)) {
      const appCode = fs.readFileSync(appPath, 'utf-8');
      expect(appCode).not.toContain('YujieSharePage');
      expect(appCode).not.toContain('yujie-main');
    }

    if (fs.existsSync(layoutPath)) {
      const layoutCode = fs.readFileSync(layoutPath, 'utf-8');
      expect(layoutCode).not.toContain('YujieSharePage');
      expect(layoutCode).not.toContain('yujie-main');
    }
  });

  it('3. JSX includes link to game, canonical, share/clipboard APIs, execCommand fallback, and aria-live', () => {
    expect(fs.existsSync(yujieSharePagePath)).toBe(true);
    const jsx = fs.readFileSync(yujieSharePagePath, 'utf-8');

    expect(jsx).toContain('/games/yujie');
    expect(jsx).toMatch(/https:\/\/[^/]+\/yujie/);
    expect(jsx).toContain('navigator.share');
    expect(jsx).toContain('navigator.clipboard');
    expect(jsx).toContain('execCommand');
    expect(jsx).toContain('aria-live');
  });

  it('4. hero jpg exists and has a unique SHA-256 hash among other images in directory', () => {
    expect(fs.existsSync(heroJpgPath)).toBe(true);
    const heroBuffer = fs.readFileSync(heroJpgPath);
    const heroHash = crypto.createHash('sha256').update(heroBuffer).digest('hex');

    const files = fs.readdirSync(imagesDir);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext) && file !== 'yujie_share_hero.jpg') {
        const filePath = path.join(imagesDir, file);
        const fileBuffer = fs.readFileSync(filePath);
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        expect(fileHash).not.toBe(heroHash);
      }
    }
  });

  it('5. JSX includes 4 real still paths exactly once, renders via GALLERY_ITEMS.map, and uses lazy loading', () => {
    expect(fs.existsSync(yujieSharePagePath)).toBe(true);
    const jsx = fs.readFileSync(yujieSharePagePath, 'utf-8');

    const requiredPaths = [
      '/images/yujie/v24_ev_echo_d5.png',
      '/images/yujie/v24_ev_echo_d10.png',
      '/images/yujie/v24_ev_goose_deep.png',
      '/images/yujie/v24_route_laokuai_4.png',
    ];

    for (const imgPath of requiredPaths) {
      const occurrences = jsx.split(imgPath).length - 1;
      expect(occurrences).toBe(1);
    }

    expect(jsx).not.toContain('stills-1.webp');
    expect(jsx).not.toContain('stills-2.webp');
    expect(jsx).not.toContain('stills-3.webp');
    expect(jsx).not.toContain('stills-4.webp');

    expect(jsx).toContain('GALLERY_ITEMS.map');
    expect(jsx).toMatch(/loading=["']lazy["']/);
  });

  it('6. New share page code does not use localStorage', () => {
    expect(fs.existsSync(yujieSharePagePath)).toBe(true);
    const jsx = fs.readFileSync(yujieSharePagePath, 'utf-8');
    expect(jsx).not.toContain('localStorage');

    if (fs.existsSync(yujieMainPath)) {
      const mainCode = fs.readFileSync(yujieMainPath, 'utf-8');
      expect(mainCode).not.toContain('localStorage');
    }
  });
});
