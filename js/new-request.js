// ============================================================
// ยื่นคำร้องใหม่ / แก้ไขคำร้องที่ถูกตีกลับแล้วยื่นใหม่ (สัปดาห์ที่ 7)
// ?edit=<requestId> → โหมดแก้ไขและยื่นใหม่ (BR-04) · ไม่มี query → โหมดยื่นใหม่ปกติ
// ============================================================
import { db } from "./firebase-init.js";
import { requireLogin, getUserProfile } from "./auth-guard.js";
import { renderNav } from "./nav.js";
import { OPENROUTER_API_KEY, OPENROUTER_MODEL } from "./ai-config.js";
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const editId = new URLSearchParams(location.search).get("edit");

const elMsg = document.getElementById("formMsg");
const elTypeId = document.getElementById("typeId");
const elReason = document.getElementById("reason");
const elAiSuggestion = document.getElementById("aiSuggestion");
const btnAiClassify = document.getElementById("btnAiClassify");
const form = document.getElementById("formRequest");
const btnSubmit = document.getElementById("btnSubmit");

let currentUser = null;
let typeList = []; // [{id, name}] เก็บไว้ให้ทั้งดรอปดาวน์และ AI ใช้ชุดเดียวกัน

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
  btnAiClassify.addEventListener("click", classifyWithAi);
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
  typeList = snap.docs.map(d => ({ id: d.id, name: d.data().name }));
  elTypeId.innerHTML = '<option value="">— เลือก —</option>' +
    typeList.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("");
}

// ── ให้ AI อ่านเหตุผลแล้วช่วยเลือกประเภทคำร้องที่ตรงที่สุด ──
// AI แค่ "เสนอ" ไม่ตัดสินใจแทน — นักศึกษาต้องตรวจสอบ/แก้ไขได้เสมอก่อนกดบันทึกจริง
async function classifyWithAi() {
  const reason = elReason.value.trim();
  elAiSuggestion.classList.add("hidden");

  if (!reason) {
    showAiSuggestion("⚠️ กรอกเหตุผลอย่างละเอียดก่อน แล้ว AI ถึงจะเลือกประเภทให้ได้", "err");
    return;
  }
  if (typeList.length === 0) {
    showAiSuggestion("⚠️ ยังโหลดรายการประเภทคำร้องไม่เสร็จ ลองใหม่อีกครั้ง", "err");
    return;
  }

  btnAiClassify.disabled = true;
  btnAiClassify.textContent = "🤖 กำลังคิด...";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const names = typeList.map(t => t.name).join(", ");
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": "Bearer " + OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{
          role: "user",
          content:
            "นี่คือรายชื่อประเภทคำร้องฝึกปฏิบัติงานที่มีอยู่จริงในระบบเท่านั้น: " + names + "\n" +
            "เหตุผลของนักศึกษาคือ: \"" + reason + "\"\n" +
            "เลือกประเภทที่ตรงที่สุดจากรายชื่อด้านบนเท่านั้น ตอบเป็นชื่อประเภทตรงตัวเป๊ะคำเดียว ห้ามอธิบายเพิ่ม " +
            "ถ้าไม่มีประเภทไหนตรงเลย ให้ตอบคำว่า ไม่แน่ใจ"
        }]
      })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const answer = (data.choices?.[0]?.message?.content || "").trim();
    const matched = typeList.find(t => t.name === answer);

    if (!matched) {
      showAiSuggestion(
        `🤖 AI เลือกประเภทให้ไม่ได้ (ตอบว่า "${escapeHtml(answer)}" ซึ่งไม่ตรงกับประเภทที่มีอยู่จริง) — เลือกเองด้านบนได้เลย`,
        "err"
      );
      return;
    }

    elTypeId.value = matched.id;
    showAiSuggestion(
      `🤖 <strong>ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน:</strong> ${escapeHtml(matched.name)} ` +
      `<span class="muted">(แก้เป็นประเภทอื่นในดรอปดาวน์ด้านบนได้ตามต้องการ)</span>`,
      "wait"
    );
  } catch (err) {
    const text = err.name === "AbortError" ? "AI ตอบช้าเกิน 15 วินาที" : "เรียก AI ไม่สำเร็จ: " + err.message;
    showAiSuggestion("⚠️ " + text + " — เลือกประเภทเองด้านบนแล้วบันทึกได้ตามปกติ", "err");
  } finally {
    clearTimeout(timer);
    btnAiClassify.disabled = false;
    btnAiClassify.textContent = "🤖 ให้ AI ช่วยเลือกประเภทคำร้อง";
  }
}

function showAiSuggestion(html, kind) {
  elAiSuggestion.className = "alert " + (kind === "err" ? "err" : "wait");
  elAiSuggestion.innerHTML = html;
  elAiSuggestion.classList.remove("hidden");
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
