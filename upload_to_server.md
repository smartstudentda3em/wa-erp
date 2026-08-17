# دليل رفع وتحديث مشروع WhatsApp ERP على استضافة Hostinger عبر GitHub

بما أن المشروع مربوط بالفعل بـ GitHub، فإن أفضل وأسهل طريقة لرفعه وتحديثه على استضافة مشتركة (Shared Hosting) مثل Hostinger هي استخدام أداة **Git** المتوفرة في لوحة تحكم Hostinger (hPanel)، أو استخدام **SSH** لسحب التحديثات.

فيما يلي الخطوات التفصيلية من البداية وحتى تشغيل المشروع:

---

## 1. التجهيز على جهازك المحلي (Local)

لأن استضافات Shared Hosting غالباً لا تدعم تشغيل أوامر `npm` بكفاءة (أو قد لا يتوفر فيها Node.js من الأساس)، يفضل دائماً أن نقوم ببناء ملفات الواجهة (Frontend) محلياً ورفعها إلى GitHub.

1. **تعديل ملف `.gitignore`:**
   افتح ملف `.gitignore` وتأكد أن المجلد `public/build` غير موجود فيه (إذا كان موجوداً، قم بحذفه أو وضع `#` قبله)، لأننا نحتاج لرفع الملفات المجمّعة (Compiled) إلى GitHub.
   
2. **بناء الملفات ورفعها (Commit & Push):**
   افتح الـ Terminal في مسار المشروع ونفذ الأوامر التالية:
   ```bash
   # بناء ملفات الواجهة للـ Production
   npm run build
   
   # رفع التعديلات والملفات إلى GitHub
   git add .
   git commit -m "Build frontend for production and fix issues"
   git push origin main
   ```

---

## 2. إعداد الاستضافة (Hostinger)

1. **توجيه الـ Domain (اختياري ولكنه مفضل جداً):**
   - في لوحة تحكم Hostinger (hPanel)، اذهب إلى إعدادات النطاق (أو النطاق الفرعي Subdomain).
   - قم بتغيير مسار مجلد الجذر (Document Root) لكي يشير إلى المجلد `public` داخل مشروعك بدلاً من المسار الافتراضي `public_html`.
   - *مثال:* إذا كان اسم مجلد المشروع سيكون `wa-erp`، فاجعل مسار الدومين يشير إلى `/public_html/wa-erp/public` (أو خارج الـ `public_html` ليكون أكثر أماناً، مثل `/wa-erp/public`).

---

## 3. ربط GitHub بالاستضافة (Deployment)

توفر Hostinger أداة جاهزة لسحب الكود مباشرة من GitHub:

1. من لوحة **hPanel**، ابحث عن أداة **Git**.
2. قم بإضافة رابط مستودعك على GitHub (Repository URL) واسم الفرع (مثلاً `main`).
3. حدد المسار الذي سيتم رفع الملفات إليه (مثلاً المجلد `wa-erp` الذي جعلنا الدومين يشير إلى الـ `public` بداخله).
4. اضغط على **Deploy** (أو نشر). 
   - *نصيحة:* في نفس الصفحة ستجد **Webhook URL**، يمكنك نسخه ووضعه في إعدادات مستودعك على GitHub (Settings -> Webhooks) لكي يتم تحديث السيرفر تلقائياً بمجرد عمل `git push` مستقبلاً.

---

## 4. إعداد بيئة التشغيل عبر SSH (مهم جداً)

أنت الآن تحتاج إلى تثبيت مكاتب PHP (عبر Composer) وإعداد قاعدة البيانات. أسهل طريقة هي استخدام الـ SSH:

1. من لوحة Hostinger، ابحث عن **SSH Access** وقم بنسخ أمر الاتصال (مثال: `ssh u123456789@ip_address -p 65002`).
2. افتح الـ Terminal في جهازك والصق الأمر واكتب كلمة مرور الاستضافة الخاصة بك.
3. توجه إلى مجلد المشروع الذي قمت بتحديده في الخطوة 3:
   ```bash
   cd wa-erp
   ```
4. **تثبيت الحزم (Composer):**
   ```bash
   composer install --optimize-autoloader --no-dev
   ```
5. **إنشاء وإعداد ملف `.env`:**
   قم بنسخ الملف الافتراضي:
   ```bash
   cp .env.example .env
   ```
   ثم قم بتعديل الملف (بواسطة مدير الملفات في Hostinger أو عبر محرر `nano .env` في الـ SSH) واضبط القيم التالية:
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://yourdomain.com

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=اسم_قاعدة_البيانات_التي_أنشأتها_في_الاستضافة
   DB_USERNAME=اسم_المستخدم
   DB_PASSWORD=كلمة_المرور

   VITE_REVERB_APP_KEY=ضع_اي_رقم_سري_هنا
   VITE_REVERB_HOST=yourdomain.com
   ```
6. **توليد مفتاح التطبيق وعمل الـ Migrations:**
   في الـ SSH نفذ:
   ```bash
   php artisan key:generate
   
   # لإنشاء الجداول في قاعدة البيانات والمستخدم الافتراضي
   php artisan migrate --seed --force
   
   # لربط مجلد الصور/الملفات ليظهر للعامة
   php artisan storage:link
   
   # أخيراً، تفعيل التخزين المؤقت لتسريع التطبيق
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

---

## 5. مبروك! التطبيق جاهز 🎉

التطبيق الآن يعمل على رابطك، ويمكنك الدخول بنفس بيانات الحساب:
- **رقم الهاتف:** `99970766`
- **كلمة المرور:** `Ayman987654`

### كيف أقوم بتحديث التطبيق مستقبلاً؟
بما أن المشروع مربوط بـ GitHub:
1. قم بالتعديل على جهازك.
2. إذا كان التعديل في الواجهة، نفذ `npm run build`.
3. ارفع التعديلات `git add .` ثم `git commit` ثم `git push`.
4. (إذا قمت بإعداد الـ Webhook) سيتم تحديث الكود تلقائياً على السيرفر، أو يمكنك الدخول لأداة Git في Hostinger والضغط على **Deploy** مرة أخرى.
