// @ts-check
const { defineConfig, devices } = require("@playwright/test");

// FlowU เป็นเว็บ static ธรรมดา ไม่มี build step และไม่มี npm dev script
// ใช้ static server เดียวกับที่ .claude/launch.json ใช้ตอนพัฒนา (python3 -m http.server)
module.exports = defineConfig({
  testDir: "./tests",
  outputDir: "./playwright-artifacts",
  workers: 1, // จงใจรันทีละเทสต์ — ทุกเทสต์ยิงใส่โปรเจกต์ Firebase จริงชุดเดียวกัน รันพร้อมกันจะเสี่ยง flaky
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:4180",
    trace: "on-first-retry",
  },
  webServer: {
    command: "python3 -m http.server 4180",
    url: "http://localhost:4180",
    reuseExistingServer: true,
    timeout: 10000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
