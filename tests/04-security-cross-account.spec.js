// ============================================================
// สถานการณ์ (5): บัญชีที่สองอ่านข้อมูลคำร้องของบัญชีแรกไม่ได้ (เทสต์ความปลอดภัย)
// firestore.rules → match /internshipRequests/{requestId} → allow read เฉพาะเจ้าของ
// (studentId == request.auth.uid) หรือ approver/staff เท่านั้น
//
// ใช้ browser context แยกกันคนละอันสำหรับนักศึกษา A และ B แทนการ signOut() แล้ว signup ต่อในหน้า
// เดิม — ให้ผลลัพธ์เดียวกับ "ออกจากระบบแล้วสมัครใหม่" (session ของแต่ละคนแยกกันเด็ดขาด) แต่ตัด
// ความเสี่ยงเรื่อง timing ของ signOut() ที่เป็น async ออกไป
// ============================================================
const { test, expect } = require("@playwright/test");
const { testAccounts, uniqueEmail, signup, submitNewRequest } = require("./helpers");

test("นักศึกษา B เปิดคำร้องของนักศึกษา A ตรง ๆ ด้วย id ต้องเจอหน้าโหลดไม่สำเร็จ ไม่ใช่ข้อมูลจริง", async ({ browser }) => {
  const password = testAccounts.password;

  // ── นักศึกษา A: ยื่นคำร้องจริง แล้วเก็บ requestId ไว้ ──
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const nameA = "นักศึกษาทดสอบความปลอดภัย A " + Date.now();

  await signup(pageA, { name: nameA, email: uniqueEmail("secA"), password });
  await submitNewRequest(pageA, { reason: "เทสต์อัตโนมัติ: คำร้องส่วนตัวของนักศึกษา A ห้ามให้คนอื่นอ่าน" });

  const rowA = pageA.locator("#tbody tr", { hasText: nameA });
  await expect(rowA).toBeVisible({ timeout: 15000 });
  await rowA.click();
  await pageA.waitForURL(/request-detail\.html\?id=/, { timeout: 15000 });
  const requestIdA = new URL(pageA.url()).searchParams.get("id");
  expect(requestIdA).toBeTruthy();

  await contextA.close();

  // ── นักศึกษา B: สมัครแยกต่างหาก แล้วเปิดลิงก์คำร้องของ A ตรง ๆ ──
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();

  await signup(pageB, { name: "นักศึกษาทดสอบความปลอดภัย B " + Date.now(), email: uniqueEmail("secB"), password });
  await pageB.goto("/request-detail.html?id=" + encodeURIComponent(requestIdA));

  // showBoxError() ใน js/request-detail.js เรนเดอร์ <p> ที่ขึ้นต้นด้วย "โหลดข้อมูลไม่สำเร็จ"
  // เมื่อ getDoc() โดน permission-denied จาก firestore.rules — ต้องไม่เห็นข้อมูลจริงของ A เด็ดขาด
  const box = pageB.locator("#requestBox");
  await expect(box).toContainText("โหลดข้อมูลไม่สำเร็จ", { timeout: 15000 });
  await expect(box).not.toContainText("เทสต์อัตโนมัติ: คำร้องส่วนตัวของนักศึกษา A");

  await contextB.close();
});
