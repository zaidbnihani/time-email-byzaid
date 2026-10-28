# ملف تعريف المشروع | Project Profile

## العربية

### الغرض
هذا المستودع يضم تطبيق ويب عربيًا لإنشاء عنوان بريد إلكتروني مؤقت والتعامل مع صندوق وارد مرتبط به، مع قراءة الرسائل واستخراج رموز التحقق (OTP) وأرقام وروابط التفعيل المحتملة. الأدلة: وصف ومزايا الخدمة في [README.md](README.md) و[PRD.MD](PRD.MD)، الواجهة والخيارات في [index.html](index.html)، ومنطق التطبيق في [js/app.js](js/app.js) و[js/otp-parser.js](js/otp-parser.js). لا يعني هذا التوثيق ضمان الخصوصية أو مدة احتفاظ مزود البريد.

### المكوّنات والتدفق الأساسي
- [index.html](index.html) هو مدخل الواجهة العربية RTL، ويعرض إنشاء البريد ومدة الصلاحية وصندوق الرسائل وتفاصيل الرسالة؛ يحمل أيضًا [manifest.json](manifest.json) وملف التنسيق.
- [js/app.js](js/app.js) يهيئ الواجهة، يستعيد جلسة صالحة من `localStorage` أو ينشئ حسابًا جديدًا، ويستطلع صندوق الوارد كل 3 ثوانٍ، ويعرض الرسائل والتفاصيل ويدير المؤقت والنسخ والحذف.
- [js/mailtm-api.js](js/mailtm-api.js) عميل المتصفح لخدمة `https://api.mail.tm`: يجلب النطاقات، ينشئ الحساب ويصادق للحصول على token، ويجلب الرسائل وتفاصيلها، ويحذف الرسائل أو الحساب.
- [js/otp-parser.js](js/otp-parser.js) يستخرج رمزًا مرشحًا وأرقامًا وروابط تفعيل من محتوى الرسالة.
- [css/styles.css](css/styles.css) تنسيقات الواجهة. يعتمد HTML أيضًا على خطوط Google Fonts وFont Awesome وcanvas-confetti عبر CDN؛ راجع [index.html](index.html).

### شجرة مختصرة
```text
.
├── README.md                 وصف ومزايا موجزة (عربي)
├── PRD.MD                    وصف/متطلبات المنتج ومزاياه
├── index.html                مدخل الواجهة وربط الموارد
├── css/styles.css            التنسيقات
├── js/app.js                 حالة التطبيق والتفاعل وصندوق الوارد
├── js/mailtm-api.js          عميل Mail.tm
├── js/otp-parser.js          استخراج OTP والأرقام والروابط
├── js/firebase-config.js     مشار إليه من HTML؛ لم يُفحص لتجنب بيانات الاعتماد
├── server.js                 خادم Express للملفات الثابتة
├── package.json              بيانات الحزمة وأوامر npm
├── firebase.json             إعداد Firebase Hosting
├── manifest.json             بيانات تطبيق الويب التدريجي (PWA)
├── metadata.json             بيانات تعريف للمشروع وقدراته المعلنة
├── robots.txt, sitemap.xml   ملفات زاحف وفهرسة
└── og-image.png              صورة مشاركة/معاينة
```

### الملفات المحورية والتقنية
- JavaScript بوحدات ES في Node (`"type": "module"`) مع Express `^4.19.2`؛ اسم الحزمة `email-time-byzaid` وإصدارها `1.0.0` وفق [package.json](package.json). لا يثبت manifest متطلبات إصدار Node.
- تطبيق المتصفح مكتوب بـ HTML/CSS/JavaScript، ويستخدم واجهة Mail.tm مباشرةً من العميل، كما يظهر في [js/mailtm-api.js](js/mailtm-api.js). يتضمن [js/app.js](js/app.js) مددًا محددة من ساعة إلى 7 أيام، وتُخزن الجلسة محليًا بمفتاح `tempmail_pro_session`.
- [server.js](server.js) يقدم مجلد المشروع كملفات ثابتة، يعيد `index.html` للمسارات الأخرى، ويستمع على المنفذ الثابت `3000`.
- [firebase.json](firebase.json) يضبط Firebase Hosting على جذر المشروع (`public: "."`) مع قواعد تجاهل وترويسات وإعادة كتابة إلى `/index.html`.
- [manifest.json](manifest.json) يعلن اسم TempMail، اللغة العربية والاتجاه RTL وعرض standalone. يعتمد [index.html](index.html) على موارد خارجية مذكورة أعلاه.

### الإعداد والتشغيل والاختبار والبناء
- التبعيات المعلنة الوحيدة في [package.json](package.json) هي `express`. لا يتضمن المستودع ملف قفل تبعيات ضمن الشجرة المفحوصة.
- أوامر التشغيل المعلنة في [package.json](package.json): `npm run dev` أو `npm start`، وكلاهما يشغّل `node server.js`؛ وفق [server.js](server.js) يكون الاستماع على `0.0.0.0:3000`. يعلن manifest اعتماد `express` دون توثيق خطوات تثبيت مستقلة.
- `npm run build` مجرد رسالة “No build step required”، و`npm run lint` مجرد رسالة “No lint step required” بحسب [package.json](package.json)، وليسا عمليتي بناء أو فحص فعليتين.
- لم يُعثر على نص اختبار أو مجلد اختبارات أو إعداد CI/workflow ضمن الملفات المفحوصة. لذلك لا توجد طريقة اختبار موثقة هنا ولا يُفترض أمر اختبار.
- [firebase.json](firebase.json) يثبت إعداد Hosting فقط؛ لم يُوثق هنا أمر نشر أو إعداد مشروع Firebase. لم تُقرأ [js/firebase-config.js](js/firebase-config.js) لأنها قد تحتوي إعدادات/بيانات اعتماد، مع أن [index.html](index.html) يدرجها.

### نقاط عملية وغير محسومة
- ابدأ بمراجعة [README.md](README.md)، ثم [index.html](index.html) وملفات `js/`؛ استخدم أوامر npm المذكورة فقط عند الحاجة إلى تشغيل خادم محلي.
- البريد والجلسة وبيانات المصادقة المرتبطة بالحساب المؤقت تُدار من جانب المتصفح وفق [js/app.js](js/app.js) و[js/mailtm-api.js](js/mailtm-api.js). ينبغي عدم استخدام بيانات حقيقية أو حساسة دون مراجعة نموذج الخصوصية والتخزين.
- README وPRD موجزان ويصفان المنتج، لكن تفاصيل البنية والاختبارات وإصدارات Node غير محددة. لم يُفحص ملف `js/firebase-config.js`، ولا يمكن الجزم بدوره أو بمحتواه من مجرد إدراجه في HTML.

## English

### Purpose
This repository contains an Arabic web app for creating a temporary email address and using its inbox, including reading messages and extracting candidate one-time passwords (OTPs), numbers, and activation links. Evidence: the service description and feature list in [README.md](README.md) and [PRD.MD](PRD.MD), the UI and options in [index.html](index.html), and application logic in [js/app.js](js/app.js) and [js/otp-parser.js](js/otp-parser.js). This profile does not guarantee privacy or the mail provider's retention behavior.

### Main components and flow
- [index.html](index.html) is the Arabic RTL UI entry point. It presents email creation, expiry choices, the inbox, and message details; it also loads [manifest.json](manifest.json) and the stylesheet.
- [js/app.js](js/app.js) initializes the UI, restores a valid session from `localStorage` or creates an account, polls the inbox every 3 seconds, renders messages and details, and manages the timer, copying, and deletion.
- [js/mailtm-api.js](js/mailtm-api.js) is the browser client for `https://api.mail.tm`: it fetches domains, creates an account and authenticates for a token, fetches messages and details, and deletes messages or an account.
- [js/otp-parser.js](js/otp-parser.js) extracts a candidate code, numbers, and activation links from message content.
- [css/styles.css](css/styles.css) contains UI styles. The HTML also loads Google Fonts, Font Awesome, and canvas-confetti from CDNs; see [index.html](index.html).

### Short tree
```text
.
├── README.md                 Brief description and features (Arabic)
├── PRD.MD                    Product description/requirements and features
├── index.html                UI entry point and resource wiring
├── css/styles.css            Styles
├── js/app.js                 App state, interactions, and inbox
├── js/mailtm-api.js          Mail.tm client
├── js/otp-parser.js          OTP, number, and link extraction
├── js/firebase-config.js     Referenced by HTML; not inspected to avoid credentials
├── server.js                 Express static-file server
├── package.json              Package metadata and npm scripts
├── firebase.json             Firebase Hosting configuration
├── manifest.json             Progressive Web App metadata
├── metadata.json             Project metadata and declared capabilities
├── robots.txt, sitemap.xml   Crawler and indexing files
└── og-image.png              Social preview image
```

### Key files and technology
- JavaScript ES modules in Node (`"type": "module"`) with Express `^4.19.2`; package name `email-time-byzaid`, version `1.0.0`, per [package.json](package.json). The manifest does not specify a Node version.
- The browser app uses HTML/CSS/JavaScript and calls the Mail.tm API directly from the client, as shown in [js/mailtm-api.js](js/mailtm-api.js). [js/app.js](js/app.js) defines expiry presets from one hour through seven days and stores the session under `tempmail_pro_session`.
- [server.js](server.js) serves the project directory as static files, falls back to `index.html` for other paths, and listens on the fixed port `3000`.
- [firebase.json](firebase.json) configures Firebase Hosting with the project root (`public: "."`), ignore rules, headers, and a rewrite to `/index.html`.
- [manifest.json](manifest.json) declares the TempMail name, Arabic language and RTL direction, and standalone display. [index.html](index.html) depends on the external resources listed above.

### Setup, run, test, and build
- The only dependency declared in [package.json](package.json) is `express`. No dependency lockfile appears in the inspected tree.
- Run scripts declared in [package.json](package.json): `npm run dev` or `npm start`, both of which run `node server.js`; according to [server.js](server.js), it listens on `0.0.0.0:3000`. The manifest declares `express` but does not document separate installation steps.
- `npm run build` only prints “No build step required,” and `npm run lint` only prints “No lint step required,” per [package.json](package.json); neither performs an actual build or lint.
- No test instructions, test directory, or CI/workflow configuration were found among the inspected files. Thus no test command is documented here and none is inferred.
- [firebase.json](firebase.json) establishes Hosting configuration only; no deployment command or Firebase project setup is documented here. [js/firebase-config.js](js/firebase-config.js) was not read because it may contain configuration/credentials, although [index.html](index.html) includes it.

### Practical notes and open questions
- Start by reviewing [README.md](README.md), then [index.html](index.html) and the `js/` files; use only the npm scripts listed above if a local server is needed.
- The temporary email, session, and associated account authentication data are managed in the browser according to [js/app.js](js/app.js) and [js/mailtm-api.js](js/mailtm-api.js). Avoid real or sensitive data unless the privacy and storage model has been reviewed.
- README and PRD are brief product descriptions; implementation details, tests, and the Node version are unspecified. `js/firebase-config.js` was not inspected, so its role or contents cannot be established from its inclusion in HTML alone.
