const { chromium } = require(process.env.GITHUB_WORKSPACE + '/packages/e2e/node_modules/@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const temp = process.env.RUNNER_TEMP;
const base = 'http://local.sandstorm.io:6080';
const read = name => fs.readFileSync(path.join(temp, name), 'utf8').trim();
const write = (name, value) => fs.writeFileSync(path.join(temp, name), value);
async function withPage(fn) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ storageState: path.join(temp, 'sandstorm-browser.json') });
    const page = await context.newPage();
    return await fn(page);
  } finally { await browser.close(); }
}
async function grainFrame(page) {
  const frame = page.frameLocator('iframe.grain-frame');
  await frame.locator('#root, #tableeditor').first().waitFor({ state: 'attached', timeout: 30000 });
  return frame;
}
async function shutdown(grainId) {
  await withPage(async page => {
    await page.goto(base + '/grain/' + grainId);
    await page.waitForFunction(() => typeof window.Meteor !== 'undefined');
    await page.evaluate(id => new Promise((resolve, reject) => {
      window.Meteor.call('shutdownGrain', id, error => error ? reject(error) : resolve());
    }), grainId);
  });
}
async function checkMigration(grainId) {
  await withPage(async page => {
    await page.goto(base + '/grain/' + grainId);
    const frame = await grainFrame(page);
    let last = 'no response';
    for (let attempt = 0; attempt < 90; attempt++) {
      try {
        const response = await frame.locator('body').evaluate(async () => {
          const result = await fetch('/_/sheet1');
          return { status: result.status, text: await result.text() };
        });
        if (response.status === 200 && response.text.includes('CI-MIGRATED')) {
          console.log('Grain migration passed');
          return;
        }
        last = `HTTP ${response.status}: ${response.text.slice(0, 120)}`;
      } catch (error) {
        last = String(error);
      }
      await page.waitForTimeout(1000);
    }
    throw new Error(`Migrated cell was not restored: ${last}`);
  });
}
async function uploadAndBoot() {
  const testId = read('sandstorm-test-app-id');
  await withPage(async page => {
    await page.goto(base + '/upload-test');
    await page.locator('#upload-app').setInputFiles(path.join(temp, 'ethercalc-test.spk'));
    await page.locator('#step-confirm').waitFor({ state: 'visible', timeout: 240000 });
    await page.locator('#confirmInstall').click();
    await page.goto(base + '/apps/' + testId);
    const intro = page.locator('a.introjs-skipbutton');
    if (await intro.isVisible()) await intro.click();
    const create = page.locator('.grain-list-table tr.action button.action').first();
    await create.waitFor({ state: 'visible', timeout: 30000 });
    await create.click();
    await page.waitForURL(/\/grain\//);
    const grainId = page.url().split('/grain/')[1].split('/')[0];
    write('sandstorm-packaged-grain-id', grainId);
    await grainFrame(page);
    console.log('Installed temporary-ID SPK booted');
  });
}
(async () => {
  const mode = process.argv[2];
  if (mode === 'dev-shutdown') await shutdown(read('sandstorm-grain-id'));
  else if (mode === 'dev-check') await checkMigration(read('sandstorm-grain-id'));
  else if (mode === 'upload-boot') await uploadAndBoot();
  else if (mode === 'packaged-shutdown') await shutdown(read('sandstorm-packaged-grain-id'));
  else if (mode === 'packaged-check') await checkMigration(read('sandstorm-packaged-grain-id'));
  else throw new Error('Unknown browser check');
})().catch(error => { console.error(error); process.exitCode = 1; });
