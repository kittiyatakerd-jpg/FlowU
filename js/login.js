// ============================================================
// หน้าเข้าสู่ระบบ/สมัครสมาชิก (สัปดาห์ที่ 7)
// หน้านี้ไม่ผ่าน requireLogin() (ไม่งั้นจะเด้งเข้าตัวเองวนซ้ำ)
// ============================================================
import { auth, db } from "./firebase-init.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const elMsg = document.getElementById("formMsg");
const formLogin = document.getElementById("formLogin");
const formSignup = document.getElementById("formSignup");
const tabLogin = document.getElementById("tabLogin");
const tabSignup = document.getElementById("tabSignup");

// ถ้าล็อกอินอยู่แล้ว ไม่ต้องมาหน้านี้ซ้ำ
// (ระวัง: createUserWithEmailAndPassword ทำให้ auth state เปลี่ยนทันที ก่อน updateProfile/setDoc
//  ด้านล่างจะรันเสร็จ — ต้องกันด้วย isSubmitting ไม่งั้นจะเด้งออกไปก่อนบันทึกโปรไฟล์เสร็จ)
let isSubmitting = false;
onAuthStateChanged(auth, (user) => {
  if (user && !isSubmitting) goToIntendedPage();
});

tabLogin.addEventListener("click", () => switchTab(true));
tabSignup.addEventListener("click", () => switchTab(false));

function switchTab(isLogin) {
  formLogin.classList.toggle("hidden", !isLogin);
  formSignup.classList.toggle("hidden", isLogin);
  tabLogin.className = isLogin ? "btn" : "btn-ghost";
  tabSignup.className = isLogin ? "btn-ghost" : "btn";
  hideMsg();
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMsg();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!email || !password) { showMsg("กรอกอีเมลและรหัสผ่านก่อน"); return; }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    goToIntendedPage();
  } catch (err) {
    showMsg("เข้าสู่ระบบไม่สำเร็จ: " + err.message);
  }
});

formSignup.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMsg();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  if (!name || !email || !password) { showMsg("กรอกให้ครบทุกช่องก่อน"); return; }

  isSubmitting = true;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // สมัครสำเร็จแล้วสร้างไฟล์ใหม่ในโฟลเดอร์ users พร้อม role เริ่มต้นเป็น student
    await setDoc(doc(db, "users", cred.user.uid), { name, email, role: "student" });
    goToIntendedPage();
  } catch (err) {
    showMsg("สมัครสมาชิกไม่สำเร็จ: " + err.message);
    isSubmitting = false;
  }
});

function goToIntendedPage() {
  const dest = new URLSearchParams(location.search).get("redirect") || "index.html";
  location.href = dest;
}

function showMsg(text) {
  elMsg.textContent = "⚠️ " + text;
  elMsg.classList.remove("hidden");
}
function hideMsg() {
  elMsg.classList.add("hidden");
}
