# ผลการรันชุดทดสอบ Playwright — FlowU

รันจริงด้วย `npx playwright test` (chromium, `workers: 1`, `baseURL: http://localhost:4180`,
`webServer` สั่ง `python3 -m http.server 4180` ให้เองอัตโนมัติ) ยิงใส่โปรเจกต์ Firebase จริง
`flowu-7d1a9` — ทุกบัญชีที่ใช้เป็นบัญชีทดสอบชั่วคราวที่สมัครขึ้นใหม่ผ่านหน้า UI จริง (`#formSignup`)
ระหว่างรัน ไม่ได้แตะบัญชีจริง 2 บัญชีที่เคยใช้ทดสอบด้วยมือมาก่อนเลย

ผลลัพธ์สุดท้าย (รันซ้ำหลายครั้งเพื่อดูความเสถียร — ผ่านครบทุกครั้ง รวมทั้งหลังเพิ่มเทสต์ 3c ซึ่งใช้บัญชี
approver ถาวรที่ตั้งค่าไว้ล่วงหน้าผ่าน Firebase Console เพื่อปิดช่องว่างฝั่ง positive ที่เคยบันทึกไว้ด้านล่าง):

```
Running 6 tests using 1 worker
  ✓  1 [chromium] › tests/01-not-logged-in-redirect.spec.js › ไม่ได้ล็อกอิน เปิด index.html หรือ new-request.html แล้วถูกเด้งไป login.html
  ✓  2 [chromium] › tests/02-form-validation.spec.js › ยื่นฟอร์มว่างทั้งหมด ต้องเห็นข้อความเตือนและไม่ถูกบันทึก
  ✓  3 [chromium] › tests/03-request-lifecycle.spec.js › 3a. ยื่นคำร้องใหม่แล้วเห็นในตารางของตัวเอง สถานะเริ่มต้นเป็น รอพิจารณา
  ✓  4 [chromium] › tests/03-request-lifecycle.spec.js › 3b. บัญชี role student ไม่เห็นปุ่มเปลี่ยนสถานะบนคำร้องของตัวเอง
  ✓  5 [chromium] › tests/03-request-lifecycle.spec.js › 3c. บัญชี approver กดปุ่มเปลี่ยนสถานะ แล้วค่าจริงเปลี่ยนใน Firestore (ฝั่ง positive)
  ✓  6 [chromium] › tests/04-security-cross-account.spec.js › นักศึกษา B เปิดคำร้องของนักศึกษา A ตรง ๆ ด้วย id ต้องเจอหน้าโหลดไม่สำเร็จ ไม่ใช่ข้อมูลจริง

  6 passed (26-28s ต่อครั้ง, รันซ้ำ 2 ครั้งติดกันผ่านทั้งคู่)
```

## ตารางสรุป

| ไฟล์ | สถานการณ์ (ตามโจทย์) | ผลลัพธ์ | หมายเหตุ |
|---|---|---|---|
| `tests/01-not-logged-in-redirect.spec.js` | (1) ไม่ล็อกอินเปิดแอปไม่ได้ | ✅ ผ่าน | `page.goto("/index.html")` และ `/new-request.html` โดยไม่ล็อกอิน ทั้งคู่ถูก `requireLogin()` เด้งไป `login.html` จริง |
| `tests/02-form-validation.spec.js` | (3) ฟอร์มตรวจ field บังคับ | ✅ ผ่าน | สมัครนักศึกษาใหม่ → เปิด `new-request.html` → กด `#btnSubmit` ทั้งที่ฟอร์มว่าง → `#formMsg` ขึ้นข้อความ `"⚠️ กรอกช่องที่มี * ให้ครบก่อน"` ตรงตัว และ URL ไม่เปลี่ยน |
| `tests/03-request-lifecycle.spec.js` (3a) | (4) เส้นทางหลักของระบบ | ✅ ผ่าน | สมัครนักศึกษาใหม่ → กรอกฟอร์มจริงและบันทึก → คำร้องไปโผล่ในตาราง `#tbody` ของ `index.html` (เห็นเฉพาะของตัวเอง ตาม security rules) → กดเข้าไปดึง id จาก URL → หน้า detail แสดงสถานะ `รอพิจารณา` |
| `tests/03-request-lifecycle.spec.js` (3b) | (2) ปุ่มเปลี่ยนสถานะทำงานจริง — ฝั่งลบ (negative) | ✅ ผ่าน | บัญชี role `student` (เจ้าของคำร้องเอง) เปิด `request-detail.html` ของคำร้องตัวเอง แล้วต้อง**ไม่เห็น**ปุ่ม `#btnAgree`/`#btnDisagree`/`#btnApprove`/`#btnReject` เลยสักปุ่ม — ยืนยันว่า `canReview` ใน `js/request-detail.js` กรอง role จริง |
| `tests/03-request-lifecycle.spec.js` (3c) | (2) ปุ่มเปลี่ยนสถานะทำงานจริง — ฝั่งบวก (positive) | ✅ ผ่าน | บัญชี approver ถาวร (role/approvalLevel ตั้งไว้ล่วงหน้าผ่าน Console) เปิดคำร้องจาก 3a ที่ระดับ 1 → กด `#btnAgree` → ปุ่มหายทันที → **โหลดหน้าใหม่ทั้งหมด** แล้วเช็คซ้ำ: ระดับขึ้นเป็น 2/6 จริง และ timeline มีรายการ "เห็นด้วย" — พิสูจน์ว่าเป็นการเปลี่ยนแปลงจริงใน Firestore ไม่ใช่ UI ชั่วคราว |
| `tests/04-security-cross-account.spec.js` | (5) บัญชีที่สองอ่านข้อมูลบัญชีแรกไม่ได้ (เทสต์ความปลอดภัย) | ✅ ผ่าน | นักศึกษา B เปิด `request-detail.html?id=<ของ A>` ตรง ๆ (คนละ browser context กับ A) → `#requestBox` ขึ้น `"โหลดข้อมูลไม่สำเร็จ"` ไม่ใช่ข้อมูลจริงของ A — ยืนยันว่า `firestore.rules` ที่เพิ่งแก้ทำงานถูกต้อง |

**สรุป: 6/6 ผ่าน**, 0 ล้มเหลว, 0 ข้าม

## หมายเหตุตรงไปตรงมา: ปัญหาบัญชีทดสอบ role "approver" (ข้อ 5 ของโจทย์)

โจทย์เดิมของสถานการณ์ (2) คือ "ปุ่มเปลี่ยนสถานะทำงานจริง" ซึ่งเดิมทีตั้งใจจะทดสอบแบบ *positive*
(ล็อกอินเป็นผู้พิจารณาแล้วกดปุ่มเห็นด้วย/ไม่เห็นด้วย/อนุมัติ/ไม่อนุมัติ แล้วเช็คว่าสถานะใน Firestore
เปลี่ยนจริง) แต่ติดปัญหาจริงดังนี้:

- `firestore.rules` (`match /users/{uid}` → `allow create`) บังคับว่าบัญชีที่สมัครใหม่ทุกบัญชีต้องมี
  `role == "student"` เท่านั้น และ `allow update` ก็ห้ามแก้ไฟล์ `role`/`approvalLevel` ของตัวเองอีก —
  นี่คือพฤติกรรมที่ถูกต้องแล้ว (กันการเลื่อนสิทธิ์ตัวเอง) ไม่ใช่บั๊ก
- ชุดทดสอบนี้จึงสมัครบัญชี "approver" ชั่วคราวขึ้นมาเองไม่ได้เลยผ่าน UI/client SDK ปกติ — การจะทำได้
  ต้องมีคนไปตั้งค่า `role`/`approvalLevel` ผ่าน Firebase Console (สิทธิ์แอดมิน) ซึ่งอยู่นอกเหนือสิ่งที่
  ชุดทดสอบอัตโนมัตินี้ควรทำ (และในสภาพแวดล้อมนี้ไม่มี Firebase CLI/แอดมินให้ล็อกอินด้วย)
- ทางเลือกที่ปฏิเสธไป: ใช้ `page.evaluate` ยิง SDK ของแอปเพื่อ "โปรโมทตัวเอง" — ปฏิเสธ เพราะเท่ากับ
  เขียนโค้ดทดสอบเพื่อเลี่ยง Security Rules ที่เพิ่งถูกทำให้เข้มงวดขึ้น ซึ่งขัดกับเจตนาของกฎเหล็ก
  ข้อ 1 ในบทบาทนี้ (ห้ามแก้/เลี่ยงเพื่อให้เทสต์ผ่าน) และจะทำให้เทสต์ผ่านได้ "หลอก ๆ" โดยไม่ได้พิสูจน์
  อะไรเกี่ยวกับพฤติกรรมจริงของแอปเลย
- จึงปรับขอบเขตของเทสต์ 3b ตามคำแนะนำในงานที่มอบหมาย: พิสูจน์ "ฝั่งตรงข้าม" แทน — ยืนยันว่าบัญชีที่
  ไม่ใช่ผู้พิจารณา (role `student`) จะไม่มีทางเห็นปุ่มเปลี่ยนสถานะเลย แม้จะเป็นเจ้าของคำร้องเอง
  (`canReview` เช็ค `profile.role === "approver"` และ `profile.approvalLevel === currentLevel` และ
  `studentId !== currentUser.uid` พร้อมกันทั้งหมด) นี่ยังคงเป็นเทสต์การเรนเดอร์ปุ่มแบบมีเงื่อนไขที่
  ผูกกับสถานะจริงจาก Firestore (ไม่ใช่ mock) และรันจริงผ่าน — ✅

**อัปเดต — ช่องว่างนี้ปิดแล้ว:** ทำตามทางเลือกที่ 1 ที่แนะนำไว้ข้างต้นจริง — ตั้งค่าบัญชี approver
ถาวร (`approver.demo2@flowu-demo.example`, `role:"approver"`, `approvalLevel:1`) ผ่าน Firebase Console
ไว้แล้วตั้งแต่ตอนทำการบ้านที่ 2 เก็บ credential ไว้ใน `tests/fixtures/test-accounts.js` (gitignored)
แล้วเพิ่มเทสต์ **3c** ที่ล็อกอินด้วยบัญชีนี้จริง กดปุ่ม "เห็นด้วย" บนคำร้องจาก 3a แล้ว **โหลดหน้าใหม่**
ยืนยันว่า `currentLevel` และ `approvals` เปลี่ยนจริงใน Firestore ไม่ใช่แค่ UI — ผ่านจริง ✅
ตอนนี้สถานการณ์ (2) มีทั้งฝั่ง positive (3c) และ negative (3b) ครบแล้ว

## ไฟล์ที่สร้าง/แก้ไข

- `package.json` (ใหม่)
- `playwright.config.js` (ใหม่)
- `.gitignore` (แก้ไข — เพิ่ม 3 บรรทัดสำหรับ Playwright/บัญชีทดสอบ)
- `tests/fixtures/test-accounts.example.js` (ใหม่ — commit ได้)
- `tests/fixtures/test-accounts.js` (ใหม่ — gitignored)
- `tests/helpers.js` (ใหม่ — ฟังก์ชันช่วย signup/login/submitNewRequest/uniqueEmail ใช้ร่วมกัน)
- `tests/01-not-logged-in-redirect.spec.js` (ใหม่)
- `tests/02-form-validation.spec.js` (ใหม่)
- `tests/03-request-lifecycle.spec.js` (ใหม่)
- `tests/04-security-cross-account.spec.js` (ใหม่)
- `test-results.md` (ไฟล์นี้)

ไม่ได้แก้โค้ดแอปใด ๆ (`js/*.js`, `*.html`, `firestore.rules`, `firebase.json`) ตามกฎเหล็กของบทบาทนี้
