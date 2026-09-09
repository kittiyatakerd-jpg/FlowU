// ============================================================
// รายละเอียดคำร้อง — Update (ความเห็น/ตัดสิน) + Delete (สัปดาห์ที่ 7)
// กฎธุรกิจอ้างอิงจาก CLAUDE.md ข้อ 1-9
// ============================================================
import { db } from "./firebase-init.js";
import { requireLogin, getUserProfile } from "./auth-guard.js";
import { renderNav } from "./nav.js";
import {
  doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const requestId = new URLSearchParams(location.search).get("id");
const elBox = document.getElementById("requestBox");
const elMsg = document.getElementById("pageMsg");
const elCommentBox = document.getElementById("commentBox");
const elTimeline = document.getElementById("timeline");

let currentUser = null;
let profile = null;
let requestData = null;
let approvals = [];

async function main() {
  currentUser = await requireLogin();
  renderNav(currentUser);
  profile = await getUserProfile(currentUser.uid);

  if (!requestId) { showBoxError("ไม่พบรหัสคำร้องใน URL"); return; }
  await load();
}

async function load() {
  const ref = doc(db, "internshipRequests", requestId);
  try {
    const [snap, approvalsSnap] = await Promise.all([
      getDoc(ref),
      getDocs(query(collection(ref, "approvals"), orderBy("createdAt")))
    ]);
    if (!snap.exists()) { showBoxError("ไม่พบคำร้องนี้ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง"); return; }

    requestData = Object.assign({ id: snap.id }, snap.data());
    approvals = approvalsSnap.docs.map(d => Object.assign({ id: d.id }, d.data()));

    renderRequest();
    renderTimeline();
  } catch (err) {
    console.error(err);
    showBoxError("โหลดข้อมูลไม่สำเร็จ: " + err.message);
  }
}

function renderRequest() {
  const r = requestData;
  const isOwner = r.studentId === currentUser.uid;
  const chain = Array.isArray(r.approvalChain) ? r.approvalChain : [];
  const step = chain.find(c => c.level === r.currentLevel);
  const isFinal = r.currentLevel === r.totalLevels;

  const rows = [
    ["หัวข้อ/ประเภท", esc(r.typeName)],
    ["รายละเอียด/เหตุผล", esc(r.reason)],
    ["ข้อมูลเพิ่มตามประเภท", r.typeDetail ? esc(r.typeDetail) : "—"],
    ["ภาคการศึกษา / ปี", `${esc(r.semester)} / ${esc(r.academicYear)}`],
    ["นักศึกษา", `${esc(r.studentName)} (${esc(r.studentCode || "ไม่ระบุรหัส")})`],
    ["เบอร์โทรติดต่อ", esc(r.phone)],
    ["สถานะ", `<span class="${badgeClass(r.status)}">${esc(r.status)}</span>`],
    ["อยู่ที่ระดับ", r.status === "รอพิจารณา" ? `ระดับ ${r.currentLevel} / ${r.totalLevels}` + (step ? ` (${esc(step.title)})` : "") : "—"],
    ["รอบที่ยื่น", esc(r.round || 1)],
    ["ยื่นเมื่อ", thaiDateTime(r.createdAt)]
  ];

  if (r.status === "ตีกลับให้แก้ไข") {
    rows.push(["เหตุผลที่ถูกตีกลับ", esc(r.returnReason || "—")]);
  }
  if (r.status === "อนุมัติ" && r.penaltyHoursApproved != null) {
    rows.push(["ชั่วโมงบำเพ็ญประโยชน์ (อนุมัติ)", esc(r.penaltyHoursApproved)]);
  }

  let html = rows.map(([k, v]) => `<div class="field-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join("");

  // ── ปุ่มฝั่งผู้พิจารณา ──
  const canReview = profile?.role === "approver" && profile?.approvalLevel === r.currentLevel &&
                     r.studentId !== currentUser.uid && r.status === "รอพิจารณา";
  if (canReview) {
    html += '<div class="btn-row">';
    if (isFinal) {
      html += '<button type="button" class="btn-ok" id="btnApprove">อนุมัติ</button>' +
              '<button type="button" class="btn-danger" id="btnReject">ไม่อนุมัติ</button>';
    } else {
      html += '<button type="button" class="btn-ok" id="btnAgree">เห็นด้วย</button>' +
              '<button type="button" class="btn-danger" id="btnDisagree">ไม่เห็นด้วย</button>';
    }
    html += '</div>';
  }

  // ── ปุ่มฝั่งเจ้าของคำร้อง ──
  if (isOwner && r.status === "ตีกลับให้แก้ไข") {
    html += `<div class="btn-row"><a href="new-request.html?edit=${r.id}" class="btn">แก้ไขและยื่นใหม่</a></div>`;
  }
  if (isOwner && r.status === "รอพิจารณา") {
    html += '<div class="btn-row"><button type="button" class="btn-ghost" id="btnDelete">ลบคำร้องนี้</button></div>';
  }

  elBox.innerHTML = html;

  if (canReview) {
    if (isFinal) {
      document.getElementById("btnApprove").addEventListener("click", () => doFinalDecision("อนุมัติ"));
      document.getElementById("btnReject").addEventListener("click", () => doFinalDecision("ไม่อนุมัติ"));
    } else {
      document.getElementById("btnAgree").addEventListener("click", () => doOpinion(true));
      document.getElementById("btnDisagree").addEventListener("click", () => doOpinion(false));
    }
  }
  if (isOwner && r.status === "รอพิจารณา") {
    document.getElementById("btnDelete").addEventListener("click", doDelete);
  }
}

// ── ระดับความเห็น (level < totalLevels): เห็นด้วย/ไม่เห็นด้วย ──
async function doOpinion(agree) {
  hideMsg();
  const r = requestData;
  const chain = Array.isArray(r.approvalChain) ? r.approvalChain : [];
  const step = chain.find(c => c.level === r.currentLevel);
  let comment = "";

  if (!agree) {
    comment = prompt("กรุณากรอกเหตุผลที่ไม่เห็นด้วย (บังคับกรอก)");
    if (!comment || !comment.trim()) { showMsg("ต้องกรอกเหตุผลก่อนจึงจะไม่เห็นด้วยได้"); return; }
  }

  const ref = doc(db, "internshipRequests", r.id);
  try {
    await addDoc(collection(ref, "approvals"), {
      round: r.round || 1, level: r.currentLevel,
      approverId: currentUser.uid, approverName: profile?.name || currentUser.email,
      approverTitle: step?.title || "", decision: agree ? "เห็นด้วย" : "ไม่เห็นด้วย",
      comment: comment.trim(), createdAt: serverTimestamp()
    });

    if (agree) {
      await updateDoc(ref, { currentLevel: r.currentLevel + 1, currentLevelSince: serverTimestamp(), updatedAt: serverTimestamp() });
    } else {
      await updateDoc(ref, {
        status: "ตีกลับให้แก้ไข", returnReason: comment.trim(), returnedByLevel: r.currentLevel,
        updatedAt: serverTimestamp()
      });
    }
    await load();
  } catch (err) {
    showMsg("บันทึกผลไม่สำเร็จ: " + err.message);
  }
}

// ── ระดับสุดท้าย (decision): อนุมัติ/ไม่อนุมัติ ──
async function doFinalDecision(decision) {
  hideMsg();
  const r = requestData;
  const chain = Array.isArray(r.approvalChain) ? r.approvalChain : [];
  const step = chain.find(c => c.level === r.currentLevel);

  let penaltyHours = null;
  let comment = "";
  if (decision === "อนุมัติ") {
    const input = prompt("กำหนดชั่วโมงบำเพ็ญประโยชน์ (ตัวเลข)");
    if (input === null) return;
    penaltyHours = Number(input);
    if (!Number.isFinite(penaltyHours) || penaltyHours < 0) { showMsg("กรอกชั่วโมงเป็นตัวเลขที่ถูกต้อง"); return; }
  } else {
    comment = prompt("กรุณากรอกเหตุผลที่ไม่อนุมัติ (บังคับกรอก)");
    if (!comment || !comment.trim()) { showMsg("ต้องกรอกเหตุผลก่อนจึงจะไม่อนุมัติได้"); return; }
  }

  const ref = doc(db, "internshipRequests", r.id);
  try {
    await addDoc(collection(ref, "approvals"), {
      round: r.round || 1, level: r.currentLevel,
      approverId: currentUser.uid, approverName: profile?.name || currentUser.email,
      approverTitle: step?.title || "", decision,
      comment: comment.trim(), proposedPenaltyHours: penaltyHours, createdAt: serverTimestamp()
    });

    const patch = { status: decision, updatedAt: serverTimestamp() };
    if (decision === "อนุมัติ") patch.penaltyHoursApproved = penaltyHours;
    await updateDoc(ref, patch);
    await load();
  } catch (err) {
    showMsg("บันทึกผลไม่สำเร็จ: " + err.message);
  }
}

async function doDelete() {
  if (!confirm(`ยืนยันการลบคำร้อง "${requestData.typeName}" หรือไม่ — ลบแล้วกู้คืนไม่ได้`)) return;
  try {
    await deleteDoc(doc(db, "internshipRequests", requestData.id));
    location.href = "index.html";
  } catch (err) {
    showMsg("ลบไม่สำเร็จ: " + err.message);
  }
}

function renderTimeline() {
  if (approvals.length === 0) {
    elCommentBox.classList.add("hidden");
    return;
  }
  elCommentBox.classList.remove("hidden");
  elTimeline.innerHTML = approvals.map(a => `
    <div class="timeline-item">
      <div class="meta">รอบที่ ${esc(a.round)} · ระดับ ${esc(a.level)} · ${esc(a.approverTitle)} — ${esc(a.approverName)} · ${thaiDateTime(a.createdAt)}</div>
      <div><b>${esc(a.decision)}</b>${a.comment ? " — " + esc(a.comment) : ""}${a.proposedPenaltyHours != null ? ` (ชั่วโมงบำเพ็ญประโยชน์: ${esc(a.proposedPenaltyHours)})` : ""}</div>
    </div>
  `).join("");
}

function badgeClass(status) {
  if (status === "อนุมัติ") return "b b-ok";
  if (status === "ไม่อนุมัติ") return "b b-no";
  if (status === "ตีกลับให้แก้ไข") return "b b-back";
  return "b b-wait";
}
function thaiDateTime(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function showBoxError(text) {
  elBox.innerHTML = `<p>${esc(text)}</p>`;
}
function showMsg(text) {
  elMsg.textContent = "⚠️ " + text;
  elMsg.classList.remove("hidden");
}
function hideMsg() {
  elMsg.classList.add("hidden");
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

main();
