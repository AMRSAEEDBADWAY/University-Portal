/**
 * admin.js — لوحة الإدارة: إحصائيات، تسليمات بانتظار التصحيح، رصد الدرجات
 * الصلاحية: نفس منطق auth-guard (أيميلات الدكتور / مدير المنصة)
 */
const ALLOWED_DOCTOR_EMAILS = ["amrsaeedbadwey@gmail.com"];

function userIsAdmin(user, userData) {
    if (!user || !user.email) return false;
    const userEmail = (user.email || "").toLowerCase();
    const userName = ((userData && userData.name) || "").toLowerCase();
    return (
        userEmail.includes("amrsaeed") ||
        userName.includes("amr saeed") ||
        ALLOWED_DOCTOR_EMAILS.some(function (email) {
            return email.toLowerCase().trim() === userEmail.trim();
        })
    );
}

function esc(s) {
    if (s == null) return "";
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", function () {
    var check = setInterval(function () {
        if (typeof firebase === "undefined" || !firebase.auth || !firebase.firestore) return;
        clearInterval(check);
        var db = firebase.firestore();

        firebase.auth().onAuthStateChanged(async function (user) {
            if (!user) return;

            var userData = {};
            try {
                var snap = await db.collection("users").doc(user.uid).get();
                if (snap.exists) userData = snap.data();
            } catch (e) {
                console.warn(e);
            }

            if (!userIsAdmin(user, userData)) {
                window.location.href = "dashboard.html";
                return;
            }

            await loadStats(db);
            await loadSubmissionsTable(db);
        });
    }, 100);
});

async function loadStats(db) {
    try {
        var usersSnap = await db.collection("users").get();
        var assignSnap = await db.collection("assignments").get();
        var subSnap = await db.collection("submissions").get();
        var pendingGrade = 0;
        subSnap.forEach(function (d) {
            var g = d.data().grade;
            if (g === undefined || g === null) pendingGrade++;
        });
        var elU = document.getElementById("statUsers");
        var elA = document.getElementById("statAssignments");
        var elS = document.getElementById("statSubmissions");
        var elP = document.getElementById("statPendingGrade");
        if (elU) elU.textContent = usersSnap.size;
        if (elA) elA.textContent = assignSnap.size;
        if (elS) elS.textContent = subSnap.size;
        if (elP) elP.textContent = pendingGrade;
    } catch (e) {
        console.error(e);
    }
}

async function loadSubmissionsTable(db) {
    var tbody = document.getElementById("adminSubmissionsBody");
    if (!tbody) return;
    tbody.innerHTML =
        '<tr><td colspan="6" style="padding:20px;text-align:center;color:var(--text-300);">جاري التحميل...</td></tr>';

    try {
        var titles = {};
        var asnap = await db.collection("assignments").get();
        asnap.forEach(function (d) {
            titles[d.id] = (d.data() && d.data().title) || d.id;
        });

        var qsnap;
        try {
            qsnap = await db.collection("submissions").orderBy("submittedAt", "desc").limit(80).get();
        } catch (err) {
            console.warn("submissions orderBy:", err);
            qsnap = await db.collection("submissions").limit(80).get();
        }

        if (qsnap.empty) {
            tbody.innerHTML =
                '<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--text-300);">لا توجد تسليمات بعد.</td></tr>';
            return;
        }

        var rows = [];
        qsnap.forEach(function (doc) {
            var s = doc.data();
            var aid = s.assignmentId || "";
            var title = titles[aid] || aid || "—";
            var submitted =
                s.submittedAt && s.submittedAt.toDate
                    ? s.submittedAt.toDate().toLocaleString("ar-EG")
                    : "—";
            var hasGrade = s.grade !== undefined && s.grade !== null;
            var gradeCell = hasGrade
                ? '<span style="color:var(--emerald);font-weight:700;">' + esc(s.grade) + "</span>"
                : '<span style="color:var(--warning);">بانتظار التصحيح</span>';
            var fileLink = s.fileUrl
                ? '<a href="' +
                  esc(s.fileUrl) +
                  '" target="_blank" rel="noopener" class="btn-premium btn-ghost" style="font-size:0.75rem;padding:6px 10px;text-decoration:none;"><i class="fas fa-external-link-alt"></i> فتح</a>'
                : "—";

            var gradeBtn = hasGrade
                ? '<button type="button" class="btn-premium btn-ghost" style="font-size:0.75rem;padding:6px 10px;" onclick="adminEditGrade(\'' +
                  doc.id +
                  "', " +
                  Number(s.grade) +
                  ')"><i class="fas fa-edit"></i></button>'
                : '<button type="button" class="btn-premium btn-primary" style="font-size:0.75rem;padding:6px 10px;" onclick="adminEditGrade(\'' +
                  doc.id +
                  "', null)\"><i class=\"fas fa-check\"></i> رصد</button>";

            rows.push(
                "<tr style=\"border-bottom:1px solid var(--border-light);\">" +
                    '<td style="padding:12px;">' +
                    esc(s.studentName || s.studentId || "—") +
                    "</td>" +
                    '<td style="padding:12px;">' +
                    esc(title) +
                    "</td>" +
                    '<td style="padding:12px;">' +
                    esc(s.fileName || "—") +
                    "</td>" +
                    '<td style="padding:12px;">' +
                    submitted +
                    "</td>" +
                    '<td style="padding:12px;">' +
                    gradeCell +
                    "</td>" +
                    '<td style="padding:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
                    fileLink +
                    gradeBtn +
                    "</td>" +
                    "</tr>"
            );
        });
        tbody.innerHTML = rows.join("");
    } catch (e) {
        console.error(e);
        tbody.innerHTML =
            '<tr><td colspan="6" style="padding:20px;color:var(--rose);">تعذّر تحميل التسليمات: ' +
            esc(e.message) +
            "</td></tr>";
    }
}

window.adminEditGrade = function (submissionId, currentGrade) {
    if (typeof Swal === "undefined") {
        var v = prompt("الدرجة (رقماً):", currentGrade != null ? String(currentGrade) : "");
        if (v === null || v === "") return;
        adminSaveGrade(submissionId, parseFloat(v));
        return;
    }
    Swal.fire({
        title: "رصد الدرجة",
        input: "number",
        inputValue: currentGrade != null ? currentGrade : "",
        inputAttributes: { min: 0, max: 100, step: 0.5 },
        showCancelButton: true,
        confirmButtonText: "حفظ",
        cancelButtonText: "إلغاء",
        inputValidator: function (value) {
            if (value === "" || value === null) return "أدخل رقماً";
            var n = Number(value);
            if (isNaN(n) || n < 0) return "درجة غير صالحة";
        },
    }).then(function (res) {
        if (res.isConfirmed && res.value !== undefined && res.value !== "") {
            adminSaveGrade(submissionId, Number(res.value));
        }
    });
};

function adminSaveGrade(submissionId, grade) {
    var db = firebase.firestore();
    var user = firebase.auth().currentUser;
    var showLoading = typeof Swal !== "undefined";
    if (showLoading) {
        Swal.fire({ title: "جاري الحفظ...", allowOutsideClick: false, didOpen: function () { Swal.showLoading(); } });
    }
    db.collection("submissions")
        .doc(submissionId)
        .update({
            grade: grade,
            gradedAt: firebase.firestore.FieldValue.serverTimestamp(),
            gradedBy: user ? user.email : null,
        })
        .then(function () {
            if (showLoading) Swal.fire({ icon: "success", title: "تم حفظ الدرجة", timer: 1600, showConfirmButton: false });
            return loadStats(db);
        })
        .then(function () {
            return loadSubmissionsTable(db);
        })
        .catch(function (err) {
            if (showLoading) Swal.fire({ icon: "error", title: "فشل الحفظ", text: err.message || String(err) });
            else alert(err.message || String(err));
        });
}
