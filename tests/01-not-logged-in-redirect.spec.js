// ============================================================
// สถานการณ์ (1): ไม่ล็อกอินแล้วเปิดแอปไม่ได้
// js/auth-guard.js#requireLogin() ต้องเด้งไป login.html ทุกหน้าที่ป้องกันไว้
// ============================================================
const { test, expect } = require("@playwright/test");

test("ไม่ได้ล็อกอิน เปิด index.html หรือ new-request.html แล้วถูกเด้งไป login.html", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page).toHaveURL(/\/login\.html/);

  await page.goto("/new-request.html");
  await expect(page).toHaveURL(/\/login\.html/);
});
