// ============================================================
// บังคับล็อกอินก่อนใช้หน้าที่ต้องป้องกัน (สัปดาห์ที่ 7)
// ทุกหน้ายกเว้น login.html ต้อง await requireLogin() ก่อนอ่าน/เขียน Firestore
// ============================================================
import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase-init.js";

// คืนค่า user ของ Firebase Auth ถ้าล็อกอินอยู่
// ถ้ายังไม่ได้ล็อกอิน จะเด้งไป login.html พร้อมจำหน้าที่ตั้งใจจะมาไว้ (ไม่ resolve กลับมา)
export function requireLogin() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        const currentPage = location.pathname.split("/").pop() || "index.html";
        location.href = "login.html?redirect=" + encodeURIComponent(currentPage + location.search);
        return;
      }
      resolve(user);
    });
  });
}

// อ่านโปรไฟล์ users/{uid} — ใช้บอก role/approvalLevel ของผู้ใช้ที่ล็อกอินอยู่
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}
