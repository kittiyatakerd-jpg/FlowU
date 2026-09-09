// ============================================================
// ยื่นคำร้องใหม่ / แก้ไขคำร้องที่ถูกตีกลับแล้วยื่นใหม่ (สัปดาห์ที่ 7)
// ?edit=<requestId> → โหมดแก้ไขและยื่นใหม่ (BR-04) · ไม่มี query → โหมดยื่นใหม่ปกติ
// ============================================================
import { db } from "./firebase-init.js";
import { requireLogin, getUserProfile } from "./auth-guard.js";
import { renderNav } from "./nav.js";
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const editId = new URLSearchParams(location.search).get("edit");

const elMsg = document.getElementById("formMsg");
const elTypeId = document.getElementById("typeId");
const form = document.getElementById("formRequest");
const btnSubmit = document.getElementById("btnSubmit");

let currentUser = null;

async function main() {
  currentUser = await requireLogin();
  renderNav(currentUser);

  const profile = await getUserProfile(currentUser.uid);
  showProfile(profile);
  await loadTypeOptions();

  if (profile?.phone) document.getElementById("phone").value = profile.phone;

  if (editId) {
    document.getElementById("pageTitle").textContent = "แก้ไขคำร้องและยื่นใหม่";
    btnSubmit.textContent = "บันทึกและยื่นใหม่";
    await prefillForEdit(editId);
  }

  form.addEventListener("submit", onSubmit);
}

function showProfile(profile) {
  document.getElementById("pStudentName").textContent = profile?.name || currentUser.displayName || "ยังไม่ระบุ";
  document.getElementById("pStudentCode").textContent = profile?.studentCode || "ยังไม่ระบุ";
  document.getElementById("pSchoolName").textContent = profile?.schoolName || "ยังไม่ระบุ";
  document.getElementById("pProgramName").textContent = profile?.programName || "ยังไม่ระบุ";
}

async function loadTypeOptions() {
  const q = query(collection(db, "requestTypes"), where("active", "==", true));
  const snap = await getDocs(q);
  if (snap.empty) {
    elTypeId.innerHTML = '<option value="">— ไม่มีประเภทคำร้องให้เลือก —</option>';
    return;
  }
  elTypeId.innerHTML = '<option value="">— เลือก —</option>' +
    snap.docs.map(d => `<option value="${d.id}">${escapeHtml(d.data().name)}</option>`).join("");
}

async function prefillForEdit(requestId) {
  const ref = doc(db, "internshipRequests", requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) { showMsg("ไม่พบคำร้องที่ต้องการแก้ไข"); return; }
  const r = snap.data();

  if (r.studentId !== currentUser.uid) { showMsg("คุณแก้ไขคำร้องของคนอื่นไม่ได้"); return; }
  if (r.status !== "ตีกลับให้แก้ไข") { showMsg("แก้ไขได้เฉพาะคำร้องที่ถูกตีกลับให้แก้ไขเท่านั้น"); return; }

  document.getElementById("phone").value = r.phone || "";
  document.getElementById("semester").value = r.semester || "";
  document.getElementById("academicYear").value = r.academicYear || "";
  elTypeId.value = r.typeId || "";
  document.getElementById("typeDetail").value = r.typeDetail || "";
  document.getElementById("reason").value = r.reason || "";
}

async function onSubmit(e) {
  e.preventDefault();
  hideMsg();

  const phone = document.getElementById("phone").value.trim();
  const semester = document.getElementById("semester").value;
  const academicYear = Number(document.getElementById("academicYear").value);
  const typeId = elTypeId.value;
  const typeDetail = document.getElementById("typeDetail").value.trim();
  const reason = document.getElementById("reason").value.trim();

  if (!phone || !semester || !academicYear || !typeId || !reason) {
    showMsg("กรอกช่องที่มี * ให้ครบก่อน");
    return;
  }

  btnSubmit.disabled = true;
  try {
    const typeSnap = await getDoc(doc(db, "requestTypes", typeId));
    const typeData = typeSnap.data();
    const approvalChain = Array.isArray(typeData.approvalChain) ? typeData.approvalChain : [];
    if (approvalChain.length === 0) {
      showMsg("ประเภทคำร้องนี้ยังไม่มีสายอนุมัติ (approvalChain) กรุณาติดต่อเจ้าหน้าที่");
      btnSubmit.disabled = false;
      return;
    }

    const commonFields = {
      phone, semester, academicYear,
      typeId, typeName: typeData.name, typeDetail, reason,
      approvalChain, totalLevels: approvalChain.length,
      currentLevel: 1, status: "รอพิจารณา",
      returnReason: "", returnedByLevel: null,
      currentLevelSince: serverTimestamp(), updatedAt: serverTimestamp()
    };

    if (editId) {
      const ref = doc(db, "internshipRequests", editId);
      const snap = await getDoc(ref);
      const round = (snap.data().round || 1) + 1;
      await updateDoc(ref, Object.assign({}, commonFields, { round }));
      location.href = "request-detail.html?id=" + editId;
    } else {
      const profile = await getUserProfile(currentUser.uid);
      const newDoc = Object.assign({}, commonFields, {
        studentId: currentUser.uid,
        studentName: profile?.name || currentUser.displayName || "",
        studentCode: profile?.studentCode || "",
        schoolName: profile?.schoolName || "",
        programName: profile?.programName || "",
        round: 1,
        createdAt: serverTimestamp()
      });
      await addDoc(collection(db, "internshipRequests"), newDoc);
      location.href = "index.html";
    }
  } catch (err) {
    console.error(err);
    showMsg("บันทึกไม่สำเร็จ: " + err.message);
    btnSubmit.disabled = false;
  }
}

function showMsg(text) {
  elMsg.textContent = "⚠️ " + text;
  elMsg.classList.remove("hidden");
}
function hideMsg() {
  elMsg.classList.add("hidden");
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

main();
