// ============================================================
// สถานการณ์ (4) เส้นทางหลักของระบบ + (2) ปุ่มเปลี่ยนสถานะทำงานจริง (ดูหมายเหตุใน 3b)
//
// (3a) นักศึกษาทดลองยื่นคำร้องจริงผ่านฟอร์ม → ต้องไปโผล่ในตาราง index.html ของตัวเอง
//      → กดเข้าไปดูรายละเอียด → สถานะต้องเป็น "รอพิจารณา"
// (3b) หมายเหตุความเป็นจริงของโจทย์: สัปดาห์นี้ (8) firestore.rules ห้าม self-service เลื่อน role
//      ('users/{uid}'.allow update ห้ามแตะ role/approvalLevel, 'allow create' บังคับ role=="student"
//      เท่านั้น) ดังนั้นบัญชีที่สมัครใหม่ผ่าน UI จะเป็น "approver" ไม่ได้เลยโดยไม่มีคนไปแก้ผ่าน
//      Firebase Console เอง — เราจึงพิสูจน์ "ฝั่งตรงข้าม" แทน (ยังคงเป็นเทสต์ปุ่มเปลี่ยนสถานะที่
//      ผูกกับ Firestore จริง): บัญชี role student (แม้เป็นเจ้าของคำร้องเอง) ต้อง "ไม่เห็น" ปุ่ม
//      เห็นด้วย/ไม่เห็นด้วย/อนุมัติ/ไม่อนุมัติ บนหน้า request-detail.html ของคำร้องนั้น เพราะเงื่อนไข
//      canReview ใน js/request-detail.js กำหนดไว้ชัดว่า role ต้องเป็น "approver" เท่านั้น
// ============================================================
const { test, expect } = require("@playwright/test");
const { testAccounts, uniqueEmail, signup, login, submitNewRequest } = require("./helpers");

// (3c) ฝั่ง positive ของสถานการณ์ (2): บัญชี approver ถาวรที่ตั้งค่า role/approvalLevel ไว้ล่วงหน้า
// ผ่าน Firebase Console แล้ว (เก็บไว้ใน tests/fixtures/test-accounts.js ที่ gitignore ไว้ — ดูเหตุผลที่
// ชุดทดสอบสมัครบัญชี approver เองไม่ได้ในหมายเหตุของ 3b ด้านบน) ใช้ยืนยันว่าปุ่มเปลี่ยนสถานะ "ทำงานจริง"
// คือกดแล้วค่าใน Firestore เปลี่ยนจริง ไม่ใช่แค่ UI ชั่วคราว — พิสูจน์ด้วยการโหลดหน้าใหม่แล้วเช็คซ้ำ

test.describe.serial("เส้นทางหลักของระบบ: ยื่นคำร้อง → เห็นในตาราง → ดูรายละเอียด", () => {
  const shared = {
    studentName: "นักศึกษาทดสอบ Lifecycle " + Date.now(),
    studentEmail: uniqueEmail("lifecycle"),
    password: testAccounts.password,
    reason: "เทสต์อัตโนมัติ: เหตุผลของคำร้องทดสอบเส้นทางหลักของระบบ",
    requestId: null,
  };

  test("3a. ยื่นคำร้องใหม่แล้วเห็นในตารางของตัวเอง สถานะเริ่มต้นเป็น รอพิจารณา", async ({ page }) => {
    await signup(page, {
      name: shared.studentName,
      email: shared.studentEmail,
      password: shared.password,
    });

    await submitNewRequest(page, { reason: shared.reason });

    // กลับมาที่ index.html แล้วต้องเห็นแถวคำร้องของตัวเอง (นักศึกษาเห็นเฉพาะของตัวเองตาม firestore.rules)
    const row = page.locator("#tbody tr", { hasText: shared.studentName });
    await expect(row).toBeVisible({ timeout: 15000 });

    await row.click();
    await page.waitForURL(/request-detail\.html\?id=/, { timeout: 15000 });

    const url = new URL(page.url());
    shared.requestId = url.searchParams.get("id");
    expect(shared.requestId).toBeTruthy();

    await expect(page.locator("#requestBox")).toContainText("รอพิจารณา", { timeout: 15000 });
  });

  test("3b. บัญชี role student ไม่เห็นปุ่มเปลี่ยนสถานะบนคำร้องของตัวเอง", async ({ page }) => {
    test.skip(!shared.requestId, "ต้องรัน 3a สำเร็จก่อนถึงจะมี requestId");

    await login(page, { email: shared.studentEmail, password: shared.password });
    await page.goto("/request-detail.html?id=" + encodeURIComponent(shared.requestId));

    await expect(page.locator("#requestBox")).toContainText("รอพิจารณา", { timeout: 15000 });

    // canReview ใน js/request-detail.js ต้องการ profile.role === "approver" — บัญชีนี้เป็น student
    // จึงต้องไม่มีปุ่มพิจารณาใด ๆ ปรากฏเลย ไม่ว่าจะเป็นระดับความเห็นหรือระดับตัดสินสุดท้าย
    await expect(page.locator("#btnAgree")).toHaveCount(0);
    await expect(page.locator("#btnDisagree")).toHaveCount(0);
    await expect(page.locator("#btnApprove")).toHaveCount(0);
    await expect(page.locator("#btnReject")).toHaveCount(0);
  });

  test("3c. บัญชี approver กดปุ่มเปลี่ยนสถานะ แล้วค่าจริงเปลี่ยนใน Firestore (ฝั่ง positive)", async ({ page }) => {
    test.skip(!shared.requestId, "ต้องรัน 3a สำเร็จก่อนถึงจะมี requestId");
    test.skip(!testAccounts.approver, "ต้องมีบัญชี approver ถาวรใน tests/fixtures/test-accounts.js ก่อน");

    await login(page, testAccounts.approver);
    await page.goto("/request-detail.html?id=" + encodeURIComponent(shared.requestId));
    await expect(page.locator("#requestBox")).toContainText("รอพิจารณา", { timeout: 15000 });

    // ระดับ 1 เป็นระดับความเห็น (opinion) สำหรับสายอนุมัติ 6 ระดับมาตรฐานของโปรเจกต์นี้ → ปุ่ม "เห็นด้วย"
    const btnAgree = page.locator("#btnAgree");
    await expect(btnAgree).toBeVisible({ timeout: 15000 });
    await btnAgree.click();

    // หลังกด ต้องรีเรนเดอร์ทันทีให้ปุ่มเดิมหายไป (canReview ประเมินใหม่จาก currentLevel ที่เปลี่ยนแล้ว)
    await expect(page.locator("#btnAgree")).toHaveCount(0, { timeout: 15000 });

    // พิสูจน์ว่าเป็นการเปลี่ยนแปลงจริงใน Firestore ไม่ใช่แค่ UI ชั่วคราว: โหลดหน้าใหม่ทั้งหมดแล้วเช็คซ้ำ
    await page.reload();
    await expect(page.locator("#requestBox")).toContainText("ระดับ 2", { timeout: 15000 });
    await expect(page.locator("#timeline")).toContainText("เห็นด้วย", { timeout: 15000 });
  });
});
