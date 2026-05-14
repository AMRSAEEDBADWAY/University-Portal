const ALLOWED_DOCTOR_EMAILS = ['amrsaeedbadwey@gmail.com'];
let db;
const MAX_INLINE_FILE_BYTES = 10 * 1024 * 1024;
let courses = [];

const defaultCourses = [
    {name:"تنقيب عن بيانات",description:"تحت إشراف د. عبير.",icon:"🤖",credits:3,color:"linear-gradient(135deg,#6C5CE7,#A29BFE)"},
    {name:"تصميم الخوارزميات",description:"تحت إشراف د. علاء.",icon:"📊",credits:3,color:"linear-gradient(135deg,#e74c3c,#ff7675)"},
    {name:"تطوير تطبيقات الانترنت",description:"تحت إشراف د. شريف.",icon:"💻",credits:3,color:"linear-gradient(135deg,#3498db,#74b9ff)"},
    {name:"حوسبة سحابية",description:"تحت إشراف د. شريف.",icon:"☁️",credits:3,color:"linear-gradient(135deg,#f39c12,#f1c40f)"},
    {name:"انترنت الاشياء",description:"تحت إشراف د. عبد السلام.",icon:"📡",credits:2,color:"linear-gradient(135deg,#95a5a6,#bdc3c7)"},
    {name:"لغة انجليزية تخصصية",description:"تحت إشراف د. صابرين.",icon:"📖",credits:2,color:"linear-gradient(135deg,#2ecc71,#55efc4)"}
];

window.addEventListener('DOMContentLoaded', () => {
    const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            clearInterval(checkFirebase);
            db = firebase.firestore();
            initApp();
        }
    }, 100);
});

async function initApp() {
    const grid = document.getElementById('coursesGrid');
    if(grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--primary-light);"></i><p style="margin-top:16px;color:var(--text-300);">جاري تحميل المواد الدراسية...</p></div>';

    firebase.auth().onAuthStateChanged(async (authUser) => {
        if (!authUser) return;
        await ensureDefaultCourses();
        db.collection('courses').onSnapshot(snap => {
            const seen = new Set();
            courses = [];
            snap.docs.forEach(doc => {
                const name = (doc.data().name || '').trim();
                if (name && !seen.has(name)) {
                    seen.add(name);
                    courses.push({ id: doc.id, ...doc.data() });
                }
            });
            render();
        });
    });
}

async function ensureDefaultCourses() {
    try {
        const snap = await db.collection('courses').get();
        const existingNames = new Set(snap.docs.map(d => (d.data().name || '').trim()));
        const batch = db.batch();
        let needsWrite = false;
        for (const dc of defaultCourses) {
            if (!existingNames.has(dc.name.trim())) {
                const ref = db.collection('courses').doc();
                batch.set(ref, { ...dc, enrolledCount: 0, lecturesCount: 0 });
                needsWrite = true;
            }
        }
        if (needsWrite) await batch.commit();
    } catch(e) { console.warn('ensureDefaultCourses:', e.message); }
}

function render(f=''){
    const g=document.getElementById('coursesGrid');
    if(!g) return;
    const filtered = courses.filter(c => (c.name || '').includes(f));
    if (filtered.length === 0 && courses.length > 0) {
        g.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:var(--text-muted);">لا توجد مواد تطابق البحث.</div>`;
        return;
    }
    g.innerHTML = filtered.map(c => {
        const name = c.name || 'بدون اسم';
        const desc = (c.description || c.desc || 'لا يوجد وصف').replace(/<[^>]*>/g, '').substring(0, 65);
        const color = c.color || 'linear-gradient(135deg, #1a1a3e, #0d0d20)';
        const icon = c.icon || '📚';
        const hours = c.credits || c.hours || 0;
        const files = c.lecturesCount || 0;
        return `
            <div class="course-card" onclick="openM('${c.id}')">
                <div class="course-arrow"><i class="fas fa-arrow-left"></i></div>
                <div class="course-banner" style="background:${color};">${icon}</div>
                <div class="course-body">
                    <h3>${name}</h3>
                    <p>${desc}...</p>
                    <div class="course-meta">
                        <span><i class="fas fa-clock"></i> ${hours} ساعات</span>
                        <span class="course-badge"><i class="fas fa-file" style="font-size:0.65rem;"></i> ${files} ملف</span>
                    </div>
                    <p style="font-size:0.72rem;color:var(--text-400);margin-top:10px;margin-bottom:0;line-height:1.4;"><i class="fas fa-info-circle"></i> اضغط لعرض ملفات هذه المادة والرفع الخاص بها</p>
                </div>
            </div>`;
    }).join('');
}

async function openM(id){
    const c = courses.find(x => x.id === id);
    if (!c) return;
    window.currentCourseId = id;
    const icon = document.getElementById('modalIcon');
    if (icon) icon.textContent = c.icon || '📚';
    document.getElementById('modalTitle').textContent = c.name || 'بدون اسم';
    document.getElementById('modalDesc').textContent = (c.description || c.desc || '').replace(/<[^>]*>/g,'');
    document.getElementById('modal').classList.add('active');
    var fin = document.getElementById('courseFileUploadInput');
    if (fin) fin.value = '';
    var prog = document.getElementById('uploadProgress');
    if (prog) { prog.style.display = 'none'; prog.textContent = ''; prog.style.color = ''; }
    await loadCourseFiles(id);
}

async function loadCourseFiles(courseId) {
    const list = document.getElementById('filesList');
    if(!list) return;
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--primary-light);"><i class="fas fa-spinner fa-spin"></i></div>';
    const authUser = firebase.auth().currentUser;
    if (!authUser) {
        list.innerHTML = '<p style="color:var(--text-300);text-align:center;padding:16px;">سجّل الدخول لعرض الملفات والرفع.</p>';
        return;
    }
    const uid = authUser.uid;
    const userEmail = (authUser.email || '').toLowerCase();
    const isAdminUser = !!(window.isAdmin || ALLOWED_DOCTOR_EMAILS.some(e => e.toLowerCase() === userEmail));

    try {
        let snap;
        try { snap = await db.collection('lectures').where('courseId','==',courseId).orderBy('uploadedAt','desc').get(); }
        catch(e) { snap = await db.collection('lectures').where('courseId','==',courseId).get(); }

        const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const staff = all.filter(d => !d.isStudentUpload);
        const studentFiles = all.filter(d => d.isStudentUpload && (isAdminUser || d.uploadedBy === uid));
        const badge = document.getElementById('filesCountBadge');
        if (badge) badge.textContent = all.length + ' ملف';

        function rowHtml(f, fid, canDelete) {
            const isPdf = f.name && f.name.toLowerCase().endsWith('.pdf');
            const stuBadge = f.isStudentUpload ? '<span style="font-size:0.65rem;background:var(--amber-subtle);color:var(--amber);padding:2px 6px;border-radius:6px;margin-right:6px;">طالب</span>' : '<span style="font-size:0.65rem;background:var(--emerald-subtle);color:var(--emerald);padding:2px 6px;border-radius:6px;margin-right:6px;">مقرر</span>';
            const who = f.uploaderName ? '<div style="font-size:0.68rem;color:var(--text-400);">' + escapeHtml(f.uploaderName) + '</div>' : '';
            const delBtn = canDelete ? `<button type="button" onclick="deleteCourseFile('${fid}')" class="btn-premium" style="padding:5px 8px;font-size:0.68rem;background:var(--rose-subtle);color:var(--rose);border:1px solid var(--rose);cursor:pointer;"><i class="fas fa-trash"></i></button>` : '';
            return `
                <div class="file-item">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div class="file-icon" style="background:${isPdf?'var(--rose-subtle)':'var(--cyan-subtle)'};color:${isPdf?'var(--rose)':'var(--cyan)'};"><i class="fas ${isPdf?'fa-file-pdf':'fa-file-alt'}"></i></div>
                        <div style="text-align:right;"><div style="font-size:0.85rem;font-weight:700;">${stuBadge}${escapeHtml(f.name || '')}</div>${who}<div style="font-size:0.72rem;color:var(--text-300);">${formatBytes(f.size)}</div></div>
                    </div>
                    <div style="display:flex;gap:5px;flex-shrink:0;align-items:center;">
                        <a href="${f.url}" target="_blank" rel="noopener" class="btn-premium" style="padding:5px 9px;font-size:0.7rem;background:var(--emerald-subtle);color:var(--emerald);border:1px solid rgba(16,185,129,0.3);text-decoration:none;"><i class="fas fa-external-link-alt"></i></a>
                        <a href="${f.url}" download="${escapeHtml(f.name || 'file')}" class="btn-premium" style="padding:5px 9px;font-size:0.7rem;background:var(--primary-subtle);color:var(--primary-light);border:1px solid var(--border);text-decoration:none;"><i class="fas fa-download"></i></a>
                        ${delBtn}
                    </div>
                </div>`;
        }
        let html = '';
        if (staff.length === 0 && studentFiles.length === 0) {
            list.innerHTML = '<p style="color:var(--text-300);font-size:0.85rem;text-align:center;padding:20px 0;">لا توجد ملفات لهذه المادة بعد.</p>';
            return;
        }
        if (staff.length) {
            html += '<p style="font-size:0.78rem;font-weight:700;color:var(--primary-light);margin:0 0 8px 0;"><i class="fas fa-chalkboard-teacher"></i> ملفات المحاضرة والمقرر</p>';
            staff.forEach(f => { html += rowHtml(f, f.id, isAdminUser); });
        }
        if (studentFiles.length) {
            html += `<p style="font-size:0.78rem;font-weight:700;color:var(--text-200);margin:14px 0 8px 0;"><i class="fas fa-user-graduate"></i> ${isAdminUser ? 'ملفات الطلاب' : 'ملفاتي المرفوعة'}</p>`;
            studentFiles.forEach(f => { html += rowHtml(f, f.id, isAdminUser || f.uploadedBy === uid); });
        }
        list.innerHTML = html;
    } catch(err) { console.error(err); list.innerHTML = '<p style="color:var(--rose);text-align:center;padding:20px;">❌ فشل تحميل الملفات</p>'; }
}

function escapeHtml(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;') : ''; }
function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const k = 1024, sizes = ["B", "KB", "MB", "GB"], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const searchInp = document.getElementById('searchInput');
if(searchInp) searchInp.addEventListener('input', e => render(e.target.value));

window.deleteCourseFile = async function(lectureDocId) {
    if (!lectureDocId || !window.currentCourseId) return;
    const authUser = firebase.auth().currentUser;
    if (!authUser) return;
    const userEmail = (authUser.email || '').toLowerCase();
    const isAdminUser = !!(window.isAdmin || ALLOWED_DOCTOR_EMAILS.some(e => e.toLowerCase() === userEmail));
    try {
        const docRef = db.collection('lectures').doc(lectureDocId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) return;
        const data = docSnap.data();
        if (!isAdminUser && data.uploadedBy !== authUser.uid) { alert('لا يمكنك حذف هذا الملف'); return; }
        if (!confirm('حذف هذا الملف نهائياً؟')) return;
        if (data.url && data.url.startsWith('https://') && typeof firebase.storage === 'function') {
            try { await firebase.storage().refFromURL(data.url).delete(); } catch (e) {}
        }
        await docRef.delete();
        const cRef = db.collection('courses').doc(window.currentCourseId);
        const cSnap = await cRef.get();
        if (cSnap.exists) await cRef.update({ lecturesCount: Math.max(0, (cSnap.data().lecturesCount || 0) - 1) });
        await loadCourseFiles(window.currentCourseId);
    } catch (err) { alert('تعذّر حذف الملف'); }
};

window.handleCourseFileUpload = async function(input) {
    const file = input.files[0];
    if (!file || !window.currentCourseId) return;
    const authUser = firebase.auth().currentUser;
    if (!authUser) { alert('سجّل الدخول أولاً'); return; }
    if (file.size > MAX_INLINE_FILE_BYTES) { alert('الملف كبير جداً (أقصى حد 10 ميجا)'); input.value = ''; return; }
    const userEmail = (authUser.email || '').toLowerCase();
    const isAdminUser = !!(window.isAdmin || ALLOWED_DOCTOR_EMAILS.some(e => e.toLowerCase() === userEmail));
    const prog = document.getElementById('uploadProgress');
    if (prog) { prog.style.display = 'block'; prog.textContent = 'جاري الرفع...'; }
    try {
        const storageRef = firebase.storage().ref(`lectures/${window.currentCourseId}/${Date.now()}_${file.name}`);
        const snapshot = await storageRef.put(file);
        const url = await snapshot.ref.getDownloadURL();
        await db.collection('lectures').add({
            courseId: window.currentCourseId, name: file.name, size: file.size, url: url,
            uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isStudentUpload: !isAdminUser, uploadedBy: isAdminUser ? null : authUser.uid,
            uploaderName: (window.currentUser && window.currentUser.name) || authUser.displayName || authUser.email
        });
        const cRef = db.collection('courses').doc(window.currentCourseId);
        const cSnap = await cRef.get();
        if (cSnap.exists) await cRef.update({ lecturesCount: (cSnap.data().lecturesCount || 0) + 1 });
        input.value = '';
        if (prog) { prog.textContent = 'تم الرفع بنجاح'; setTimeout(() => prog.style.display = 'none', 2000); }
        await loadCourseFiles(window.currentCourseId);
    } catch (err) { if (prog) prog.textContent = 'فشل الرفع'; }
};

window.handleAdminUpload = window.handleCourseFileUpload;

// ================= Admin/Doctor Actions =================
window.deleteCurrentCourse = async function() {
    if (!window.currentCourseId) return;
    if (!confirm('هل أنت متأكد من حذف هذه المادة وجميع ملفاتها؟')) return;
    try {
        const lectSnap = await db.collection('lectures').where('courseId', '==', window.currentCourseId).get();
        const batch = db.batch();
        lectSnap.docs.forEach(doc => batch.delete(doc.ref));
        batch.delete(db.collection('courses').doc(window.currentCourseId));
        await batch.commit();
        document.getElementById('modal').classList.remove('active');
    } catch(err) { alert('فشل الحذف'); }
};

document.addEventListener('DOMContentLoaded', () => {
    const addCourseForm = document.getElementById('addCourseForm');
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('acSubmitBtn');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
            btn.disabled = true;
            try {
                await db.collection('courses').add({
                    name: document.getElementById('acName').value,
                    description: document.getElementById('acDesc').value,
                    credits: parseInt(document.getElementById('acCredits').value) || 3,
                    icon: document.getElementById('acIcon').value || '📚',
                    color: 'linear-gradient(135deg, #1a1a3e, #0d0d20)',
                    enrolledCount: 0, lecturesCount: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                document.getElementById('addCourseModal').classList.remove('active');
                addCourseForm.reset();
            } catch(err) { alert('خطأ في الإضافة'); }
            finally { btn.innerHTML = 'حفظ المادة الدراسية'; btn.disabled = false; }
        });
    }
});

