const { spawn } = require("node:child_process");
const os = require("node:os");
const path = require("node:path");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require(path.join(
    os.homedir(),
    ".cache",
    "codex-runtimes",
    "codex-primary-runtime",
    "dependencies",
    "node",
    "node_modules",
    "playwright",
  )));
}

const workdir = __dirname;
const server = spawn(process.execPath, ["server.js"], { cwd: workdir, stdio: ["ignore", "pipe", "pipe"] });
let browser;
let url;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function state(page) {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme || document.body.dataset.theme || "",
    bodyClass: document.body.className,
    stored: localStorage.getItem("theme") || localStorage.getItem("settings.theme") || "",
    background: getComputedStyle(document.body).backgroundColor,
  }));
}

async function click(page, name) {
  const button = page.getByRole("button", { name, exact: true }).first();
  if (await button.count()) {
    await button.click();
    await page.waitForTimeout(400);
    return;
  }
  await page.getByText(name, { exact: true }).first().click();
  await page.waitForTimeout(400);
}

async function main() {
  url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Server start timeout")), 15000);
    server.stdout.on("data", (chunk) => {
      const match = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });
    server.stderr.on("data", (chunk) => process.stderr.write(chunk));
  });

  const launchOptions = { headless: true };
  if (process.env.CHROME_PATH) {
    launchOptions.executablePath = process.env.CHROME_PATH;
  }
  browser = await chromium.launch(launchOptions);
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  const initial = await state(page);

  await click(page, "Dark");
  const dark = await state(page);
  assert(
    dark.stored.toLowerCase() === "dark" || dark.theme.toLowerCase() === "dark" || dark.bodyClass.toLowerCase().includes("dark"),
    `Dark theme was not applied: ${JSON.stringify(dark)}`,
  );
  assert(dark.background !== initial.background, `Background did not change for Dark: ${JSON.stringify(dark)}`);

  await page.reload({ waitUntil: "networkidle" });
  const persisted = await state(page);
  assert(
    persisted.stored.toLowerCase() === "dark" || persisted.theme.toLowerCase() === "dark" || persisted.bodyClass.toLowerCase().includes("dark"),
    `Dark theme did not persist after reload: ${JSON.stringify(persisted)}`,
  );

  await click(page, "Light");
  const light = await state(page);
  assert(
    light.stored.toLowerCase() === "light" || light.theme.toLowerCase() === "light" || light.bodyClass.toLowerCase().includes("light"),
    `Light theme was not applied: ${JSON.stringify(light)}`,
  );
  assert(light.background !== dark.background, `Background did not change for Light: ${JSON.stringify(light)}`);

  let system = null;
  try {
    await click(page, "System");
  } catch {
    await click(page, "Reset");
  }
  system = await state(page);
  assert(
    system.stored.toLowerCase() === "system" || system.stored === "" || system.theme.toLowerCase() === "system" || system.theme === "",
    `System/reset state was not restored: ${JSON.stringify(system)}`,
  );

  console.log(JSON.stringify({
    status: "verified",
    checks: [
      "Dark applies observable theme and background change",
      "Dark persists after reload",
      "Light applies observable theme and background change",
      "System/reset restores the default state",
    ],
    initial,
    dark,
    persisted,
    light,
    system,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "failed", error: error.message }, null, 2));
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close();
  server.kill();
});
