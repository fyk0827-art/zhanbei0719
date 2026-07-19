/**
 * 联调脚本：验证 500 字规则引擎（无需浏览器 / 后端）
 * 运行：node scripts/test-birth-report500.mjs
 */
import { readFileSync } from "fs";
import { pathToFileURL } from "url";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// 动态加载编译后的逻辑较复杂，直接内联最小 mock 测试 birthReport500 导出
// 通过 vite-node 或 tsx 运行 ts 源文件
const tsPath = join(root, "src/generator/services/birthReport500.ts");

async function main() {
  let generateBirthReport500, isPreviewReport500;
  try {
    const mod = await import(pathToFileURL(tsPath).href);
    generateBirthReport500 = mod.generateBirthReport500;
    isPreviewReport500 = mod.isPreviewReport500;
  } catch {
    console.log("⚠ 无法直接 import .ts，改用 npx tsx 运行...");
    const { execSync } = await import("child_process");
    execSync(`npx tsx "${join(root, "scripts/test-birth-report500-runner.ts")}"`, {
      stdio: "inherit",
      cwd: root,
    });
    return;
  }

  const mockChart = {
    birthData: { year: 1990, month: 6, day: 15, hour: 14, minute: 30, latitude: 39.9, longitude: 116.4, timezone: 8, gender: "female", name: "测试用户" },
    risingSign: "处女座",
    sunSign: "双子座",
    moonSign: "巨蟹座",
    planets: [
      { name: "太阳", sign: "双子座", house: 10, signDegree: 24, longitude: 84, body: 0, latitude: 0, speed: 1, isRetrograde: false },
      { name: "月亮", sign: "巨蟹座", house: 11, signDegree: 5, longitude: 95, body: 1, latitude: 0, speed: 1, isRetrograde: false },
      { name: "水星", sign: "双子座", house: 9, signDegree: 12, longitude: 72, body: 2, latitude: 0, speed: 1, isRetrograde: false },
      { name: "金星", sign: "金牛座", house: 8, signDegree: 20, longitude: 50, body: 3, latitude: 0, speed: 1, isRetrograde: false },
      { name: "火星", sign: "白羊座", house: 7, signDegree: 8, longitude: 8, body: 4, latitude: 0, speed: 1, isRetrograde: false },
      { name: "木星", sign: "巨蟹座", house: 10, signDegree: 15, longitude: 105, body: 5, latitude: 0, speed: 1, isRetrograde: false },
      { name: "土星", sign: "摩羯座", house: 4, signDegree: 25, longitude: 295, body: 6, latitude: 0, speed: 1, isRetrograde: false },
      { name: "天王星", sign: "摩羯座", house: 4, signDegree: 8, longitude: 278, body: 7, latitude: 0, speed: 1, isRetrograde: false },
      { name: "海王星", sign: "摩羯座", house: 4, signDegree: 12, longitude: 282, body: 8, latitude: 0, speed: 1, isRetrograde: false },
      { name: "冥王星", sign: "天蝎座", house: 2, signDegree: 15, longitude: 225, body: 9, latitude: 0, speed: 1, isRetrograde: false },
    ],
    houses: Array.from({ length: 12 }, (_, i) => ({
      house: i + 1,
      sign: ["处女座", "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座", "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座"][i],
      longitude: i * 30,
      signDegree: 0,
    })),
    angles: { ascendantSign: "处女座", mcSign: "双子座", ascendant: 150, mc: 60, descendant: 330, ic: 240 },
    aspects: [],
    julianDay: 2448058,
  };

  const report = generateBirthReport500(mockChart);
  const ok = report.includes("500字人生剧本") && report.includes("## 真正的你") && report.includes("测试用户");
  console.log(ok ? "✅ 500字报告生成成功" : "❌ 500字报告生成失败");
  console.log("字数:", report.replace(/[#*\-\s\n]/g, "").length);
  console.log("--- 报告预览（前500字）---");
  console.log(report.slice(0, 500));
  console.log(isPreviewReport500(report) ? "✅ isPreviewReport500 识别正确" : "❌ isPreviewReport500 识别失败");
}

main().catch((e) => { console.error(e); process.exit(1); });
