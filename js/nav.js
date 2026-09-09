// ============================================================
// แถบหัวเรื่องเดียวกันทุกหน้า — โชว่ผู้ใช้ที่ล็อกอินอยู่ + ปุ่มออกจากระบบ
// เรียกใช้: renderNav(user) หลังจาก requireLogin() สำเร็จ
// ============================================================
import { auth } from "./firebase-init.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export function renderNav(user) {
  const el = document.getElementById("navUser");
  if (!el) return;
  el.innerHTML = `
    <div class="who-user">
      <span>${escapeHtml(user.displayName || user.email)}</span>
      <button type="button" class="btn-ghost" id="btnLogout" style="padding:5px 12px">ออกจากระบบ</button>
    </div>
  `;
  document.getElementById("btnLogout").addEventListener("click", async () => {
    await signOut(auth);
    location.href = "login.html";
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
