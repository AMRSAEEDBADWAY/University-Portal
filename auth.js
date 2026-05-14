/**
 * auth.js — University Portal | Auth System (Simplified)
 * No role selection — just Login/Register for everyone
 * Admin is identified by email: amrsaeedbadwey@gmail.com
 */

const ALLOWED_DOCTOR_EMAILS = ['amrsaeedbadwey@gmail.com'];
var currentFirebaseUser = null;
var db = null;
var auth = null;

window.addEventListener('DOMContentLoaded', function () {
    var checkFirebase = setInterval(function () {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
            clearInterval(checkFirebase);
            auth = firebase.auth();
            db = firebase.firestore();
            startAuthListeners();
        }
    }, 100);
});

function startAuthListeners() {
    auth.onAuthStateChanged(function (user) {
        if (user) {
            setTimeout(function () {
                window.location.href = 'dashboard.html';
            }, 500);
        }
    });
}

/* ═══════════════════════════════════════════════════════════ */
/*  Tab Switching                                             */
/* ═══════════════════════════════════════════════════════════ */
window.switchTab = function (tab) {
    document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
    document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
    document.getElementById('tabDoctor').classList.toggle('active', tab === 'doctor');
    document.getElementById('panelLogin').classList.toggle('active', tab === 'login');
    document.getElementById('panelRegister').classList.toggle('active', tab === 'register');
    document.getElementById('panelDoctor').classList.toggle('active', tab === 'doctor');
};

/* ═══════════════════════════════════════════════════════════ */
/*  REGISTER — Email & Password                               */
/* ═══════════════════════════════════════════════════════════ */
window.handleRegister = function () {
    var name = document.getElementById('regName').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var password = document.getElementById('regPassword').value;

    if (!name) return showMsg('registerMsg', 'error', '❌ أدخل اسمك الكامل');
    if (!email || !email.includes('@')) return showMsg('registerMsg', 'error', '❌ أدخل بريد إلكتروني صحيح');
    if (password.length < 8) return showMsg('registerMsg', 'error', '❌ كلمة السر أقل من 8 حروف');

    setLoading('btnRegister', true);

    auth.createUserWithEmailAndPassword(email, password)
        .then(function (userCredential) {
            var user = userCredential.user;
            currentFirebaseUser = user;

            return db.collection("users").doc(user.uid).set({
                uid: user.uid,
                name: name,
                email: email,
                role: 'student',
                createdAt: new Date().toISOString(),
                onboarded: true
            });
        })
        .then(function () {
            showMsg('registerMsg', 'success', '✅ تم إنشاء الحساب بنجاح!');
            setLoading('btnRegister', false);
            setTimeout(function () { window.location.href = 'dashboard.html'; }, 1000);
        })
        .catch(function (error) {
            setLoading('btnRegister', false);
            if (error.code === 'auth/email-already-in-use') {
                showMsg('registerMsg', 'error', '❌ الإيميل مسجل بالفعل');
            } else {
                showMsg('registerMsg', 'error', '❌ حدث خطأ: ' + error.message);
            }
        });
};

/* ═══════════════════════════════════════════════════════════ */
/*  LOGIN — Email & Password                                  */
/* ═══════════════════════════════════════════════════════════ */
window.handleLogin = function () {
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;

    if (!email) return showMsg('loginMsg', 'error', '❌ أدخل البريد الإلكتروني');
    if (!password) return showMsg('loginMsg', 'error', '❌ أدخل كلمة السر');

    setLoading('btnLogin', true);

    auth.signInWithEmailAndPassword(email, password)
        .then(function (userCredential) {
            currentFirebaseUser = userCredential.user;
            showMsg('loginMsg', 'success', ALLOWED_DOCTOR_EMAILS.includes(email.toLowerCase()) ? '✅ أهلاً بك يا دكتور!' : '✅ أهلاً بيك! جاري التوجيه...');
            setLoading('btnLogin', false);
            setTimeout(function () { window.location.href = 'dashboard.html'; }, 700);
        })
        .catch(function (error) {
            setLoading('btnLogin', false);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                showMsg('loginMsg', 'error', '❌ البريد الإلكتروني أو كلمة السر خطأ');
            } else {
                showMsg('loginMsg', 'error', '❌ حدث خطأ: ' + error.message);
            }
        });
};

/* ═══════════════════════════════════════════════════════════ */
/*  GOOGLE LOGIN                                              */
/* ═══════════════════════════════════════════════════════════ */
window.handleGoogleLogin = function () {
    if (window.location.protocol === 'file:') {
        showMsg('loginMsg', 'error', '❌ تسجيل جوجل يتطلب سيرفر محلي — شغّل npm run dev');
        return;
    }

    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    setLoading('btnGoogleLogin', true);

    auth.signInWithPopup(provider)
        .then(function (result) {
            currentFirebaseUser = result.user;
            return db.collection("users").doc(currentFirebaseUser.uid).get();
        })
        .then(function (doc) {
            setLoading('btnGoogleLogin', false);

            if (!doc || !doc.exists) {
                // Create profile for new Google user
                return db.collection("users").doc(currentFirebaseUser.uid).set({
                    uid: currentFirebaseUser.uid,
                    name: currentFirebaseUser.displayName || currentFirebaseUser.email.split('@')[0],
                    email: currentFirebaseUser.email,
                    role: 'student',
                    profilePic: currentFirebaseUser.photoURL || '',
                    createdAt: new Date().toISOString(),
                    onboarded: true
                }).then(function () {
                    window.location.href = 'dashboard.html';
                });
            }

            showMsg('loginMsg', 'success', '✅ أهلاً بيك!');
            setTimeout(function () { window.location.href = 'dashboard.html'; }, 700);
        })
        .catch(function (error) {
            setLoading('btnGoogleLogin', false);
            if (error.code === 'auth/popup-closed-by-user') {
                showMsg('loginMsg', 'info', 'ℹ️ تم إغلاق نافذة تسجيل جوجل');
            } else {
                showMsg('loginMsg', 'error', '❌ خطأ: ' + error.message);
            }
        });
};

/* ═══════════════════════════════════════════════════════════ */
/*  DOCTOR LOGIN — Google Restricted                          */
/* ═══════════════════════════════════════════════════════════ */
window.handleDoctorGoogleLogin = function () {
    if (window.location.protocol === 'file:') {
        showMsg('doctorMsg', 'error', '❌ تسجيل جوجل يتطلب سيرفر محلي — شغّل npm run dev');
        return;
    }

    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    setLoading('btnDoctorGoogleLogin', true);

    const ALLOWED_DOCTOR_EMAILS = [
        'amrsaeedbadwey@gmail.com'
    ]; // ضيف هنا إيميلات الدكاترة المسموح ليهم الدخول

    auth.signInWithPopup(provider)
        .then(function (result) {
            var user = result.user;
            var email = (user.email || '').toLowerCase();
            
            if (!ALLOWED_DOCTOR_EMAILS.includes(email)) {
                // Not allowed -> sign out immediately
                auth.signOut();
                throw new Error("NOT_AUTHORIZED_DOCTOR");
            }
            
            currentFirebaseUser = user;
            return db.collection("users").doc(user.uid).get();
        })
        .then(function (doc) {
            if (!doc) return; // Means error was thrown
            setLoading('btnDoctorGoogleLogin', false);

            if (!doc.exists) {
                // Create admin/doctor profile
                return db.collection("users").doc(currentFirebaseUser.uid).set({
                    uid: currentFirebaseUser.uid,
                    name: currentFirebaseUser.displayName || currentFirebaseUser.email.split('@')[0],
                    email: currentFirebaseUser.email,
                    role: 'admin',
                    profilePic: currentFirebaseUser.photoURL || '',
                    createdAt: new Date().toISOString(),
                    onboarded: true
                }).then(function () {
                    window.location.href = 'dashboard.html';
                });
            }

            showMsg('doctorMsg', 'success', '✅ أهلاً بك يا دكتور!');
            setTimeout(function () { window.location.href = 'dashboard.html'; }, 700);
        })
        .catch(function (error) {
            setLoading('btnDoctorGoogleLogin', false);
            if (error.message === "NOT_AUTHORIZED_DOCTOR") {
                showMsg('doctorMsg', 'error', '❌ عذراً، هذا الحساب غير مصرح له بالدخول كدكتور.');
            } else if (error.code === 'auth/popup-closed-by-user') {
                showMsg('doctorMsg', 'info', 'ℹ️ تم الإلغاء');
            } else {
                showMsg('doctorMsg', 'error', '❌ خطأ: ' + error.message);
            }
        });
};

/* ═══════════════════════════════════════════════════════════ */
/*  HELPERS                                                   */
/* ═══════════════════════════════════════════════════════════ */
function showMsg(elId, type, text) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.textContent = text;
    el.className = 'msg-box show ' + type;
}

function setLoading(btnId, loading) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.toggle('loading', loading);
    btn.disabled = loading;
}
