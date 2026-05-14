/*
   ================================================================
   STUDENT ASSIGNMENTS LOGIC — Member 4 (Rafik)
   ================================================================
   NOTE: Running in DEMO MODE (standalone).
   Firebase code is commented out — uncomment when Auth (Member 2) is ready.
*/

// ==================== STATE ====================
const ALLOWED_DOCTOR_EMAILS = ['amrsaeedbadwey@gmail.com'];
let db = null;
let allAssignments = { pending: [], submitted: [], graded: [] };
let selectedFile = null;
let currentAssignmentId = null;
let countdownIntervals = [];

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase
    const checkFirebase = setInterval(function() {
        if (typeof firebase !== 'undefined' && firebase.firestore && firebase.auth) {
            clearInterval(checkFirebase);
            db = firebase.firestore();
            initApp();
        }
    }, 100);

    // Tab click listeners
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { switchTab(btn.dataset.tab); });
    });

    // Drag & Drop — تجهيز الملف كـ Data URL داخل Firestore (بدون Storage)
    var uploadArea = document.getElementById('uploadArea');
    var fileInput = document.getElementById('fileInput');
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', function(e) {
            if (e.target.closest('.remove-file')) return;
            e.preventDefault();
            fileInput.click();
        });
        uploadArea.addEventListener('dragenter', function(e) { e.preventDefault(); uploadArea.classList.add('drag-over'); });
        uploadArea.addEventListener('dragover', function(e) { e.preventDefault(); uploadArea.classList.add('drag-over'); });
        uploadArea.addEventListener('dragleave', function(e) { e.preventDefault(); uploadArea.classList.remove('drag-over'); });
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', function() {
            if (fileInput.files[0]) processFile(fileInput.files[0]);
        });
    }
});

async function initApp() {
    firebase.auth().onAuthStateChanged(async function(user) {
        if (!user) return; // auth-guard handles redirect
        
        // Update UI with user data if needed (auth-guard might already do this)
        if (window.updateUIWithUserData) window.updateUIWithUserData();

        // Load data from Firestore
        await refreshData();
    });
}

// ==================== DATA FETCHING ====================
async function refreshData() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
        // 1. Fetch all assignments
        const assignmentsSnap = await db.collection("assignments").orderBy("deadline", "asc").get();
        const assignments = [];
        assignmentsSnap.forEach(doc => {
            const data = doc.data();
            let deadlineDate = new Date();
            if (data.deadline) {
                if (typeof data.deadline.toDate === 'function') {
                    deadlineDate = data.deadline.toDate();
                } else {
                    deadlineDate = new Date(data.deadline);
                }
            }
            assignments.push({ id: doc.id, ...data, deadlineDate: deadlineDate });
        });

        // 2. Fetch student's submissions
        const submissionsSnap = await db.collection("submissions").where("studentId", "==", user.uid).get();
        const submissions = {};
        submissionsSnap.forEach(doc => {
            const data = doc.data();
            submissions[data.assignmentId] = { id: doc.id, ...data };
        });

        // 3. Categorize
        allAssignments = { pending: [], submitted: [], graded: [] };
        const now = new Date();

        assignments.forEach(a => {
            const sub = submissions[a.id];
            if (sub) {
                if (sub.grade !== undefined) {
                    allAssignments.graded.push({ ...a, submission: sub });
                } else {
                    allAssignments.submitted.push({ ...a, submission: sub });
                }
            } else {
                a.isOverdue = a.deadlineDate < now;
                allAssignments.pending.push(a);
            }
        });

        // Render
        renderPending();
        renderSubmitted();
        renderGraded();
        updateTabCounts();
    } catch (error) {
        console.error("Error refreshing data:", error);
        showToast("❌ حدث خطأ أثناء تحميل البيانات", "error");
    }
}

// ==================== HELPERS ====================
function getIconClass(icon) {
    var map = { ai: 'fa-robot', db: 'fa-database', web: 'fa-code', math: 'fa-square-root-variable', os: 'fa-microchip', network: 'fa-network-wired' };
    return map[icon] || 'fa-book';
}

function getPriority(deadline) {
    if (!deadline) return 'low';
    var hours = (deadline - new Date()) / (1000 * 60 * 60);
    if (hours < 24) return 'high';
    if (hours < 72) return 'medium';
    return 'low';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ==================== RENDER ====================
function renderPending() {
    var container = document.getElementById('pendingList');
    if (!container) return;
    if (allAssignments.pending.length === 0) { renderEmptyState('pending'); return; }

    var html = '';
    allAssignments.pending.forEach(function(a) {
        html += '<div class="assignment-card priority-' + getPriority(a.deadlineDate) + '" data-id="' + a.id + '">' +
            '<div class="course-badge ' + (a.courseIcon || 'ai') + '"><i class="fas ' + getIconClass(a.courseIcon) + '"></i></div>' +
            '<div class="assignment-info">' +
                '<h3>' + a.title + '</h3>' +
                '<div class="assignment-meta">' +
                    '<span class="course-label">' + (a.courseName || 'مادة عامة') + '</span>' +
                    '<span class="meta-item"><i class="fas fa-star"></i> ' + (a.maxGrade || a.totalGrade || 0) + ' درجة</span>' +
                    (a.isOverdue ? '<span class="status-badge late"><i class="fas fa-exclamation-triangle"></i> فات الميعاد</span>' : '') +
                '</div>' +
            '</div>' +
            '<div class="countdown-section">' +
                '<div class="countdown-timer" data-deadline="' + a.deadlineDate.toISOString() + '"></div>' +
                '<span class="countdown-label">الوقت المتبقي</span>' +
            '</div>' +
            '<div class="card-actions">' +
                '<button class="btn-submit" onclick="openSubmitModal(\'' + a.id + '\', \'' + a.title.replace(/'/g, "\\'") + '\', \'' + a.deadlineDate.toISOString() + '\')">' +
                    '<i class="fas fa-upload"></i> تسليم الواجب</button>' +
                '<button class="btn-view" onclick="viewDetails(\'' + a.id + '\')">' +
                    '<i class="fas fa-eye"></i> التفاصيل</button>' +
            '</div>' +
        '</div>';
    });
    container.innerHTML = html;
    startCountdowns();
}

function renderSubmitted() {
    var container = document.getElementById('submittedList');
    if (!container) return;
    if (allAssignments.submitted.length === 0) { renderEmptyState('submitted'); return; }

    var html = '';
    allAssignments.submitted.forEach(function(a) {
        var subDate = a.submission.submittedAt.toDate ? a.submission.submittedAt.toDate() : new Date();
        html += '<div class="assignment-card priority-low" data-id="' + a.id + '">' +
            '<div class="course-badge ' + (a.courseIcon || 'ai') + '"><i class="fas ' + getIconClass(a.courseIcon) + '"></i></div>' +
            '<div class="assignment-info">' +
                '<h3>' + a.title + '</h3>' +
                '<div class="assignment-meta">' +
                    '<span class="course-label">' + a.courseName + '</span>' +
                    '<span class="meta-item"><i class="fas fa-calendar-check"></i> ' + subDate.toLocaleDateString('ar-EG') + '</span>' +
                    '<span class="meta-item"><i class="fas fa-file-pdf"></i> ' + (a.submission.fileName || 'ملف مرفق') + '</span>' +
                '</div>' +
            '</div>' +
            '<span class="status-badge submitted"><i class="fas fa-clock"></i> في انتظار التصحيح</span>' +
        '</div>';
    });
    container.innerHTML = html;
}

function renderGraded() {
    var container = document.getElementById('gradedList');
    if (!container) return;
    if (allAssignments.graded.length === 0) { renderEmptyState('graded'); return; }

    var html = '';
    allAssignments.graded.forEach(function(a) {
        var pct = (a.submission.grade / (a.totalGrade || 1)) * 100;
        var gradeClass = pct >= 85 ? 'excellent' : pct >= 60 ? 'good' : 'poor';
        html += '<div class="assignment-card priority-low" data-id="' + a.id + '">' +
            '<div class="course-badge ' + (a.courseIcon || 'ai') + '"><i class="fas ' + getIconClass(a.courseIcon) + '"></i></div>' +
            '<div class="assignment-info">' +
                '<h3>' + a.title + '</h3>' +
                '<div class="assignment-meta">' +
                    '<span class="course-label">' + a.courseName + '</span>' +
                    '<span class="status-badge graded"><i class="fas fa-check-circle"></i> تم التصحيح</span>' +
                '</div>' +
                (a.submission.feedback ? '<div class="feedback-text"><i class="fas fa-comment-dots"></i> ' + a.submission.feedback + '</div>' : '') +
            '</div>' +
            '<div class="grade-display">' +
                '<div class="grade-circle ' + gradeClass + '">' + a.submission.grade + '</div>' +
                '<div class="grade-label">من ' + a.totalGrade + '</div>' +
            '</div>' +
        '</div>';
    });
    container.innerHTML = html;
}

function renderEmptyState(tab) {
    var container = document.getElementById(tab + 'List');
    var messages = {
        pending: { icon: 'fa-check-circle', title: 'لا توجد واجبات مطلوبة', desc: 'أحسنت! لا يوجد واجبات مطلوبة منك حالياً.' },
        submitted: { icon: 'fa-paper-plane', title: 'لا توجد واجبات مسلّمة', desc: 'الواجبات اللي هتسلمها هتظهر هنا.' },
        graded: { icon: 'fa-award', title: 'لا توجد واجبات مصححة', desc: 'درجات الواجبات هتظهر هنا بعد التصحيح.' }
    };
    var m = messages[tab];
    if (container && m) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="fas ' + m.icon + '"></i></div><h3>' + m.title + '</h3><p>' + m.desc + '</p></div>';
    }
}

// ==================== COUNTDOWN ====================
function startCountdowns() {
    countdownIntervals.forEach(function(id) { clearInterval(id); });
    countdownIntervals = [];

    document.querySelectorAll('.countdown-timer').forEach(function(timer) {
        var deadline = new Date(timer.dataset.deadline);
        function update() {
            var now = new Date();
            var diff = deadline - now;
            if (diff <= 0) {
                timer.innerHTML = '<span style="color:#FF4757;font-weight:700;">انتهى الوقت!</span>';
                return;
            }
            var d = Math.floor(diff / (1000 * 60 * 60 * 24));
            var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            var s = Math.floor((diff % (1000 * 60)) / 1000);
            var totalHours = diff / (1000 * 60 * 60);
            var colorClass = totalHours < 24 ? 'danger' : totalHours < 72 ? 'warning' : 'safe';
            timer.className = 'countdown-timer ' + colorClass;
            timer.innerHTML =
                '<div class="countdown-unit"><span class="count-value">' + String(d).padStart(2, '0') + '</span><span class="count-label">يوم</span></div>' +
                '<div class="countdown-unit"><span class="count-value">' + String(h).padStart(2, '0') + '</span><span class="count-label">ساعة</span></div>' +
                '<div class="countdown-unit"><span class="count-value">' + String(m).padStart(2, '0') + '</span><span class="count-label">دقيقة</span></div>' +
                '<div class="countdown-unit"><span class="count-value">' + String(s).padStart(2, '0') + '</span><span class="count-label">ثانية</span></div>';
        }
        update();
        countdownIntervals.push(setInterval(update, 1000));
    });
}

// ==================== TABS ====================
function updateTabCounts() {
    var pc = document.getElementById('pendingCount');
    if (pc) pc.textContent = allAssignments.pending.length;
    var sc = document.getElementById('submittedCount');
    if (sc) sc.textContent = allAssignments.submitted.length;
    var gc = document.getElementById('gradedCount');
    if (gc) gc.textContent = allAssignments.graded.length;
    var tc = document.getElementById('totalCount');
    if (tc) tc.textContent = allAssignments.pending.length + allAssignments.submitted.length + allAssignments.graded.length;
    var uc = document.getElementById('urgentCount');
    if (uc) uc.textContent = allAssignments.pending.filter(function(a) { return getPriority(a.deadlineDate) === 'high'; }).length;
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
    document.querySelector('[data-tab="' + tab + '"]').classList.add('active');
    document.getElementById(tab + 'Tab').classList.add('active');
}

// ==================== SUBMIT MODAL ====================
function openSubmitModal(assignId, title, deadline) {
    currentAssignmentId = assignId;
    selectedFile = null;
    document.getElementById('modalAssignTitle').textContent = title;
    document.getElementById('modalDeadline').textContent = new Date(deadline).toLocaleString('ar-EG');
    document.getElementById('submitNote').value = '';
    document.getElementById('uploadArea').classList.remove('has-file');
    document.getElementById('fileInfo').classList.remove('visible');
    document.getElementById('uploadText').style.display = 'block';
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('fileInput').value = '';
    document.getElementById('submitModal').classList.add('active');
}

function closeSubmitModal() {
    document.getElementById('submitModal').classList.remove('active');
    currentAssignmentId = null;
    selectedFile = null;
}

// حد حجم الملف للتخزين داخل Firestore كـ Data URL (بدون Firebase Storage)
var MAX_SUBMISSION_FILE_BYTES = 380 * 1024;

function readFileAsDataURL(file) {
    return new Promise(function(resolve, reject) {
        var r = new FileReader();
        r.onload = function() { resolve(r.result); };
        r.onerror = function() { reject(r.error || new Error('read')); };
        r.readAsDataURL(file);
    });
}

async function processFile(file) {
    if (!file) return;
    
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            showToast('❌ يرجى تسجيل الدخول لرفع الملفات', 'error');
            return;
        }

        if (file.size > MAX_SUBMISSION_FILE_BYTES) {
            showToast('❌ الملف أكبر من الحد المسموح (~' + Math.floor(MAX_SUBMISSION_FILE_BYTES / 1024) + ' كيلوبايت). اختر ملفاً أصغر.', 'error');
            return;
        }

        showToast('⏳ جاري تجهيز الملف...', 'info');
        document.getElementById('uploadArea').classList.add('has-file');
        document.getElementById('uploadText').style.display = 'none';
        document.getElementById('fileName').textContent = 'جاري القراءة...';
        document.getElementById('fileSize').textContent = '';
        document.getElementById('fileInfo').classList.add('visible');
        document.getElementById('submitBtn').disabled = true;

        const dataUrl = await readFileAsDataURL(file);
        if (String(dataUrl).length > 1000000) {
            throw new Error('الملف كبير جداً بعد الترميز');
        }

        selectedFile = { name: file.name, size: file.size, url: dataUrl, inline: true };
        
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = formatFileSize(file.size) + ' • جاهز للإرسال';
        document.getElementById('submitBtn').disabled = false;
        showToast('✅ تم تجهيز الملف', 'success');

    } catch (error) {
        console.error("Upload error:", error);
        showToast('❌ فشل تجهيز الملف: ' + error.message, 'error');
        removeFile();
    }
}

// ==================== FILE HANDLING ====================


function removeFile() {
    selectedFile = null;
    var fi = document.getElementById('fileInput');
    if (fi) fi.value = '';
    document.getElementById('uploadArea').classList.remove('has-file');
    document.getElementById('uploadText').style.display = 'block';
    document.getElementById('fileInfo').classList.remove('visible');
    document.getElementById('submitBtn').disabled = true;
}

// ==================== SUBMIT (Firestore) ====================
async function submitAssignment() {
    if (!selectedFile || !currentAssignmentId) return;
    const user = firebase.auth().currentUser;
    if (!user) { showToast("❌ يرجى تسجيل الدخول أولاً", "error"); return; }

    var btn = document.getElementById('submitBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        const note = document.getElementById('submitNote').value;
        const studentName = (window.currentUser && window.currentUser.name) || user.email;
        const studentAvatar = (window.currentUser && window.currentUser.profilePic) || `https://ui-avatars.com/api/?name=${studentName}&background=random`;

        await db.collection("submissions").add({
            assignmentId: currentAssignmentId,
            studentId: user.uid,
            studentName: studentName,
            studentAvatar: studentAvatar,
            fileName: selectedFile.name,
            fileUrl: selectedFile.url,
            inlineUpload: true,
            fileSize: formatFileSize(selectedFile.size),
            note: note,
            submittedAt: firebase.firestore.Timestamp.now()
        });

        closeSubmitModal();
        showToast('تم تسليم الواجب بنجاح! 🎉', 'success');
        await refreshData();
    } catch (error) {
        console.error("Error submitting assignment:", error);
        showToast("❌ فشل تسليم الواجب. حاول مرة أخرى.", "error");
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ==================== VIEW DETAILS ====================
function viewDetails(id) {
    for (var i = 0; i < allAssignments.pending.length; i++) {
        if (allAssignments.pending[i].id === id && allAssignments.pending[i].description) {
            showToast(allAssignments.pending[i].description, 'success');
            return;
        }
    }
}

// ==================== TOAST ====================
function showToast(message, type) {
    type = type || 'success';
    var toast = document.getElementById('toast');
    toast.className = 'toast-notification ' + type;
    document.getElementById('toastIcon').className = 'fas ' + (type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle');
    document.getElementById('toastText').textContent = message;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 4000);
}

// ==================== DOCTOR ACTIONS ====================
window.openAddAssignmentModal = function() {
    if (typeof Swal === 'undefined') {
        alert('Swal is not loaded');
        return;
    }
    Swal.fire({
        title: 'إضافة تكليف جديد',
        html: `
            <input id="swal-title" class="swal2-input" placeholder="عنوان الواجب">
            <input id="swal-course" class="swal2-input" placeholder="اسم المادة">
            <input id="swal-deadline" type="date" class="swal2-input">
        `,
        confirmButtonText: '<i class="fas fa-save"></i> إضافة الواجب',
        showCancelButton: true,
        cancelButtonText: 'إلغاء',
        customClass: { confirmButton: 'btn-premium btn-primary', cancelButton: 'btn-premium btn-ghost' },
        preConfirm: () => {
            const title = document.getElementById('swal-title').value.trim();
            const course = document.getElementById('swal-course').value.trim();
            const deadline = document.getElementById('swal-deadline').value;
            if (!title || !course || !deadline) { Swal.showValidationMessage('يرجى ملء جميع الحقول'); return false; }
            return { title, course, deadline };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'جاري الإضافة...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
            try {
                await db.collection('assignments').add({
                    title: result.value.title,
                    courseName: result.value.course,
                    deadline: result.value.deadline,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'pending', isUrgent: false,
                    doctorEmail: (firebase.auth().currentUser || {}).email
                });
                Swal.fire('تم الإضافة!', 'تم إرسال التكليف للطلاب بنجاح.', 'success');
                if (typeof refreshData === 'function') refreshData();
            } catch (e) {
                Swal.fire('خطأ', 'فشل إضافة الواجب: ' + e.message, 'error');
            }
        }
    });
}

