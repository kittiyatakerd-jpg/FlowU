# ข้อมูลตั้งต้นสำหรับทดสอบ

ข้อมูลชุดนี้เป็น **ข้อมูลสมมติทั้งหมด** ใช้เพื่อให้หน้าเว็บมีอะไรแสดง
ห้ามใช้ข้อมูลนักศึกษาจริงจนกว่า Security Rules รายบทบาทจะเสร็จ

วิธีเพิ่ม: Firebase Console → Firestore Database → Start collection

---

## 1. โฟลเดอร์ `requestTypes`

สร้าง 5 เอกสาร ตั้ง Document ID ตามที่ระบุ

| Document ID | name | order | active |
|---|---|---|---|
| `type_preintern` | ขอซ่อมกิจกรรมเตรียมความพร้อมก่อนการฝึกปฏิบัติงาน (Pre-internship) | 1 | true |
| `type_late` | ขอยื่นคำร้องฝึกปฏิบัติงานล่าช้า | 2 | true |
| `type_transfer` | ขอย้ายการฝึกปฏิบัติงานจากสถานประกอบการเดิม | 3 | true |
| `type_cancel` | ขอยกเลิกการฝึกปฏิบัติงาน | 4 | true |
| `type_other` | อื่น ๆ (โปรดระบุ) | 5 | true |

ชนิดข้อมูล: `name` = string · `order` = number · `active` = boolean

> `approvalChain` (array) จะเพิ่มในการบ้านที่ 2 ยังไม่ต้องใส่ตอนนี้

---

## 2. โฟลเดอร์ `internshipRequests`

สร้างอย่างน้อย 3 เอกสาร ให้ครอบคลุมสถานะที่ต่างกัน จะได้เห็นป้ายสีครบ

### เอกสารที่ 1 — Document ID `REQ-2569-0148`

| ช่อง | ชนิด | ค่า |
|---|---|---|
| studentName | string | สมชาย ทดสอบ |
| studentCode | string | 6531000001 |
| schoolName | string | Information Technology |
| programName | string | Software Engineering |
| semester | string | ปลาย |
| academicYear | number | 2569 |
| typeId | string | type_late |
| typeName | string | ขอยื่นคำร้องฝึกปฏิบัติงานล่าช้า |
| reason | string | ไม่ได้ยื่นความประสงค์ตามกำหนด เนื่องจากติดกิจกรรมรอบซ่อม |
| status | string | รอพิจารณา |
| currentLevel | number | 4 |
| totalLevels | number | 6 |
| round | number | 2 |
| createdAt | timestamp | เลือกวันเวลาใดก็ได้ |

### เอกสารที่ 2 — Document ID `REQ-2569-0102`

เหมือนข้างบน แต่เปลี่ยน

| ช่อง | ค่า |
|---|---|
| studentName | สมหญิง ทดลอง |
| studentCode | 6531000002 |
| typeId / typeName | type_transfer / ขอย้ายการฝึกปฏิบัติงานจากสถานประกอบการเดิม |
| status | อนุมัติ |
| currentLevel | 6 |
| round | 1 |
| penaltyHoursApproved (number) | 8 |

### เอกสารที่ 3 — Document ID `REQ-2569-0061`

| ช่อง | ค่า |
|---|---|
| studentName | ประยุทธ ตัวอย่าง |
| studentCode | 6531000003 |
| typeId / typeName | type_preintern / ขอซ่อมกิจกรรมเตรียมความพร้อมก่อนการฝึกปฏิบัติงาน (Pre-internship) |
| status | ตีกลับให้แก้ไข |
| currentLevel | 1 |
| round | 1 |
| returnReason (string) | ยังไม่ได้ระบุว่าเป็นกิจกรรมรอบใด ขอให้แนบหลักฐาน |
| returnedByLevel (number) | 1 |

---

## ตรวจว่าสำเร็จ

เปิด `index.html` แล้วต้องเห็น

- แถบเขียว "เชื่อมต่อ Firestore สำเร็จ"
- ชิปประเภทคำร้อง 5 อัน
- ตารางคำร้อง 3 แถว ป้ายสีต่างกัน 3 แบบ
