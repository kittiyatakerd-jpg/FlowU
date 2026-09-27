// ============================================================
// สถานการณ์ (3): ฟอร์มยื่นคำร้องใหม่ต้องตรวจ field บังคับก่อนบันทึก
// js/new-request.js#onSubmit() แสดง #formMsg ด้วยข้อความ "กรอกช่องที่มี * ให้ครบก่อน"
// เมื่อ phone/semester/academicYear/typeId/reason ช่องใดช่องหนึ่งว่าง
// ============================================================
const { test, expect } = require("@playwright/test");
const { testAccounts, uniqueEmail, signup } = require("./helpers");

test("ยื่นฟอร์มว่างทั้งหมด ต้องเห็นข้อความเตือนและไม่ถูกบันทึก", async ({ page }) => {
  await signup(page, {
    name: "นักศึกษาทดสอบฟอร์ม",
    email: uniqueEmail("form"),
    password: testAccounts.password,
  });

  await page.goto("/new-request.html");
  // รอให้ #typeId โหลดตัวเลือกจริงเสร็จ (main() ผูก submit listener ทันทีหลังจากนั้น)
  await page.waitForFunction(() => {
    const sel = document.querySelector("#typeId");
    return !!sel && sel.options.length > 1;
  }, { timeout: 15000 });

  await page.locator("#btnSubmit").click();

  const elMsg = page.locator("#formMsg");
  await expect(elMsg).toBeVisible();
  await expect(elMsg).toHaveText("⚠️ กรอกช่องที่มี * ให้ครบก่อน");

  // ไม่มีการนำทางออกจากหน้านี้
  await expect(page).toHaveURL(/new-request\.html/);
});
