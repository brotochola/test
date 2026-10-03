import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: "new",
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--hide-scrollbars",
    "--window-size=720,1280",
  ],
});
const page = await browser.newPage();
page.setDefaultTimeout(20000);
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => console.log("CONSOLE", m.type(), m.text()));
await page.setViewport({ width: 720, height: 1280, deviceScaleFactor: 1 });
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.waitForSelector("canvas");
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: "D:/simula.ad/tmp/splash.png" });
const canvas = await page.$("canvas");
const box = await canvas.boundingBox();
console.log("canvas", box);
await canvas.click({ offset: { x: box.width / 2, y: box.height * 0.89 } });
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: "D:/simula.ad/tmp/tutorial.png" });
await browser.close();
