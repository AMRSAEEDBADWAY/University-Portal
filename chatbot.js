/**
 * chatbot.js — Agentix AI | Smart Academic Assistant
 * Connected to Firebase — Reads user data, courses, grades, schedule, fees
 * Powered by Groq API (LLaMA 3.3 70B)
 */

/**
 * لا تضع مفتاح API في الكود المصدري — عرّضه للتسريب.
 * للتجربة محلياً: قبل تحميل chatbot.js أضف
 *   <script>window.GROQ_API_KEY = "your-key";</script>
 * أو استخدم وسيط خادمي يخفي المفتاح.
 */
window.GROQ_API_KEY = "YOUR_GROQ_API_KEY_HERE";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function getGroqApiKey() {
  if (typeof window !== "undefined" && window.GROQ_API_KEY) {
    return String(window.GROQ_API_KEY).trim();
  }
  return "";
}

let conversationHistory = [];
let userContext = null;

/* ═══════════════════════════════════════════════════════════ */
/*  BUILD USER CONTEXT from Firebase                          */
/* ═══════════════════════════════════════════════════════════ */
async function buildUserContext() {
    try {
        if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) return null;

        const user = firebase.auth().currentUser;
        if (!user) return null;

        const db = firebase.firestore();
        const context = { email: user.email, displayName: user.displayName || '' };

        // 1. User Profile
        try {
            const userDoc = await db.collection("users").doc(user.uid).get();
            if (userDoc.exists) {
                context.profile = userDoc.data();
            }
        } catch (e) { console.warn("Chatbot: Could not fetch profile", e.message); }

        // 2. Courses (student_courses or courses collection)
        try {
            const coursesSnap = await db.collection("courses").where("studentId", "==", user.uid).get();
            if (!coursesSnap.empty) {
                context.courses = [];
                coursesSnap.forEach(doc => context.courses.push(doc.data()));
            }
        } catch (e) { /* silent */ }

        // Try alternative collection
        if (!context.courses) {
            try {
                const altSnap = await db.collection("student_courses").where("userId", "==", user.uid).get();
                if (!altSnap.empty) {
                    context.courses = [];
                    altSnap.forEach(doc => context.courses.push(doc.data()));
                }
            } catch (e) { /* silent */ }
        }

        // 3. Grades
        try {
            const gradesSnap = await db.collection("grades").where("studentId", "==", user.uid).get();
            if (!gradesSnap.empty) {
                context.grades = [];
                gradesSnap.forEach(doc => context.grades.push(doc.data()));
            }
        } catch (e) { /* silent */ }

        // 4. Assignments
        try {
            const assignSnap = await db.collection("assignments").where("studentId", "==", user.uid).get();
            if (!assignSnap.empty) {
                context.assignments = [];
                assignSnap.forEach(doc => context.assignments.push(doc.data()));
            }
        } catch (e) { /* silent */ }

        // 5. Schedule
        try {
            const schedSnap = await db.collection("schedule").where("studentId", "==", user.uid).get();
            if (!schedSnap.empty) {
                context.schedule = [];
                schedSnap.forEach(doc => context.schedule.push(doc.data()));
            }
        } catch (e) { /* silent */ }

        // 6. Fees
        try {
            const feesSnap = await db.collection("fees").where("studentId", "==", user.uid).get();
            if (!feesSnap.empty) {
                context.fees = [];
                feesSnap.forEach(doc => context.fees.push(doc.data()));
            }
        } catch (e) { /* silent */ }

        // 7. Notifications
        try {
            const notifSnap = await db.collection("notifications").where("userId", "==", user.uid).orderBy("createdAt", "desc").limit(5).get();
            if (!notifSnap.empty) {
                context.notifications = [];
                notifSnap.forEach(doc => context.notifications.push(doc.data()));
            }
        } catch (e) { /* silent */ }

        return context;
    } catch (err) {
        console.warn("Chatbot: buildUserContext error:", err.message);
        return null;
    }
}

/* ═══════════════════════════════════════════════════════════ */
/*  BUILD SYSTEM PROMPT with user data                        */
/* ═══════════════════════════════════════════════════════════ */
function buildSystemPrompt(ctx) {
    let prompt = `أنت "Agentix AI" — المساعد الأكاديمي الذكي الخاص ببوابة الجامعة الإلكترونية (University Portal).

مهامك الأساسية:
- مساعدة المستخدم في أي سؤال يخص حياته الأكاديمية.
- الإجابة بشكل مختصر وودود باللغة العربية (عامية مصرية مع لمسة احترافية).
- استخدام الإيموجي بشكل خفيف ومناسب.

معلومات عن المنصة:
- الجامعة تستخدم منصة University Portal الإلكترونية.
- المنصة تحتوي على الصفحات التالية:
  • لوحة التحكم (dashboard.html) — إحصائيات عامة وأنشطة حديثة
  • المواد الدراسية (student_courses.html) — تصفح الكورسات المسجلة
  • الواجبات (assignments.html) — رفع وتسليم الواجبات
  • الدرجات (grades.html) — عرض النتائج والمعدل التراكمي GPA (من 4.0)
  • الجدول الدراسي (schedule.html) — المواعيد الأسبوعية
  • المصروفات (fees.html) — نظام الدفع الإلكتروني (4 أقساط × 5000 جنيه)
- التخصصات المتاحة: تكنولوجيا المعلومات (IT)، علوم الحاسب (CS)، هندسة البرمجيات
        المواد الدراسية المتوفرة حالياً:
        1. تنقيب عن بيانات (د. عبير)
        2. تصميم الخوارزميات (د. علاء)
        3. تطوير تطبيقات الانترنت (د. شريف)
        4. حوسبة سحابية (د. شريف)
        5. انترنت الاشياء - IOT (د. عبد السلام)
        6. لغة إنجليزية تخصصية (د. صابرين)
        7. تكنولوجيا معلوماتية (د. عبد السلام)
        
        يمكنك مساعدتي في معرفة مواعيد المحاضرات، تحميل الملفات، أو الإجابة على أسئلة أكاديمية في هذه المواد.
- للدكاترة: إدارة الكورسات، تصحيح الواجبات، الحضور والغياب بنظام QR، رصد الدرجات

قواعد مهمة:
- لا تتجاوز 4 جمل في الرد إلا إذا السؤال يحتاج شرح.
- لو مش عارف إجابة، قول "مش متأكد من المعلومة دي، الأفضل تتواصل مع شئون الطلاب 📞"
- لو حد سألك عن حاجة مش أكاديمية، رد بلطف وارجعه للموضوع الدراسي.
- لو حد سألك عن صفحة معينة، وجّهه للصفحة المناسبة.
- لو حد سألك "مين أنت" أو "بتعمل إيه"، عرّف نفسك بشكل ودود.`;

    // Inject user-specific data
    if (ctx) {
        prompt += `\n\n══════════════════════════════════\nبيانات المستخدم الحالي (سرية — لا تشارك هذه البيانات مع أي حد تاني):\n══════════════════════════════════`;

        if (ctx.profile) {
            const p = ctx.profile;
            prompt += `\n📋 الملف الشخصي:`;
            prompt += `\n  - الاسم: ${p.name || 'غير محدد'}`;
            prompt += `\n  - الإيميل: ${p.email || ctx.email}`;
            prompt += `\n  - الدور: ${p.role === 'doctor' ? 'دكتور/أستاذ' : 'طالب'}`;
            if (p.major) prompt += `\n  - التخصص: ${p.major === 'ai' ? 'الذكاء الاصطناعي' : p.major === 'cs' ? 'علوم الحاسب' : p.major === 'ds' ? 'علم البيانات' : p.major}`;
            if (p.department) prompt += `\n  - القسم: ${p.department}`;
            if (p.specialty) prompt += `\n  - التخصص المختار: ${p.specialty}`;
            if (p.interests && p.interests.length > 0) prompt += `\n  - الاهتمامات: ${p.interests.join(', ')}`;
        }

        if (ctx.courses && ctx.courses.length > 0) {
            prompt += `\n\n📚 المواد المسجلة (${ctx.courses.length} مادة):`;
            ctx.courses.forEach((c, i) => {
                prompt += `\n  ${i + 1}. ${c.name || c.courseName || 'مادة'} ${c.code ? '(' + c.code + ')' : ''} ${c.instructor ? '- د.' + c.instructor : ''}`;
            });
        }

        if (ctx.grades && ctx.grades.length > 0) {
            prompt += `\n\n📊 الدرجات:`;
            ctx.grades.forEach((g, i) => {
                prompt += `\n  ${i + 1}. ${g.courseName || g.course || 'مادة'}: ${g.grade || g.score || 'غير محدد'} ${g.gpa ? '(GPA: ' + g.gpa + ')' : ''}`;
            });
        }

        if (ctx.assignments && ctx.assignments.length > 0) {
            prompt += `\n\n📝 الواجبات:`;
            ctx.assignments.forEach((a, i) => {
                prompt += `\n  ${i + 1}. ${a.title || a.name || 'واجب'} — الحالة: ${a.status || 'غير محدد'} ${a.deadline ? '| الموعد: ' + a.deadline : ''}`;
            });
        }

        if (ctx.schedule && ctx.schedule.length > 0) {
            prompt += `\n\n📅 الجدول:`;
            ctx.schedule.forEach((s, i) => {
                prompt += `\n  ${i + 1}. ${s.day || ''} ${s.time || ''} — ${s.courseName || s.subject || 'محاضرة'} ${s.room ? '(قاعة ' + s.room + ')' : ''}`;
            });
        }

        if (ctx.fees && ctx.fees.length > 0) {
            prompt += `\n\n💰 المصروفات:`;
            ctx.fees.forEach((f, i) => {
                prompt += `\n  ${i + 1}. ${f.description || 'قسط'}: ${f.amount || 'غير محدد'} جنيه — ${f.paid ? '✅ مدفوع' : '❌ غير مدفوع'}`;
            });
        }

        if (ctx.notifications && ctx.notifications.length > 0) {
            prompt += `\n\n🔔 آخر الإشعارات:`;
            ctx.notifications.forEach((n, i) => {
                prompt += `\n  ${i + 1}. ${n.message || 'إشعار'}`;
            });
        }

        if (!ctx.courses && !ctx.grades && !ctx.assignments) {
            prompt += `\n\nℹ️ ملاحظة: لا توجد بيانات أكاديمية مسجلة حالياً لهذا المستخدم في قاعدة البيانات. لو المستخدم سأل عن بياناته، قوله إن البيانات لسه مش متسجلة في النظام وممكن يتواصل مع شئون الطلاب.`;
        }
    } else {
        prompt += `\n\nℹ️ ملاحظة: المستخدم الحالي غير مسجل دخوله أو لم يتم تحميل بياناته بعد.`;
    }

    // Current page context
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const pageNames = {
        'dashboard.html': 'لوحة التحكم',
        'student_courses.html': 'المواد الدراسية',
        'assignments.html': 'الواجبات',
        'grades.html': 'الدرجات',
        'schedule.html': 'الجدول الدراسي',
        'fees.html': 'المصروفات',
        'doctor-courses.html': 'إدارة الكورسات (دكتور)',
        'doctor-assignments.html': 'تصحيح الواجبات (دكتور)',
        'doctor-schedule.html': 'الحضور والغياب (دكتور)',
        'doctor-grades.html': 'رصد الدرجات (دكتور)',
        'auth.html': 'تسجيل الدخول'
    };
    prompt += `\n\n📍 الصفحة الحالية: ${pageNames[page] || page}`;

    return prompt;
}

/* ═══════════════════════════════════════════════════════════ */
/*  CALL GROQ API                                            */
/* ═══════════════════════════════════════════════════════════ */
async function callGroqAPI(userMessage) {
    const GROQ_API_KEY = getGroqApiKey();
    if (!GROQ_API_KEY) {
        return "⚠️ مفتاح Groq غير مُعرّف. اطلب من المطوّر إعداد `window.GROQ_API_KEY` أو وسيط API آمن — لا يُخزَّن المفتاح في المستودع.";
    }

    conversationHistory.push({ role: "user", content: userMessage });

    // Keep last 20 messages to avoid token overflow
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }

    // Build context if not yet loaded
    if (!userContext) {
        userContext = await buildUserContext();
    }

    const systemPrompt = buildSystemPrompt(userContext);

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...conversationHistory
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error("Groq API Error:", response.status, errData);

            if (response.status === 401) {
                return "⚠️ مفتاح الـ API غير صالح. تأكد من إعداد مفتاح Groq الصحيح.";
            }
            if (response.status === 429) {
                return "⏳ تم تجاوز عدد الطلبات. جرب تاني بعد ثواني.";
            }
            return "⚠️ حصل مشكلة في الاتصال بالسيرفر. جرب تاني بعد شوية.";
        }

        const data = await response.json();
        const assistantReply = data.choices[0].message.content;
        conversationHistory.push({ role: "assistant", content: assistantReply });
        return assistantReply;

    } catch (error) {
        console.error("Network Error:", error);
        return "⚠️ مفيش اتصال بالإنترنت دلوقتي. تأكد إنك متصل وجرب تاني.";
    }
}

/* ═══════════════════════════════════════════════════════════ */
/*  CHATBOT UI                                                */
/* ═══════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
    const chatbotHTML = `
        <div class="ai-chatbot-container">
            <div class="chatbot-window" id="chatWindow">
                <div class="chat-header">
                    <div class="chat-header-info">
                        <div class="bot-avatar"><i class="fas fa-robot"></i></div>
                        <div>
                            <div style="font-weight: 800; color: white;">Agentix AI</div>
                            <div style="font-size: 0.75rem; color: var(--success);">مدعوم بالذكاء الاصطناعي 🧠</div>
                        </div>
                    </div>
                    <button class="close-chat" id="closeChatBtn"><i class="fas fa-times"></i></button>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="message msg-bot">أهلاً! أنا Agentix — مساعدك الأكاديمي الذكي 🤖<br>أقدر أساعدك في أي حاجة تخص دراستك ومعلوماتك على المنصة!<br><br>جرب تسألني:<br>• "إيه المواد اللي مسجلها؟"<br>• "إيه درجاتي؟"<br>• "امتى ميعاد المحاضرة الجاية؟"</div>
                </div>
                <div class="chat-input-area">
                    <input type="text" class="chat-input" id="chatInput" placeholder="اكتب سؤالك هنا...">
                    <button class="btn-send" id="btnSendChat"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
            <button class="chatbot-fab" id="chatbotFab">
                <i class="fas fa-comment-dots"></i>
            </button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    const fab = document.getElementById('chatbotFab');
    const chatWindow = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('closeChatBtn');
    const sendBtn = document.getElementById('btnSendChat');
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');

    // Pre-load user context when chat opens
    fab.addEventListener('click', async () => {
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            input.focus();
            // Load user data in background
            if (!userContext) {
                userContext = await buildUserContext();
                if (userContext && userContext.profile) {
                    const name = userContext.profile.name || userContext.displayName || '';
                    if (name) {
                        messages.insertAdjacentHTML('beforeend',
                            `<div class="message msg-bot">أهلاً ${name.split(' ')[0]}! 👋 أنا شايف بياناتك على المنصة. اسألني أي حاجة!</div>`
                        );
                        scroll();
                    }
                }
            }
        }
    });

    closeBtn.addEventListener('click', () => chatWindow.classList.remove('active'));

    const send = async () => {
        const text = input.value.trim();
        if (!text) return;

        // User message
        messages.insertAdjacentHTML('beforeend', `<div class="message msg-user">${escapeHtml(text)}</div>`);
        input.value = '';
        scroll();

        // Typing indicator
        const typingId = 'typing-' + Date.now();
        messages.insertAdjacentHTML('beforeend', `
            <div class="typing-indicator" id="${typingId}">
                <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
            </div>
        `);
        scroll();

        // Call Groq API
        const reply = await callGroqAPI(text);

        // Remove typing & show reply
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        messages.insertAdjacentHTML('beforeend', `<div class="message msg-bot">${formatReply(reply)}</div>`);
        scroll();
    };

    sendBtn.addEventListener('click', send);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') send(); });

    function scroll() { messages.scrollTop = messages.scrollHeight; }
});

/* ═══════════════════════════════════════════════════════════ */
/*  UTILITIES                                                 */
/* ═══════════════════════════════════════════════════════════ */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatReply(text) {
    // Convert markdown-like formatting to HTML
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

/** يستدعيه router.js بعد التنقل — الواجهة تُنشأ مرة عند DOMContentLoaded */
window.initChatbot = function () {};
