/**
 * data-manager.js — Global Data Synchronization for University Portal
 * Handles Firestore sync for Stats, Courses, and Profile across all pages.
 */

let db, storage, auth;
let currentUser = null;

window.addEventListener('DOMContentLoaded', () => {
    const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            clearInterval(checkFirebase);
            db = firebase.firestore();
            storage = typeof firebase.storage === "function" ? firebase.storage() : null;
            auth = firebase.auth();

            document.getElementById("logoutBtn")?.addEventListener("click", async () => {
                sessionStorage.removeItem("authVerified");
                sessionStorage.removeItem("userData");
                await auth.signOut();
                window.location.href = "auth.html";
            });

            auth.onAuthStateChanged(user => {
                if (user) {
                    currentUser = user;
                    syncGlobalData();
                }
            });
        }
    }, 100);
});

async function syncGlobalData() {
    const page = window.location.pathname.split('/').pop();

    // 1. Sync Profile Name & Avatar globally
    const userSnap = await db.collection('users').doc(currentUser.uid).get();
    if (userSnap.exists) {
        const data = userSnap.data();
        const nameEls = document.querySelectorAll('.user-name');
        nameEls.forEach(el => el.textContent = data.name || currentUser.displayName || 'مستخدم');
        
        const avatarEls = document.querySelectorAll('.user-img, .top-nav img');
        const pic = data.photoURL || data.profilePic;
        avatarEls.forEach(el => {
            if (pic) el.src = pic;
        });
    }

    // 2. Page Specific Logic
    if (page === 'dashboard.html') {
        syncDashboardStats();
        syncRecentActivity();
    } else if (page === 'grades.html') {
        syncGradesTable();
    } else if (page === 'fees.html') {
        syncFees();
    }
}

async function syncDashboardStats() {
    // Count Courses
    const coursesSnap = await db.collection('courses').get();
    const count = coursesSnap.size;
    const courseStat = document.querySelector('.stat-card .stat-info p');
    if (courseStat) courseStat.textContent = count;

    // Count Total Files across all lectures
    const lecturesSnap = await db.collection('lectures').get();
    const fileCount = lecturesSnap.size;
    // Update "Completed Tasks" or similar with file count for demo
    const taskStat = document.querySelectorAll('.stat-card .stat-info p')[3];
    if (taskStat) taskStat.textContent = fileCount;
}

async function syncRecentActivity() {
    const activityContainer = document.querySelector('.premium-card .activity-item')?.parentElement;
    if (!activityContainer) return;

    const lecturesSnap = await db.collection('lectures').orderBy('uploadedAt', 'desc').limit(4).get();
    if (lecturesSnap.empty) return;

    // Keep the header, clear items
    const header = activityContainer.querySelector('h3');
    activityContainer.innerHTML = '';
    activityContainer.appendChild(header);

    const colors = ['var(--primary)', 'var(--secondary)', 'var(--pink)', 'var(--warning)'];
    let idx = 0;
    // Firestore QuerySnapshot.forEach(callback) passes only the document — no index argument.
    lecturesSnap.forEach((doc) => {
        const f = doc.data();
        const time = f.uploadedAt ? formatTimeAgo(f.uploadedAt.toDate()) : 'الآن';
        const i = idx++;
        const item = `
            <div class="activity-item">
                <div class="activity-dot" style="background:${colors[i % 4]};"></div>
                <div>
                    <p style="font-size:0.9rem;">تم إضافة ملف <strong>${f.name}</strong> في النظام</p>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${time}</span>
                </div>
            </div>
        `;
        activityContainer.insertAdjacentHTML('beforeend', item);
    });
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'منذ ثوانٍ';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return date.toLocaleDateString('ar-EG');
}
