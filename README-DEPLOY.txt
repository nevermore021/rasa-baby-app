دنیای رسا ۲.۰ — راهنمای انتشار
================================
۱) محتویات پوشه app را در هاست خود در مسیر /baby/ آپلود کنید
   (به‌جای فایل‌های قدیمی: index.html، assets/، manifest، sw.js).
۲) ساختار نهایی باید این‌طور باشد:
   /baby/index.html
   /baby/assets/css/app.css
   /baby/assets/js/{data,app,games,admin}.js
   /baby/assets/images/...  (۲۶۶ فایل)
   /baby/assets/audio/animals/... (۹۶ فایل)
   /baby/assets/audio/music/... (۵ آهنگ)
   /baby/assets/video/... (۱۱ کلیپ)
   /baby/assets/fonts/Vazirmatn-var.woff2
   /baby/assets/icons/...
   /baby/manifest.webmanifest
   /baby/sw.js
   /baby/admin.html
۳) پنل مدیریت: /baby/admin.html — رمز پیش‌فرض: rasa2026
   (از تب امنیت عوض کنید؛ برای امنیت بیشتر admin.html را با IP خودتان محدود کنید)
۴) کش مرورگر: نسخه sw با v2-1 است؛ بعد از آپلود، یک‌بار رفرش سخت (Ctrl+Shift+R) بزنید.
۵) تصاویر و صداها از نسخه قبلی همان سایت گرفته شده و صداهای اشتباه (مرغ/وزغ) اصلاح شده‌اند.
   حیواناتی که فایل صدای معتبر نداشتند، به‌جای پخش صدای حیوان دیگر، «بدون صدا» نشان داده می‌شوند.
