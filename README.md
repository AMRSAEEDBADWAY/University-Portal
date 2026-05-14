# University Portal — بوابة جامعية

نسخة **1.0.0** (جاهزة للتسليم الأكاديمي). واجهة ويب متعددة الصفحات مع **Firebase** (Auth + Firestore + Storage) وبناء إنتاجي عبر **Vite**.

## المتطلبات

- [Node.js](https://nodejs.org/) 18 أو أحدث (يُفضّل LTS)
- حساب Firebase مرتبط بالمشروع (للنشر فقط)

## التشغيل المحلي

```bash
npm install
npm run dev
```

يفتح الخادم عادة على المنفذ **5180** (راجع `vite.config.mjs`). على Windows يمكن استخدام `Start-Portal.cmd` أو `تشغيل-البوابة.cmd`.

## بناء نسخة الإنتاج

```bash
npm run build
```

المخرجات في المجلد `dist/`. الاستضافة في `firebase.json` مضبوطة على `dist`.

## النشر (Firebase)

```bash
npm run deploy              # بناء + Hosting فقط
npm run deploy:firestore    # قواعد Firestore + الفهارس (indexes)
npm run deploy:storage      # قواعد Storage
```

بعد أول نشر للفهارس، قد يطلب Firebase إنشاء الفهارس المركّبة تلقائياً من رسائل الخطأ في المتصفح — الملف `firestore.indexes.json` يغطي الاستعلامات المركّبة المعروفة في المشروع.

## ملفات مهمة للتسليم

| الملف | الغرض |
|--------|--------|
| `PROJECT_REPORT.md` | تقرير تقني بالعربية |
| `team_guide.html` | شرح أدوار الفريق ومسار الكورسات (يفتح من المتصفح بعد `npm run dev`) |
| `firestore.rules` | قواعد أمان قاعدة البيانات |
| `storage.rules` | قواعد ملفات التخزين |

## ملاحظات أمان (للمناقشة مع المشرف)

- مستندات **`users/{uid}`**: الكتابة مقتصرة على صاحب الحساب (`uid` نفسه).
- **`submissions`**: الإنشاء يتطلب تطابق `studentId` مع المستخدم الحالي؛ تحديث الدرجات يسمح لأي مصادَق لأن تحديد المدير حالياً في الواجهة فقط — للإنتاج يُنصح بـ Custom Claims.

## الترخيص

ISC (كما في `package.json`).
