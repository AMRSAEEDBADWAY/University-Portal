// auth-guard.js — نظام الحماية والصلاحيات
// الأدمن الوحيد هو: amrsaeedbadwey@gmail.com (ويمكن إضافة المزيد هنا)
const ALLOWED_DOCTOR_EMAILS = [
    'amrsaeedbadwey@gmail.com'
];

(function() {
    const isVerified = sessionStorage.getItem('authVerified') === 'true';

    const overlay = document.createElement('div');
    overlay.id = 'auth-loading-overlay';

    if (isVerified) {
        overlay.style.display = 'none';
    } else {
        overlay.style.cssText = 'position:fixed;inset:0;background:#06060f;z-index:99999;display:flex;align-items:center;justify-content:center;transition:opacity 0.4s;';
        overlay.innerHTML = '<div style="text-align:center;"><div style="width:50px;height:50px;border:4px solid rgba(108,92,231,0.2);border-top-color:#6C5CE7;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 20px;"></div><p style="color:#8B8BA7;font-family:Tajawal;">جاري التحقق من الهوية...</p></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
    }
    document.body.prepend(overlay);

    const checkFirebase = setInterval(function() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            clearInterval(checkFirebase);
            initGuard();
        }
    }, 100);

    function initGuard() {
        firebase.auth().onAuthStateChanged(async function(user) {
            if (!user) {
                const path = window.location.pathname;
                if (!path.includes('auth.html') && !path.includes('index.html')) {
                    window.location.href = 'auth.html';
                }
                return;
            }

            try {
                const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
                let userData = { name: user.displayName || user.email.split('@')[0], email: user.email };

                if (userDoc.exists) {
                    userData = { ...userData, ...userDoc.data() };
                } else {
                    // Auto-create user doc if doesn't exist
                    await firebase.firestore().collection("users").doc(user.uid).set({
                        uid: user.uid,
                        name: user.displayName || user.email.split('@')[0],
                        email: user.email,
                        role: 'student',
                        createdAt: new Date().toISOString()
                    });
                }

                // Determine if admin by email
                const userEmail = (user.email || '').toLowerCase();
                const userName = (userData.name || '').toLowerCase();
                const isAdmin = userEmail.includes('amrsaeed') || userName.includes('amr saeed') || ALLOWED_DOCTOR_EMAILS.some(email => email.toLowerCase().trim() === userEmail.trim());
                const currentPath = window.location.pathname.toLowerCase();
                
                if (!isAdmin && currentPath.includes('doctor-')) {
                    window.location.href = 'dashboard.html';
                    return;
                }

                if (!isAdmin && currentPath.includes('admin.html')) {
                    window.location.href = 'dashboard.html';
                    return;
                }

                window.currentUser = { uid: user.uid, email: user.email, isAdmin, ...userData };
                window.isAdmin = isAdmin;
                sessionStorage.setItem('authVerified', 'true');
                sessionStorage.setItem('userData', JSON.stringify(window.currentUser));

                // Update UI elements
                const path = window.location.pathname.toLowerCase();

                document.querySelectorAll('.user-name').forEach(el => el.textContent = userData.name || user.email);
                document.querySelectorAll('.user-role').forEach(el => el.textContent = isAdmin ? '⚙️ مدير المنصة' : 'طالب');
                if (userData.profilePic) {
                    document.querySelectorAll('.user-img').forEach(el => el.src = userData.profilePic);
                }

                // --- SIDEBAR UPDATE (Aggressive Attempt) ---
                const updateSidebarUI = () => {
                    const sidebars = document.querySelectorAll('.sidebar-menu, nav.sidebar-menu, .sidebar nav');
                    sidebars.forEach(sidebarMenu => {
                        // Update active state of existing links
                        const links = sidebarMenu.querySelectorAll('.menu-link');
                        links.forEach(link => {
                            const href = link.getAttribute('href');
                            if (href && path.includes(href.split('.')[0])) {
                                link.classList.add('active');
                            } else {
                                link.classList.remove('active');
                            }
                        });


                    });
                };

                updateSidebarUI();
                setTimeout(updateSidebarUI, 500);
                setTimeout(updateSidebarUI, 2000);


                // Show/hide admin-only elements on the page
                document.querySelectorAll('[data-admin-only], .admin-only-section').forEach(el => {
                    el.style.display = isAdmin ? (el.tagName === 'DIV' ? 'flex' : 'inline-flex') : 'none';
                });

            } catch (error) {
                console.error("Auth guard error:", error);
            }

            // Remove loading overlay
            const loadingOverlay = document.getElementById('auth-loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => loadingOverlay.remove(), 500);
            }
        });

        // Logout handler
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                sessionStorage.removeItem('authVerified');
                sessionStorage.removeItem('userData');
                firebase.auth().signOut().then(() => { window.location.href = 'auth.html'; });
            });
        }
    }
})();
