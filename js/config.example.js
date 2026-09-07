// ============================================================
// วิธีใช้
//   1) คัดลอกไฟล์นี้เป็น js/config.js
//   2) เอาค่าจริงจาก Firebase Console มาใส่
//      Project settings > General > Your apps > SDK setup and configuration
//   3) js/config.js อยู่ใน .gitignore แล้ว จึงไม่ถูก commit
//
// หมายเหตุ: ค่าชุดนี้ของ Firebase ไม่ใช่ความลับ เปิดเผยได้ตามการออกแบบ
// สิ่งที่กันคนอื่นแก้ข้อมูลคือ Security Rules ไม่ใช่การซ่อนค่าพวกนี้
// แต่คีย์ของ Claude API ในสัปดาห์ที่ 8 เป็นความลับจริง ห้าม commit เด็ดขาด
// ============================================================

export const firebaseConfig = {
  apiKey: "ใส่ค่าจริงที่นี่",
  authDomain: "ชื่อโปรเจค.firebaseapp.com",
  projectId: "ชื่อโปรเจค",
  storageBucket: "ชื่อโปรเจค.firebasestorage.app",
  messagingSenderId: "ใส่ค่าจริงที่นี่",
  appId: "ใส่ค่าจริงที่นี่"
};
