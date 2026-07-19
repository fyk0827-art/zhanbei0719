/**
 * 联调脚本：模拟「付费解锁后」AI 深度报告生成
 * 运行：npx tsx scripts/test-ai-after-pay.ts
 */
import { generateBirthReport500 } from "../src/generator/services/birthReport500";
import { generateReportText } from "../src/generator/services/reportGenerator";
import type { NatalChart } from "../src/generator/services/astrologyEngine";

const mockChart = {
  birthData: {
    year: 1990, month: 6, day: 15, hour: 14, minute: 30,
    latitude: 39.9, longitude: 116.4, timezone: 8,
    gender: "female" as const, name: "联调测试",
  },
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
} satisfies NatalChart;

async function main() {
  console.log("=== 步骤1：生成500字预览报告 ===");
  const preview = generateBirthReport500(mockChart);
  console.log("预览报告字数:", preview.replace(/[#*\-\s\n]/g, "").length);
  console.log(preview.slice(0, 180), "...\n");

  console.log("=== 步骤2：模拟付费解锁 → 将500字报告发给 AI ===");
  console.log("（最多等待 60 秒，收到内容即输出预览）\n");

  let lastLen = 0;
  const poll = setInterval(() => {
    if (lastLen > 200) {
      console.log(`… 已收到 ${lastLen} 字`);
    }
  }, 5000);

  try {
    const text = await Promise.race([
      generateReportText(mockChart, "full", (t) => { lastLen = t.length; }, preview),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT_PARTIAL")), 60000)
      ),
    ]);
    clearInterval(poll);
    console.log("✅ AI 报告生成完成，总字数:", text.replace(/[#*\-\s\n]/g, "").length);
    console.log("--- AI 报告开头 ---");
    console.log(text.slice(0, 800));
  } catch (e) {
    clearInterval(poll);
    if (e instanceof Error && e.message === "TIMEOUT_PARTIAL" && lastLen > 300) {
      console.log("⏱ 60秒内未完整结束，但已收到", lastLen, "字 → AI 链路正常");
      process.exit(0);
    }
    console.error("❌ AI 生成失败:", e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

main();
