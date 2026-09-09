// ============================================================
// หน้ารายการคำร้อง — อ่านข้อมูลจริงจาก Firestore
// ============================================================
import { db } from "./firebase-init.js";
import { requireLogin } from "./auth-guard.js";
import { renderNav } from "./nav.js";
import {
  collection, getDocs, query, orderBy, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const elStatus = document.getElementById("status");
const elBody   = document.getElementById("tbody");
const elTypes  = document.getElementById("types");
const elCount  = document.getElementById("count");

// แปลงสถานะเป็นชื่อคลาสของป้ายสี
function badgeClass(status) {
  if (status === "อนุมัติ")        return "b b-ok";
  if (status === "ไม่อนุมัติ")      return "b b-no";
  if (status === "ตีกลับให้แก้ไข")  return "b b-back";
  return "b b-wait";
}

// แปลง timestamp ของ Firestore เป็นข้อความวันที่ไทย
function thaiDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

// โหลดประเภทคำร้องมาแสดงเป็นชิป
async function loadTypes() {
  const q = query(collection(db, "requestTypes"), orderBy("order"));
  const snap = await getDocs(q);
  if (snap.empty) {
    elTypes.innerHTML = '<span class="muted">ยังไม่มีข้อมูลใน requestTypes</span>';
    return;
  }
  elTypes.innerHTML = "";
  snap.forEach(doc => {
    const t = doc.data();
    const chip = document.createElement("span");
    chip.className = "chip" + (t.active === false ? " off" : "");
    chip.textContent = t.name;
    elTypes.appendChild(chip);
  });
}

// โหลดคำร้องทั้งหมดมาแสดงเป็นตาราง
async function loadRequests() {
  const q = query(collection(db, "internshipRequests"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  elCount.textContent = snap.size;

  if (snap.empty) {
    elBody.innerHTML =
      '<tr><td colspan="5" class="empty">ยังไม่มีคำร้องในฐานข้อมูล ' +
      'ลองเพิ่มเอกสารใน Firestore Console ตามคู่มือใน seed/README.md</td></tr>';
    return;
  }

  elBody.innerHTML = "";
  snap.forEach(doc => {
    const r  = doc.data();
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";

    const level = (r.currentLevel && r.totalLevels)
      ? `ระดับ ${r.currentLevel} / ${r.totalLevels}`
      : "—";

    tr.innerHTML = `
      <td>
        <div class="tt">${r.typeName ?? "(ไม่ระบุประเภท)"}</div>
        <div class="tm">${doc.id} · รอบที่ ${r.round ?? 1}</div>
      </td>
      <td>
        <div>${r.studentName ?? "—"}</div>
        <div class="tm">${r.studentCode ?? ""}</div>
      </td>
      <td>${thaiDate(r.createdAt)}</td>
      <td>${level}</td>
      <td><span class="${badgeClass(r.status)}">${r.status ?? "—"}</span></td>
    `;
    tr.addEventListener("click", () => {
      location.href = "request-detail.html?id=" + encodeURIComponent(doc.id);
    });
    elBody.appendChild(tr);
  });
}

// เรียกทั้งสองอย่าง และแจ้งข้อผิดพลาดเป็นภาษาไทยถ้าล้มเหลว
async function main() {
  await requireLogin().then(renderNav);
  try {
    await Promise.all([loadTypes(), loadRequests()]);
    elStatus.className = "alert ok";
    elStatus.textContent = "เชื่อมต่อ Firestore สำเร็จ ข้อมูลด้านล่างมาจากฐานข้อมูลจริง";
  } catch (err) {
    console.error(err);
    elStatus.className = "alert err";
    elStatus.innerHTML =
      "<b>เชื่อมต่อฐานข้อมูลไม่สำเร็จ</b><br>" +
      "ตรวจสอบว่าคัดลอก js/config.example.js เป็น js/config.js และใส่ค่าจริงแล้ว " +
      "และเผยแพร่ firestore.rules ขึ้น Firebase แล้ว<br>" +
      "<span class='tm'>รายละเอียด: " + (err?.message ?? err) + "</span>";
  }
}

main();
