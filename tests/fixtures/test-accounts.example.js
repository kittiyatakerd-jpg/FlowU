// ============================================================
// แม่แบบไฟล์บัญชีทดสอบ — คัดลอกเป็น test-accounts.js (ไฟล์นั้นถูก .gitignore ไว้แล้ว)
// ชุดทดสอบไม่ได้ใช้บัญชีถาวรที่มีอยู่จริงใน Firestore — ทุกครั้งที่รันจะสมัครสมาชิกใหม่
// ผ่านหน้า UI จริง (#formSignup) ด้วยอีเมลที่สร้างจาก Date.now() เพื่อไม่ให้ชนกัน
// ไฟล์นี้จึงเก็บแค่ "รหัสผ่านที่ใช้ซ้ำ" และ "รูปแบบอีเมล" ไม่ใช่ความลับจริงจัง
// ============================================================
module.exports = {
  // รหัสผ่านเดียวกันสำหรับบัญชีทดสอบชั่วคราวทุกบัญชีที่ชุดทดสอบสมัครขึ้นมาเอง
  password: "TestPass123!",
  // อีเมลจริงที่ใช้จะเป็น `${emailPrefix}.<tag>.${Date.now()}@${emailDomain}`
  emailPrefix: "flowu.test",
  emailDomain: "flowu-test.example",
  // บัญชี approver ถาวรที่ต้องตั้งค่า role:"approver" + approvalLevel:1 เองผ่าน Firebase Console ก่อน
  // (สมัครผ่าน UI ไม่ได้ เพราะ Security Rules บังคับ role="student" ตอนสมัครเสมอ — ของจริง ไม่ใช่บั๊ก)
  approver: {
    email: "approver@example.com",
    password: "changeme",
  },
};
