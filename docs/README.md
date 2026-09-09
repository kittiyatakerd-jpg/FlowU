# ภาพหน้าจอประกอบการส่งงาน

## การบ้านที่ 1 — ต้องมี 2 ภาพ

| ชื่อไฟล์ | ถ่ายจากไหน |
|---|---|
| `firestore-console.png` | Firebase Console → Firestore Database ให้เห็นโฟลเดอร์ `requestTypes` และ `internshipRequests` พร้อมเอกสารข้างใน |
| `app-screenshot.png` | หน้าเว็บ `index.html` ที่แสดงข้อมูลจากฐานข้อมูลได้จริง เห็นแถบเขียว "เชื่อมต่อ Firestore สำเร็จ" |

ลากไฟล์ภาพมาวางในโฟลเดอร์นี้ แล้ว commit ขึ้น GitHub

## การบ้านที่ 2 (สัปดาห์ที่ 7) — ต้องมี 2 ภาพ

| ชื่อไฟล์ | ถ่ายจากไหน | วิธีทำซ้ำ (ทดสอบแล้วว่าใช้ได้จริง) |
|---|---|---|
| `role-based-buttons.png` | หน้า `request-detail.html` ของคำร้อง `pgNhhnWirOGozlNYPFfI` | ล็อกอินด้วยบัญชี `approver.test1@flowu-demo.example` (role `approver`, `approvalLevel: 1`) แล้วเปิดคำร้องนี้ — ต้องเห็นปุ่ม "เห็นด้วย"/"ไม่เห็นด้วย". จากนั้นไปแก้ `approvalLevel` ของผู้ใช้นี้ใน Firebase Console เป็น `2` แล้ว F5 หน้าเดิม — ปุ่มต้องหายไป (ถ่ายภาพ **ทั้งสองสถานะ** หรืออย่างน้อยสถานะ "ก่อน" ที่เห็นปุ่ม แล้วอธิบายในภาพที่สองว่าแก้ level แล้วปุ่มหาย) — อย่าลืมแก้ `approvalLevel` กลับเป็น `1` หลังถ่ายเสร็จ |
| `permission-denied.png` | เปิดหน้าต่าง Incognito (หรือแท็บใหม่ที่ไม่ได้ล็อกอิน) แล้วเข้า URL REST ของ Firestore ตรงๆ: `https://firestore.googleapis.com/v1/projects/flowu-7d1a9/databases/(default)/documents/internshipRequests` — ต้องเห็น `"code": 403, "status": "PERMISSION_DENIED"` (พิสูจน์ว่า Security Rule `request.auth != null` บังคับใช้จริง ไม่ใช่แค่ซ่อนปุ่มฝั่งหน้าเว็บ) |

ลากไฟล์ภาพมาวางในโฟลเดอร์นี้ แล้ว commit ขึ้น GitHub
