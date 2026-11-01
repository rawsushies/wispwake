import { chromium } from '/root/.bun/install/global/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('docs/screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function savePngAndWebp(page, baseName) {
  const pngPath = path.join(OUT_DIR, `${baseName}.png`);
  const webpPath = path.join(OUT_DIR, `${baseName}.webp`);
  await page.screenshot({ path: pngPath });

  const pngBase64 = fs.readFileSync(pngPath).toString('base64');
  const webpBase64 = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await new Promise((res) => {
      img.onload = res;
    });
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return c.toDataURL('image/webp', 0.92).split(',')[1];
  }, pngBase64);

  fs.writeFileSync(webpPath, Buffer.from(webpBase64, 'base64'));
}

async function runPlaytest() {
  console.log('Launching Headless Chromium for Milestone 5 Live Browser Playtest...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await sleep(1800);

  // 1. VERIFY TITLE SCREEN HAS EXACTLY 3 PRIMARY BUTTONS: PLAY, SETTINGS, CREDITS
  const navButtons = await page
    .locator('[role="navigation"][aria-label="Primary Title Navigation"] button')
    .allInnerTexts();
  const cleanedTexts = navButtons.map((t) => t.trim());
  console.log('Title Screen Primary Buttons:', cleanedTexts);
  if (
    cleanedTexts.length !== 3 ||
    cleanedTexts[0] !== 'PLAY' ||
    cleanedTexts[1] !== 'SETTINGS' ||
    cleanedTexts[2] !== 'CREDITS'
  ) {
    throw new Error(`Expected exactly [PLAY, SETTINGS, CREDITS], got ${JSON.stringify(cleanedTexts)}`);
  }

  await savePngAndWebp(page, 'title-screen');
  console.log('  ✓ Captured title-screen.webp (3 primary buttons verified)');

  // 2. VERIFY CREDITS -> ABOUT WISPWAKE MODAL & GITHUB LINK
  await page.click('[data-testid="title-btn-credits"]');
  await sleep(400);
  const aboutVisible = await page.locator('[data-testid="about-wispwake-modal"]').isVisible();
  const githubHref = await page
    .locator('[data-testid="about-wispwake-modal"] a[href="https://github.com/rawsushies/wispwake"]')
    .getAttribute('href');
  if (!aboutVisible || githubHref !== 'https://github.com/rawsushies/wispwake') {
    throw new Error('About Wispwake modal or GitHub link missing');
  }
  await savePngAndWebp(page, 'about-wispwake');
  console.log('  ✓ Verified ABOUT WISPWAKE modal & external GitHub repository link');
  await page.keyboard.press('Escape');
  await sleep(300);

  // 3. VERIFY PLAY -> COMBINED PLAY SELECTION INTERFACE (STORY JOURNEY + WAKE TRIALS)
  await page.click('[data-testid="title-btn-play"]');
  await sleep(400);
  const playModalVisible = await page.locator('[data-testid="play-selection-modal"]').isVisible();
  if (!playModalVisible) {
    throw new Error('Combined Play Selection modal did not open');
  }

  const marshLockedDisabled = await page
    .locator('[data-testid="locked-chapter-moonlit_marsh"]')
    .isDisabled();
  if (!marshLockedDisabled) {
    throw new Error('Locked Chapter 02 button must be disabled');
  }
  await savePngAndWebp(page, 'play-selection-story');

  // Switch to Wake Trials tab
  await page.click('[data-testid="tab-wake-trials"]');
  await sleep(300);
  await page.click('[data-testid="trial-diff-extreme"]');
  await sleep(250);
  await savePngAndWebp(page, 'play-selection-trials');
  console.log('  ✓ Verified Combined Play Selection Interface (Story Journey + Wake Trials)');

  // Switch back to Story Journey and launch Chapter 01
  await page.click('[data-testid="tab-story-journey"]');
  await sleep(250);
  await page.click('[data-testid="start-chapter-sleeping_canopy"]');
  await sleep(800);

  // 4. CAPTURE PIP COMPANION SPEECH BUBBLE
  await savePngAndWebp(page, 'pip-companion');
  console.log('  ✓ Captured pip-companion.webp');

  // 5. RUN NIMA ACROSS TERRACES & CAPTUREBIOMECHANICAL RUNNING STRIDE
  await page.keyboard.down('KeyD');
  await sleep(600);
  await savePngAndWebp(page, 'nima-animation');
  console.log('  ✓ Captured nima-animation.webp (Nima mid-run with articulated stride)');

  // Jump up onto the second terrace (sc_p02_step) and third bough into 02. The Dormant Garden
  await page.keyboard.down('Space');
  await sleep(280);
  await page.keyboard.up('Space');
  await sleep(900);
  await page.keyboard.down('Space');
  await sleep(280);
  await page.keyboard.up('Space');
  await sleep(1600);
  await page.keyboard.up('KeyD');

  await savePngAndWebp(page, 'sleeping-canopy-gameplay');

  // Trigger Wake pulse in 02. The Dormant Garden to open the first Bloom platform and capture circular Wake wave
  await page.keyboard.press('KeyE');
  await sleep(150);
  await savePngAndWebp(page, 'dynamic-lighting');
  console.log('  ✓ Captured sleeping-canopy-gameplay.webp & dynamic-lighting.webp (Wake pulse + Bloom opening)');

  // 6. UNLOCK ALL CHAPTERS IN LOCALSTORAGE & RELOAD TO CAPTURE CHAPTERS 02 & 03
  await page.evaluate(() => {
    const raw = window.localStorage.getItem('wispwake_save_v2');
    if (raw) {
      const data = JSON.parse(raw);
      data.chapters.moonlit_marsh.unlocked = true;
      data.chapters.hollow_below.unlocked = true;
      data.chapters.windward_ruins.unlocked = true;
      window.localStorage.setItem('wispwake_save_v2', JSON.stringify(data));
    }
  });

  await page.reload({ waitUntil: 'networkidle' });
  await sleep(1400);

  // Launch Chapter 02 (Moonlit Marsh)
  await page.click('[data-testid="title-btn-play"]');
  await sleep(350);
  await page.click('[data-testid="start-chapter-moonlit_marsh"]');
  await sleep(800);
  await page.keyboard.down('KeyD');
  await sleep(950);
  await page.keyboard.up('KeyD');
  await page.keyboard.press('KeyE');
  await sleep(160);
  await savePngAndWebp(page, 'moonlit-marsh');
  console.log('  ✓ Captured moonlit-marsh.webp');

  // Launch Chapter 03 (The Hollow Below)
  await page.keyboard.press('Escape');
  await sleep(350);
  await page.click('text=Story Journey & Wake Trials');
  await sleep(350);
  await page.click('[data-testid="start-chapter-hollow_below"]');
  await sleep(800);
  await page.keyboard.down('KeyD');
  await sleep(950);
  await page.keyboard.up('KeyD');
  await page.keyboard.press('KeyE');
  await sleep(160);
  await savePngAndWebp(page, 'organic-environments');
  console.log('  ✓ Captured organic-environments.webp (The Hollow Below)');

  if (consoleErrors.length > 0) {
    console.warn('Browser page errors:', consoleErrors);
  } else {
    console.log('  ✓ Zero runtime page errors during full browser playtest!');
  }

  await browser.close();
}

runPlaytest().catch((err) => {
  console.error(err);
  process.exit(1);
});
