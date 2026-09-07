# CLAUDE.md — FlowU

คู่มือสำหรับ Claude Code เมื่อทำงานกับโปรเจคนี้

## โปรเจคนี้คืออะไร

**FlowU** ระบบยื่นและอนุมัติใบคำร้องฝึกปฏิบัติงานออนไลน์
ของส่วนจัดหางานและฝึกงานของนักศึกษา มหาวิทยาลัยแม่ฟ้าหลวง

แทนกระบวนการกระดาษที่นักศึกษาต้องเดินถือเอกสารไปให้ผู้พิจารณา 6 ท่านตามตึกต่าง ๆ
ทำให้เอกสารสูญหาย ไม่รู้สถานะ และต้องโทรตามบ่อยครั้ง

เอกสารอ้างอิง: `SCOPE.md` (ขอบเขต) · `ACL.md` (สิทธิ์)

## ข้อกำหนดทางเทคนิค — ห้ามเปลี่ยน

| หัวข้อ | ข้อกำหนด |
|---|---|
| หน้าเว็บ | HTML + CSS + JavaScript ธรรมดา **ห้ามใช้ framework** (ไม่มี React, Vue, Tailwind, bundler) |
| โครงไฟล์ | แยกไฟล์ `.html` หน้าละไฟล์ · CSS อยู่ใน `css/` · JS อยู่ใน `js/` |
| เซิร์ฟเวอร์ | **ไม่มี** Application Server ที่เขียนเอง หน้าเว็บคุยกับ Firestore ตรง ๆ |
| ฐานข้อมูล | Cloud Firestore |
| ล็อกอิน | Firebase Authentication (Email/Password) |
| ความปลอดภัย | Firestore Security Rules |
| นำขึ้นออนไลน์ | Firebase Hosting |
| Firebase SDK | โหลดจาก CDN ด้วย ES module (`<script type="module">`) |

## ภาษา

- ข้อความที่ผู้ใช้เห็นบนหน้าจอ **เป็นภาษาไทยทั้งหมด**
- ชื่อไฟล์ ชื่อตัวแปร ชื่อโฟลเดอร์และช่องข้อมูล **เป็นภาษาอังกฤษ**
- คอมเมนต์ในโค้ดเป็นภาษาไทย เพื่อให้อ่านทบทวนได้เร็ว

## โครงสร้างข้อมูล

```
internshipRequests/{requestId}      ← โฟลเดอร์หลัก
  studentId · studentName · studentCode · phone · email
  schoolName · programName · semester · academicYear
  typeId · typeName · typeDetail · reason
  status · approvalChain[] · currentLevel · totalLevels
  currentLevelSince · round · returnReason · returnedByLevel
  penaltyHoursProposed · penaltyHoursApproved
  createdAt · resubmittedAt · updatedAt

  approvals/{approvalId}            ← โฟลเดอร์ย่อย
    round · level · approverId · approverName · approverTitle
    decision · comment · proposedPenaltyHours · createdAt

requestTypes/{typeId}               ← ประเภทคำร้อง 5 แบบ
  name · order · active · approvalChain[]

users/{uid}
  name · email · role · approvalLevel · title
  studentCode · schoolName · programName · advisorId · advisorName
```

## กฎธุรกิจที่ห้ามพลาด

1. `status` มี 4 ค่าเท่านั้น: `รอพิจารณา` · `ตีกลับให้แก้ไข` · `อนุมัติ` · `ไม่อนุมัติ`
2. ผู้พิจารณาระดับที่ `decisionType == "opinion"` **ให้ความเห็น** ไม่ใช่ตัดสิน
   - เห็นด้วย → `currentLevel + 1` ไม่แตะ `status`
   - ไม่เห็นด้วย → `status = "ตีกลับให้แก้ไข"` **หยุดทันที ไม่ส่งต่อขึ้นระดับถัดไป** และ**บังคับกรอกเหตุผล**
3. เฉพาะระดับที่ `decisionType == "decision"` (ค่าเริ่มต้นคืออธิการบดี) ที่เปลี่ยน `status` เป็น `อนุมัติ` หรือ `ไม่อนุมัติ` ได้
4. นักศึกษาแก้คำร้องได้เฉพาะเมื่อ `status == "ตีกลับให้แก้ไข"` เมื่อยื่นใหม่ให้ `round + 1` · `currentLevel = 1` · `status = "รอพิจารณา"` · ล้าง `returnReason`
5. **ห้ามเขียนเลข 6 ตายในโค้ด** จำนวนระดับต้องอ่านจาก `totalLevels` และ `approvalChain` เสมอ เพราะหน่วยงานจะเพิ่มหรือลดระดับในอนาคต
6. ความเห็นใน `approvals` เมื่อบันทึกแล้ว **แก้ไม่ได้และลบไม่ได้**
7. `approvalChain` ถูกคัดลอกจาก `requestTypes` ตอนยื่น เพื่อไม่ให้คำร้องเก่าเปลี่ยนความหมายเมื่อแก้สายอนุมัติ
8. ข้อมูลนักศึกษามาจากโปรไฟล์ `users` ที่ตรงกับระบบ REG **นักศึกษาไม่กรอกเอง**
9. ผู้พิจารณาพิจารณาคำร้องที่ตัวเองเป็นผู้ยื่นไม่ได้

กฎเต็มดูที่ Technical Spec ข้อ 6.4 (BR-01 ถึง BR-14)

## เรื่องความปลอดภัยที่ต้องระวัง

- `js/config.js` อยู่ใน `.gitignore` **ห้าม commit**
- คีย์ของ Claude API เป็นความลับจริง ห้าม commit เด็ดขาด
- **การซ่อนปุ่มตามบทบาทไม่ใช่ความปลอดภัย** ทุกกฎต้องบังคับซ้ำที่ Security Rules เสมอ เพราะผู้ใช้แก้โค้ดฝั่งเบราว์เซอร์ได้
- ระหว่างพัฒนาใช้ **ข้อมูลสมมติเท่านั้น** ห้ามนำข้อมูลนักศึกษาจริงเข้าระบบก่อน Security Rules รายบทบาทเสร็จและผ่านการทดสอบ (PDPA)

## สไตล์การเขียนโค้ด

- ใช้ `const` และ `let` ไม่ใช้ `var`
- ใช้ `async / await` ไม่ใช้ `.then()` ต่อกันยาว
- เรียก Firestore ด้วย `where` เพื่อกรองที่ฐานข้อมูล **ห้ามดึงทั้งหมดมากรองที่หน้าเว็บ**
- ทุกการเรียกฐานข้อมูลต้องมี `try / catch` และแจ้งข้อผิดพลาด**เป็นภาษาไทย**
- ตัวแปรสีและระยะห่างอยู่ใน `:root` ของ `css/style.css` ให้ใช้ตัวแปรเดิม ไม่ใส่ค่าสีตรง ๆ ซ้ำ
- ไม่สร้างไฟล์ใหม่โดยไม่จำเป็น แก้ไฟล์เดิมก่อนเสมอ

## สิ่งที่ยังไม่ทำในเฟสนี้

เชื่อมต่อ REG API · SSO ของมหาวิทยาลัย · ส่งอีเมลแจ้งชั่วโมงบำเพ็ญประโยชน์อัตโนมัติ ·
Dashboard ผู้บริหาร · แจ้งเตือนอีเมลหรือ LINE · แนบไฟล์หลักฐาน

อย่าเสนอให้ทำสิ่งเหล่านี้ระหว่าง Module 2
