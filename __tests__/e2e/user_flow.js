const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting E2E User Flow Test...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Navigate to the local server
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle2' });
  
  // 1. Check Splash Screen
  console.log('Checking Splash Screen...');
  await page.waitForSelector('#splash', { visible: true });
  await page.waitForSelector('#tab-guest', { visible: true });

  // 2. Login as Guest
  console.log('Logging in as Guest...');
  await page.click('#tab-guest');
  
  // Enter name
  await page.waitForSelector('#student-name-input', { visible: true });
  await page.type('#student-name-input', 'Test Student');
  await page.click('#splash-start');
  
  // 3. Verify Dashboard Loads
  console.log('Verifying Dashboard...');
  await page.waitForSelector('#main-dashboard', { visible: true, timeout: 5000 });
  const dashboardTitle = await page.$eval('.dash-title', el => el.textContent);
  
  if (dashboardTitle.includes('STEP')) {
    console.log('✅ E2E Pass: Dashboard loaded.');
  } else {
    console.error('❌ E2E Fail: Dashboard did not load correctly.');
    process.exitCode = 1;
  }

  // 4. Check Track Cards are rendered
  const cards = await page.$$('.dash-card');
  if (cards.length >= 4) {
    console.log('✅ E2E Pass: Track cards are rendered.');
  } else {
    console.error('❌ E2E Fail: Track cards missing.');
    process.exitCode = 1;
  }

  await browser.close();
  console.log('E2E Test Completed.');
})();
