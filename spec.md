# spec.md — FlowU (สภาพจริงของระบบ ณ สัปดาห์ที่ 9 / การบ้านที่ 4)

> รวม `SCOPE.md` (ขอบเขตที่ตั้งใจไว้ตอนเริ่มโครงงาน) เข้ากับสภาพจริงของโค้ดวันนี้ — จุดไหนที่ของจริงเบี่ยงจาก
> ที่วางแผนไว้ จะระบุไว้ชัดเจนในหัวข้อ "จุดที่ SCOPE.md กับโค้ดจริงไม่ตรงกัน" ไม่ปิดบัง
> เอกสารที่เกี่ยวข้อง: [SCOPE.md](SCOPE.md) (ขอบเขตเดิม) · [ACL.md](ACL.md) (สิทธิ์) · [BACKLOG.md](BACKLOG.md) (งานค้าง) ·
> [test-results.md](test-results.md) (ผลทดสอบ) · [README.md](README.md)

อัปเดตล่าสุด: การบ้านที่ 4 (สัปดาห์ที่ 9) — เพิ่ม Security Rules รายบทบาทจริง + ชุดทดสอบอัตโนมัติ

---

## 1. ภาพรวม

**FlowU** — ระบบยื่นและอนุมัติใบคำร้องฝึกปฏิบัติงานออนไลน์ ของส่วนจัดหางานและฝึกงานของนักศึกษา
มหาวิทยาลัยแม่ฟ้าหลวง แทนกระบวนการกระดาษที่นักศึกษาต้องเดินถือเอกสารไปให้ผู้พิจารณา 6 ท่านตามตึกต่างๆ
เป้าหมาย: เวลาพิจารณาต่อผู้พิจารณา ≤ 24 ชม., เวลารวมจนอนุมัติเสร็จ ≤ 3 วัน/รอบ, เอกสารสูญหาย 0%

## 2. บทบาทและสิทธิ์ (ของจริง หลังการบ้านที่ 4)

| บทบาท | `role` | ทำอะไรได้ | บังคับที่ไหน |
|---|---|---|---|
| 🎓 นักศึกษา | `student` | ยื่น/ดู/แก้ไข(เมื่อถูกตีกลับ)/ลบ(เมื่อรอพิจารณา)คำร้อง**ของตัวเอง**เท่านั้น | **Firestore Rules จริง** + UI |
| ✅ ผู้พิจารณา | `approver` | ดู/พิจารณาคำร้องทุกใบที่ถึงคิวระดับตัวเอง (`approvalLevel==currentLevel`), พิจารณาของตัวเองไม่ได้ (BR-09) | **Firestore Rules จริง** + UI |
| 🧾 เจ้าหน้าที่ | `staff` | เหมือนผู้พิจารณา (ไม่ติดเงื่อนไขระดับ) + แก้ `requestTypes` | **Firestore Rules จริง** + UI |

ก่อนหน้านี้ (สัปดาห์ 7-8) กฎบังคับแค่ "ต้องล็อกอิน" เท่านั้น — สัปดาห์นี้เปลี่ยนเป็นเช็ค role/ความเป็นเจ้าของ
จริงในกฎด้วย ดูรายละเอียดเต็มที่ `firestore.rules` และ `ACL.md`

## 3. โครงสร้างข้อมูล (ของจริง)

```
internshipRequests/{requestId}
  studentId · studentName · studentCode · schoolName · programName · phone
  typeId · typeName · typeDetail · reason
  status: รอพิจารณา | ตีกลับให้แก้ไข | อนุมัติ | ไม่อนุมัติ
  approvalChain[] · currentLevel · totalLevels · round
  returnReason · returnedByLevel
  penaltyHoursApproved
  aiSummary          ← ผลสรุปจาก AI ระดับ 2 (ดูข้อ 6 — ไม่ใช่ aiSuggestion/aiReason ตามที่ SCOPE.md เดิมเขียน)
  createdAt · updatedAt · currentLevelSince

  approvals/{approvalId}     ← ความเห็นแต่ละระดับ, append-only
    round · level · approverId · approverName · approverTitle · decision · comment · createdAt

  aiLog/{logId}              ← บันทึกทุกครั้งที่เรียก AI ระดับ 2, append-only
    input · output · createdAt

requestTypes/{typeId}
  name · order · active · approvalChain[]

users/{uid}
  name · email · role: student|approver|staff · approvalLevel
```

## 4. สายอนุมัติ

สายอนุมัติเป็น array ที่คัดลอกมาจาก `requestTypes/{typeId}.approvalChain` ตอนยื่น (ห้าม hardcode จำนวน
ระดับในโค้ด — อ่านจาก `totalLevels`/`approvalChain.length` เสมอ) มาตรฐาน 6 ระดับ: ระดับ 1-5 ให้ความเห็น
(เห็นด้วย → เดินหน้า, ไม่เห็นด้วย → ตีกลับพร้อมเหตุผลบังคับ) ระดับ 6 ตัดสิน (อนุมัติ/ไม่อนุมัติ + กำหนด
ชั่วโมงบำเพ็ญประโยชน์)

## 5. หน้าจอ (ของจริง — 3 หน้า ไม่ใช่ 4 ตามที่ SCOPE.md วางแผนไว้)

| หน้า | สถานะ |
|---|---|
| `index.html` — รายการคำร้อง | ✅ มี — กรองตาม role (นักศึกษาเห็นเฉพาะของตัวเอง) |
| `login.html` — เข้าสู่ระบบ/สมัครสมาชิก | ✅ มี |
| `new-request.html` — ยื่น/แก้ไขคำร้อง | ✅ มี (มีปุ่ม AI ช่วยเลือกประเภท) |
| `request-detail.html` — รายละเอียด+พิจารณา | ✅ มี (มีปุ่ม AI สรุปให้ผู้พิจารณา) |
| `request-types.html` — จัดการประเภทคำร้อง | ❌ **ยังไม่สร้าง** (ดู BACKLOG.md — ใช้ Firebase Console แทน) |

## 6. ผู้ช่วย AI (2 ระดับ — การบ้านที่ 3)

- **ระดับ 1** (`new-request.html`/`js/new-request.js` — `classifyWithAi`): อ่านช่อง "เหตุผลอย่างละเอียด"
  แล้วเลือกประเภทคำร้องที่ตรงที่สุดให้ในดรอปดาวน์ — **เสนอเท่านั้น ไม่บันทึกลง Firestore แยก** นักศึกษา
  ยังต้องกด "บันทึกคำร้อง" เองเสมอ
- **ระดับ 2** (`request-detail.html`/`js/request-detail.js` — `summarizeWithAi`): อ่านคำร้อง + ความเห็นทุก
  ระดับที่มีอยู่แล้ว สรุปไม่เกิน 3 ประโยคให้ผู้พิจารณาอ่านก่อนตัดสินใจ — **ห้ามแนะนำผลตัดสิน** บันทึกผลลง
  ช่อง `aiSummary` + log ทุกครั้งที่เรียกไว้ใน `aiLog` (ไม่ใช่ `aiSuggestion`/`aiReason` ตามที่ SCOPE.md
  เดิมเขียนไว้ — ดูหัวข้อ 8)
- ใช้คีย์ OpenRouter ของหลักสูตร เก็บใน `js/ai-config.js` (gitignore, ไม่ commit) — ข้อจำกัดเรื่องคีย์เห็นได้
  จากเบราว์เซอร์บันทึกไว้ใน `BACKLOG.md`

## 7. Security Model (ของจริง หลังการบ้านที่ 4)

`firestore.rules` บังคับสิทธิ์จริงตามตารางข้อ 2 — ไม่ใช่แค่ซ่อนปุ่มฝั่งหน้าจอแล้ว:
- นักศึกษาอ่าน/แก้ไข/ลบได้เฉพาะคำร้องของตัวเอง (แก้ได้เฉพาะตอนถูกตีกลับ หรือแก้เฉพาะช่อง `aiSummary`)
- ผู้พิจารณา/เจ้าหน้าที่อ่านได้ทุกใบ เขียนได้เฉพาะใบที่ไม่ใช่ของตัวเอง (กัน BR-09) และผู้พิจารณาต้องถึงคิว
  ระดับตัวเองก่อน (`approvalLevel==currentLevel`) เจ้าหน้าที่ไม่ติดเงื่อนไขระดับ
- `approvals`/`aiLog` เป็น append-only จริง (update/delete = false เสมอ ไม่ว่าใคร)
- `users/{uid}` อ่าน/เขียนได้เฉพาะเจ้าของ ห้ามเลื่อน `role`/`approvalLevel` ตัวเอง (ทำผ่าน Console เท่านั้น)
- ต้องมี composite index (`studentId`+`createdAt`) ให้ query ของหน้ารายการทำงานได้ — ดู `firestore.indexes.json`

## 8. จุดที่ SCOPE.md กับโค้ดจริงไม่ตรงกัน

1. **หน้าจอ**: SCOPE.md วางแผน 4 หน้า มีจริง 3 หน้า (ไม่มี `request-types.html`)
2. **ช่อง AI**: SCOPE.md เขียน `aiSuggestion`/`aiReason` แต่โค้ดจริงใช้ `aiSummary` (ระดับ 2 เท่านั้น)
   ระดับ 1 ไม่บันทึกผลลง Firestore เลย (ดูข้อ 6)
3. **จำนวนสถานะ**: SCOPE.md เองบันทึกไว้แล้วว่าใช้ 4 สถานะ (เกินคู่มือ 1 ค่า) โดยตั้งใจ — ไม่ใช่จุดที่ต่างจาก
   ของจริง แค่ทวนซ้ำไว้เพื่อความครบถ้วน

ทั้งหมดนี้ไม่กระทบเกณฑ์ผ่าน Module 2 — บันทึกไว้ใน `BACKLOG.md` เพื่อพิจารณาว่าจะแก้เอกสารหรือแก้โค้ดต่อไป

## 9. การทดสอบ

ชุดทดสอบอัตโนมัติ (Playwright, 6 เคส ครอบคลุม 5 สถานการณ์บังคับของโจทย์รวมเทสต์ความปลอดภัย) — ดูผลจริง
ที่ [test-results.md](test-results.md) และไฟล์เทสต์ที่ `tests/`

## 10. Change log

- **สัปดาห์ 6**: อ่านข้อมูลจริงจาก Firestore (read-only)
- **สัปดาห์ 7**: CRUD ครบ 4 ตัว + Firebase Authentication + ACL.md + Security Rules ขั้นต่ำ (auth เท่านั้น) + Hosting
- **สัปดาห์ 8 / การบ้านที่ 3**: ผู้ช่วย AI 2 ระดับ
- **สัปดาห์ 9 / การบ้านที่ 4**: Security Rules รายบทบาทจริง (เปลี่ยนจาก auth-only) + แก้ `js/requests.js`
  ให้กรองตาม role + composite index + ทีม subagent 3 ตัวใน `.claude/agents/` + ชุดทดสอบ Playwright 6 เคส
  + `spec.md` นี้
