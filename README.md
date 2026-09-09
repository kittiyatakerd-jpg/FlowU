# FlowU

🔗 **ใช้งานออนไลน์ได้ที่:** https://flowu-7d1a9.web.app

**ระบบยื่นและอนุมัติใบคำร้องฝึกปฏิบัติงานออนไลน์**
ส่วนจัดหางานและฝึกงานของนักศึกษา มหาวิทยาลัยแม่ฟ้าหลวง

Kittiya Sirikan · ADT-RAISE Non-Degree Batch 2 · Module 2

---

## ปัญหาที่แก้

ใบคำร้องฝึกปฏิบัติงานยังเป็นกระดาษ นักศึกษาต้องเดินถือเอกสารไปให้ผู้พิจารณา 6 ท่านตามตึกต่าง ๆ
ทำให้เอกสารสูญหาย ไม่รู้ว่าเรื่องอยู่ขั้นตอนไหน ต้องโทรตามบ่อยครั้ง และเจ้าหน้าที่เสียเวลาตอบคำถามซ้ำ ๆ

| ตัวชี้วัด | ก่อน | เป้าหมาย |
|---|---|---|
| เวลาพิจารณาต่อผู้พิจารณาแต่ละท่าน | ไม่มีเกณฑ์ | ≤ 24 ชม. |
| เวลารวมจนอนุมัติเสร็จ (ต่อรอบ) | หลายสัปดาห์ | ≤ 3 วัน |
| เอกสารสูญหาย | เกิดขึ้นได้ | 0% |
| การใช้กระดาษ | 2 หน้า/คำร้อง | 0 |

---

## เทคโนโลยี

HTML · CSS · JavaScript ธรรมดา (ไม่ใช้ framework) · Cloud Firestore · Firebase Authentication · Firebase Hosting

---

## วิธีรันบนเครื่อง

1. คัดลอกค่าตั้งต้นของ Firebase

   ```
   cp js/config.example.js js/config.js
   ```

2. เปิด `js/config.js` แล้วใส่ค่าจริงจาก Firebase Console
   (Project settings → General → Your apps → SDK setup and configuration)

3. เพิ่มข้อมูลตั้งต้นใน Firestore ตาม `seed/README.md`

4. เปิดเว็บด้วยเซิร์ฟเวอร์ในเครื่อง — **เปิดไฟล์ตรง ๆ ไม่ได้** เพราะใช้ ES module

   ```
   npx serve .
   ```

   หรือใช้ส่วนขยาย Live Server ใน VS Code

---

## โครงไฟล์

```
index.html              หน้ารายการคำร้อง (อ่านข้อมูลจาก Firestore, ต้องล็อกอินก่อน)
login.html              หน้าเข้าสู่ระบบ/สมัครสมาชิก
new-request.html        หน้ายื่นคำร้องใหม่ / แก้ไขคำร้องที่ถูกตีกลับ
request-detail.html     หน้ารายละเอียดคำร้อง — พิจารณา/แก้ไข/ลบ
css/style.css           สไตล์กลางของระบบ
js/config.example.js    แม่แบบค่าตั้งต้น Firebase
js/config.js            ค่าจริง — อยู่ใน .gitignore ไม่ถูก commit
js/firebase-init.js     ตั้งต้น Firebase (Firestore + Authentication)
js/auth-guard.js        เช็คล็อกอินก่อนเข้าทุกหน้า + อ่านโปรไฟล์ผู้ใช้
js/nav.js               แถบหัวเรื่อง แสดงอีเมล + ปุ่มออกจากระบบ
js/login.js             สมัครสมาชิก/เข้าสู่ระบบ
js/requests.js          อ่านและแสดงข้อมูลคำร้อง
js/new-request.js        สร้าง/แก้ไขคำร้อง
js/request-detail.js    ให้ความเห็น/ตัดสิน/ลบคำร้อง
firestore.rules         กฎความปลอดภัยของฐานข้อมูล (สัปดาห์ 7: ต้องล็อกอินเท่านั้น)
firebase.json           ค่าตั้งต้น Firebase Hosting
.firebaserc             โปรเจกต์ Firebase ที่ผูกไว้ (flowu-7d1a9)
seed/README.md          ข้อมูลสมมติสำหรับทดสอบ
docs/                   ภาพหน้าจอประกอบการส่งงาน
SCOPE.md                ขอบเขตโครงงาน
ACL.md                  สิทธิ์การใช้งานตามบทบาท (student/approver/staff)
CLAUDE.md               คู่มือสำหรับ Claude Code
```

---

## ความคืบหน้า

- [x] การบ้านที่ 1 — repo · `SCOPE.md` · อ่านข้อมูลจริงจาก Firestore · ภาพหน้าจอ Console
- [x] การบ้านที่ 2 — `CLAUDE.md` · เพิ่ม แก้ ลบ · ระบบล็อกอิน (Firebase Authentication) · `ACL.md` · นำขึ้นออนไลน์ (Firebase Hosting) · Security Rules ขั้นต่ำ (`request.auth != null`)
- [ ] การบ้านที่ 3 — ผู้ช่วย AI 2 ระดับ
- [ ] การบ้านที่ 4 — การทดสอบอัตโนมัติ 5 รายการ · `test-results.md` · `BACKLOG.md`

---

## ⚠️ ข้อควรระวังเรื่องข้อมูลส่วนบุคคล

ระหว่างพัฒนาใช้**ข้อมูลสมมติเท่านั้น**
ห้ามนำข้อมูลนักศึกษาจริงเข้าระบบก่อนที่ Security Rules รายบทบาทจะเสร็จและผ่านการทดสอบ
