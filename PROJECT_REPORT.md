# تقرير المشروع — University Portal (بوابة جامعية)

**اسم الحزمة:** `web_project`  
**الإصدار:** 1.0.0  
**تاريخ إعداد التقرير:** 2026-05-14  
**الحالة:** نسخة التسليم النهائية (1.0.0) — قواعد Firestore مفصّلة لكل مجموعة، وفهرسة `firestore.indexes.json`، و`README.md` للتشغيل والنشر.  

---

## 1. ملخص تنفيذي

المشروع عبارة عن **بوابة جامعية ويب** متعددة الصفحات (ليست Single Page Application بالمعنى الصارم)، موجهة للطلاب وللمسؤولين عن المنصة. تعتمد الواجهة على **HTML/CSS/JavaScript** مع **Firebase** (Authentication، Cloud Firestore، Storage) لحفظ المستخدمين والمحتوى الأكاديمي. يتم **بناء الموقع** باستخدام **Vite** ونشر **الاستضافة** عبر **Firebase Hosting** من مجلد `dist`.

---

## 2. أهداف المنتج (Functional Scope)

| المجال | الوصف |
|--------|--------|
| الهوية والدخول | تسجيل الدخول والتسجيل بالبريد وكلمة المرور، ودعم Google، مع توثيق الجلسة وحماية الصفحات عبر `auth-guard.js`. |
| لوحة الطالب | لوحة تحكم، مواد دراسية، واجبات، درجات، جدول، مصروفات، ملف شخصي. |
| الإدارة | صفحة `admin.html` مع `admin.js` لإحصائيات وتسليمات بانتظار التصحيح (مرتبطة بمجموعات Firestore). |
| المحتوى الأكاديمي | كورسات/مقررات (`courses`) ومحاضرات/ملفات (`lectures`) مع رفع إلى Storage. |
| الواجبات | تعريف واجبات (`assignments`) وتسليمات (`submissions`) من الواجهة والسكربتات. |
| تجربة إضافية | شات بوت (`chatbot.js`) يقرأ بيانات المستخدم من Firestore لمساعدة الطالب. |
| توثيق الفريق | صفحة `team_guide.html` تشرح أدوار الأعضاء ومفهوم الكورس في المنصة. |

---

## 3. التقنيات المستخدمة (Tech Stack)

| الطبقة | التقنية |
|--------|---------|
| الواجهة | HTML5، CSS3 (متغيرات في `global.css`)، خطوط وأيقونات (Font Awesome، CDN). |
| المنطق | JavaScript (نمط IIFE/أحداث DOM)، **Firebase JS SDK 10.12 compat** من `gstatic.com`. |
| البناء | **Vite 8** (`vite.config.mjs`) — مدخل متعدد الصفحات + نسخ أصول JS/CSS إلى `dist`. |
| الخلفية كخدمة | **Firebase**: Auth، Firestore، Storage؛ إعداد المشروع في `firebase.json`. |
| أدوات التطوير | `firebase-tools` للنشر؛ سكربتات تشغيل محلية `Start-Portal.cmd` / `تشغيل-البوابة.cmd`. |

**ملاحظة:** حزمة `firebase` في `package.json` موجودة كاعتماد npm؛ الواجهات الحالية تعتمد بشكل أساسي على **تحميل SDK من CDN** داخل صفحات HTML.

---

## 4. هيكل المشروع (مصدر التطوير)

ملفات الجذر ذات الصلة (باستثناء `node_modules` و`dist`):

**صفحات HTML:** `index.html`, `auth.html`, `dashboard.html`, `student_courses.html`, `assignments.html`, `grades.html`, `schedule.html`, `fees.html`, `profile.html`, `admin.html`, `team_guide.html`

**سكربتات مشتركة / منطق:** `auth.js`, `auth-guard.js`, `data-manager.js`, `router.js`, `chatbot.js`, `admin.js`, `assignments.js`, `grades.js`, `fees.js`

**أنماط:** `global.css`, `chatbot.css` (وأنماط مدمجة داخل بعض الصفحات)

**تهيئة وبناء:** `vite.config.mjs`, `package.json`, `package-lock.json`, `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `.gitignore`, `README.md`

**توثيق الفريق:** `team_guide.html` محدّث ليتوافق مع الكود الفعلي (إدارة المقررات والواجبات عبر `student_courses.html` و`assignments.html` دون صفحات `doctor-*.html` منفصلة).

---

## 5. البناء والتشغيل والنشر

| الأمر | الوظيفة |
|-------|---------|
| `npm run dev` | خادم تطوير Vite (المنفذ الافتراضي 5180 في الإعدادات). |
| `npm run build` | إخراج الإنتاج إلى `dist/`. |
| `npm run preview` | معاينة نسخة الإنتاج محليًا. |
| `npm run deploy` | `vite build` ثم `firebase deploy --only hosting`. |
| `npm run deploy:firestore` | نشر قواعد Firestore والفهارس (`rules` + `indexes`). |
| `npm run deploy:rules` | نشر قواعد Firestore فقط. |
| `npm run deploy:storage` | نشر قواعد Storage فقط. |

الاستضافة على Firebase تخدم المجلد `public: "dist"` مع ترويسات أمان بسيطة (`X-Content-Type-Options`, `Referrer-Policy`) وقاعدة إعادة كتابة عامة نحو `index.html` للمسارات غير المطابقة لملفات ثابتة.

---

## 6. نموذج البيانات في Firestore (حسب استخدام الكود)

المجموعات التي يُشار إليها في السكربتات والصفحات (قد لا تكون كلها مستخدمة في كل شاشة):

- `users` — ملف المستخدم والدور/الاسم/الصورة.
- `courses`, `lectures` — المقررات وملفات المحاضرات (ربط `courseId`).
- `assignments`, `submissions` — الواجبات والتسليمات.
- `grades`, `schedule`, `fees` — مستخدمة من الشات بوت وبعض الشاشات حسب التصميم.
- `student_courses`, `notifications` — مراجع إضافية في `chatbot.js`.

يُنصح بتوحيد أسماء الحقول (مثل `studentId` مقابل `userId`) بين الشاشات والشات بوت لتفادي استعلامات فارغة.

---

## 7. Firebase Storage

`storage.rules` يحدد:

- `lectures/**` — قراءة/كتابة لأي مستخدم مصادَق.
- `submissions/{userId}/**` — الكتابة للمالك فقط (`request.auth.uid == userId`).
- `profiles/{userId}/**` — الكتابة للمالك فقط؛ القراءة لأي مصادَق.

---

## 8. الأمان وصلاحيات الواجهة

- **الواجهة الأمامية:** `auth-guard.js` يوجّه غير المسجلين إلى `auth.html`، ويحدد صلاحيات الأدمن حسب البريد/الاسم وقائمة `ALLOWED_DOCTOR_EMAILS` (منطق مكرر أيضًا في `auth.js` و`admin.js`).
- **Firestore Rules (نسخة التسليم):** القواعد **مفصّلة لكل مجموعة** في `firestore.rules`: مستند `users/{uid}` يُكتب فقط من صاحب الحساب؛ إنشاء `submissions` يتطلب `studentId == request.auth.uid`؛ باقي المجموعات المستخدمة في الكود (`courses`, `lectures`, `assignments`, …) تسمح بالقراءة/الكتابة للمستخدمين المصادَقين لضمان عمل الواجهات والمدير. تحديث درجات التسليمات ما زال مسموحاً لأي مصادَق (لأن دور المدير يُفرَض في الواجهة) — للإنتاج يُفضّل **Custom Claims** على Firebase Auth.

---

## 9. الاختبارات وجودة البرمجيات

- سكربت `npm test` حاليًا placeholder (لا اختبارات آلية).
- لا يوجد ESLint/Prettier مضبوط في الحزمة لهذا المشروع.

**توصية:** إضافة اختبارات وحدات أو على الأقل فحص يدوي مسجل (checklist) قبل كل نشر، وتشديد قواعد Firestore.

---

## 10. المخاطر والقيود

1. **تحديث تسليمات الآخرين** — قاعدة `submissions` تسمح بـ `update` لأي مستخدم مصادَق حتى يستطيع المدير رصد الدرجة من `admin.js`؛ مستخدم متمرس قد يعدّل وثائق إن عرف المعرّفات (يُحل بـ Custom Claims أو Cloud Functions).
2. **مفتاح Firebase في الواجهة** — طبيعي لعميل الويب؛ الحماية تعتمد على القواعد والمصادقة.
3. **تعدد صفحات + سكربتات عامة** — البناء قد يظهر تحذيرات Vite حول سكربتات غير `type="module"` (متوقع مع الهيكل الحالي).
4. ~~**ملفات doctor-***~~ — تم توحيد التوثيق مع الكود في `team_guide.html`.

---

## 11. الخلاصة

المشروع يحقق **بوابة تعليمية متكاملة الواجهات** مع خلفية Firebase حقيقية، وبناء إنتاجي عبر Vite، ومناسب للتسليم الأكاديمي. تم في النسخة النهائية **تشديد قواعد Firestore** على مستوى المجموعات الأساسية و**مزامنة دليل الفريق** مع الملفات الفعلية وإضافة **README** و**فهارس Firestore** للاستعلامات المركّبة.

---

*نهاية التقرير.*
