// ============================================================
// ฟังก์ชันช่วยที่ใช้ร่วมกันหลายไฟล์เทสต์
// อ้างอิง selector จากโค้ดจริงใน login.html/js/login.js และ new-request.html/js/new-request.js เท่านั้น
// ============================================================
const testAccounts = require("./fixtures/test-accounts");

// อีเมลที่ไม่ชนกันเวลารันซ้ำ — ใช้ Date.now() + เลขสุ่มต่อท้าย
function uniqueEmail(tag) {
  const stamp = Date.now() + "-" + Math.floor(Math.random() * 10000);
  return `${testAccounts.emailPrefix}.${tag}.${stamp}@${testAccounts.emailDomain}`;
}

// สมัครสมาชิกใหม่ผ่านฟอร์มจริง (#formSignup) แล้วรอจนถูกพาไปหน้า index.html
// บัญชีใหม่ทุกบัญชีเริ่มต้นเป็น role: "student" เสมอ (บังคับโดย firestore.rules)
async function signup(page, { name, email, password }) {
  await page.goto("/login.html");
  await page.locator("#tabSignup").click();
  await page.locator("#signupName").fill(name);
  await page.locator("#signupEmail").fill(email);
  await page.locator("#signupPassword").fill(password);
  await page.locator("#formSignup button[type=submit]").click();
  await page.waitForURL(/index\.html/, { timeout: 15000 });
}

// เข้าสู่ระบบด้วยบัญชีที่มีอยู่แล้ว ผ่านฟอร์มจริง (#formLogin)
async function login(page, { email, password }) {
  await page.goto("/login.html");
  await page.locator("#loginEmail").fill(email);
  await page.locator("#loginPassword").fill(password);
  await page.locator("#formLogin button[type=submit]").click();
  await page.waitForURL(/index\.html/, { timeout: 15000 });
}

// กรอกฟอร์มยื่นคำร้องใหม่ให้ครบทุกช่องที่มี * แล้วกด "บันทึกคำร้อง"
// ต้องรอให้ #typeId โหลดตัวเลือกจริงจาก Firestore เสร็จก่อน (ณ จุดนั้น main() ใน
// js/new-request.js เพิ่งจะผูก submit listener เสร็จพอดี — ดูลำดับใน main())
async function submitNewRequest(page, { reason }) {
  await page.goto("/new-request.html");
  await page.waitForFunction(() => {
    const sel = document.querySelector("#typeId");
    return !!sel && sel.options.length > 1;
  }, { timeout: 15000 });

  await page.locator("#phone").fill("0812345678");
  await page.locator("#semester").selectOption("ต้น");
  await page.locator("#academicYear").fill("2569");
  await page.locator("#reason").fill(reason);
  await page.locator("#typeId").selectOption({ index: 1 });

  await page.locator("#btnSubmit").click();
  await page.waitForURL(/index\.html/, { timeout: 15000 });
}

module.exports = { testAccounts, uniqueEmail, signup, login, submitNewRequest };
