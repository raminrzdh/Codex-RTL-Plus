<div align="center">

# Codex RTL Plus

**[فارسی](#persian) · [English](#english) · [العربية](#arabic)**

**پشتیبانی هوشمند RTL برای اپ دسکتاپ ChatGPT و Codex**

متن فارسی، عربی، عبری و محتوای ترکیبی را درست نمایش می‌دهد؛ بدون اینکه جهت کد، فرمول، ترمینال یا رابط اصلی برنامه را خراب کند.

[![npm version](https://img.shields.io/npm/v/codex-rtl-plus?style=flat-square&color=6478ff)](https://www.npmjs.com/package/codex-rtl-plus)
[![npm downloads](https://img.shields.io/npm/dm/codex-rtl-plus?style=flat-square&color=4dc7d9)](https://www.npmjs.com/package/codex-rtl-plus)
[![tests](https://img.shields.io/badge/tests-53%20passing-54c99a?style=flat-square)](https://github.com/raminrzdh/Codex-RTL-Plus)
[![license](https://img.shields.io/badge/license-MIT-8b93a7?style=flat-square)](#مجوز)

[نصب](#نصب) · [امکانات](#امکانات) · [تنظیمات](#پنل-تنظیمات) · [عیب‌یابی](#عیب‌یابی) · [English](#english)

</div>

---

<a id="persian"></a>

## راهنمای فارسی

## چرا Codex RTL Plus؟

قانون سادهٔ «اولین حرف متن» برای جمله‌های واقعی فارسی کافی نیست. برای مثال، جملهٔ زیر با واژهٔ انگلیسی شروع می‌شود اما ساختار آن فارسی است:

```text
Codex می‌تواند این File را دوباره بررسی کند.
```

Codex RTL Plus کل جمله را بررسی می‌کند، جهت پایه را RTL قرار می‌دهد و در همان حال ترتیب داخلی `Codex` و `File` را LTR نگه می‌دارد. همین منطق هنگام تایپ یا Paste در باکس پرامپت نیز اجرا می‌شود.

| نوع محتوا | رفتار |
| --- | --- |
| متن فارسی، عربی یا عبری | RTL و راست‌چین |
| جملهٔ RTL با شروع انگلیسی | تشخیص بر اساس کل جمله |
| متن انگلیسی | LTR و چپ‌چین |
| کد، ترمینال و diff | همیشه LTR |
| LaTeX و محاسبات | جداسازی در یک LTR island |
| جدول RTL | جهت ستون‌ها و سلول‌ها بهینه می‌شود |

## امکانات

- تشخیص هوشمند فارسی، عربی، عبری و متن‌های ترکیبی
- اصلاح جمله‌هایی که با واژهٔ لاتین شروع می‌شوند
- تشخیص زندهٔ جهت در composer هنگام تایپ و Paste
- پشتیبانی از محتوای چندخطی RTL/LTR
- محدودکردن تغییرات به مکالمه؛ بدون RTL کردن sidebar و toolbar
- حفظ جهت LTR برای code block، inline code، diff و ترمینال
- جداسازی فرمول‌های LaTeX و عبارت‌هایی مانند `2 + 3 = 5`
- تشخیص و جهت‌دهی جدول‌های فارسی و عربی
- فونت مستقل برای متن فارسی/عربی، انگلیسی و کد
- فونت داخلی Vazirmatn بدون نیاز به نصب جداگانه
- اصلاح `Shift + 2` برای تایپ `@` با صفحه‌کلید فارسی
- backup و restore امن فایل اصلی برنامه

## نصب

### پیش‌نیاز

- [Node.js](https://nodejs.org/) نسخهٔ جدید
- بسته‌بودن کامل اپ ChatGPT/Codex پیش از نصب

### macOS

اپ را با `⌘Q` ببندید و اجرا کنید:

```bash
npx codex-rtl-plus
```

اگر خطای Permission دریافت کردید، دسترسی Terminal را در این مسیر فعال کنید:

```text
System Settings → Privacy & Security → App Management
```

سپس دستور نصب را دوباره اجرا کنید. استفاده از `sudo` در macOS توصیه نمی‌شود.

### Windows

PowerShell را با گزینهٔ **Run as administrator** باز کنید:

```powershell
npx codex-rtl-plus
```

### Linux

```bash
sudo npx codex-rtl-plus
```

### مسیر نصب غیرمعمول

اگر فایل `app.asar` در مسیر پیش‌فرض نیست:

```bash
npx codex-rtl-plus --asar "/full/path/to/app.asar"
```

## پنل تنظیمات

بعد از نصب، دکمهٔ شناور **RTL** در گوشهٔ برنامه نمایش داده می‌شود. پنل با کلیک باز می‌شود و از کیبورد، Escape و Reduced Motion پشتیبانی می‌کند.

| تنظیم | توضیح |
| --- | --- |
| Smart RTL | فعال یا غیرفعال‌کردن کامل موتور جهت‌دهی |
| Force RTL | اجبار RTL برای متن مکالمه |
| Prompt RTL | تشخیص جهت باکس پرامپت هنگام تایپ و Paste |
| FA / AR | فونت فارسی و عربی |
| English | فونت متن لاتین |
| Code | فونت کد، diff و ترمینال |
| Line height | تنظیم فاصلهٔ خطوط |
| Shift + 2 → @ | اصلاح میان‌بر `@` در صفحه‌کلید فارسی |

تنظیمات در `~/.codex-rtl.json` ذخیره می‌شوند و پس از اجرای مجدد برنامه باقی می‌مانند.

## ارتقا

اپ ChatGPT/Codex را ببندید، نسخهٔ فعلی را Restore و آخرین نسخه را نصب کنید:

```bash
npx codex-rtl-plus --restore
npx codex-rtl-plus@latest
```

> آپدیت خود ChatGPT/Codex فایل patch‌شده را جایگزین می‌کند. بعد از هر آپدیت برنامه، دستور نصب را دوباره اجرا کنید.

## حذف و بازگردانی

برای بازگرداندن فایل اصلی برنامه:

```bash
npx codex-rtl-plus --restore
```

backupهای نسخه‌بندی‌شده خارج از bundle برنامه و در مسیر زیر نگهداری می‌شوند:

```text
~/.codex-rtl/backups/
```

در macOS اطلاعات لازم برای بازگردانی bundle و integrity/signature نیز حفظ می‌شود.

## عیب‌یابی

### ویجت یا تغییرات جدید نمایش داده نمی‌شوند

مطمئن شوید package قدیمی را اجرا نکرده‌اید. دستور صحیح:

```bash
npx codex-rtl-plus@latest
```

اگر نسخهٔ قبلی هنوز patch شده است، ابتدا Restore و سپس نصب کنید.

### برنامه هنگام نصب باز است

اپ را فقط minimize نکنید؛ آن را با `⌘Q` در macOS یا **Quit/Exit** در Windows کاملاً ببندید.

### بعد از آپدیت برنامه RTL حذف شده است

این رفتار طبیعی است، چون updater فایل `app.asar` را جایگزین می‌کند. دستور نصب را دوباره اجرا کنید.

### گزارش باگ

در یک [Issue جدید](https://github.com/raminrzdh/Codex-RTL-Plus/issues/new) این اطلاعات را بنویسید:

- سیستم‌عامل و نسخهٔ آن
- نسخهٔ ChatGPT/Codex
- متن نمونه‌ای که درست نمایش داده نمی‌شود
- خروجی کامل Terminal در صورت خطای نصب

## توسعه

```bash
git clone https://github.com/raminrzdh/Codex-RTL-Plus.git
cd Codex-RTL-Plus
npm ci
npm test
```

ساختار پروژه:

```text
src/rtl-core.cjs        موتور مستقل تشخیص جهت، جدول و ریاضی
src/rtl-payload.js      پردازش DOM، composer و چرخهٔ اجرای patch
src/rtl-widget.js       رابط تنظیمات Codex RTL Plus
tools/build-payload.mjs ساخت payload قابل تزریق
bin/index.js            CLI نصب، backup، restore و signing
bin/payload.js          خروجی تولیدشده؛ مستقیماً ویرایش نکنید
test/                   تست‌های unit، امنیتی و end-to-end
```

پس از تغییر فایل‌های `src/`:

```bash
npm run build
npm test
npm pack --dry-run
```

## سازوکار کلی

1. محل `app.asar` برنامه پیدا می‌شود.
2. یک backup نسخه‌بندی‌شده خارج از bundle ساخته می‌شود.
3. entry point واقعی Electron از manifest خوانده می‌شود.
4. loader و payload موتور RTL به archive اضافه می‌شوند.
5. metadata فایل‌های unpacked و ASAR integrity حفظ می‌شود.
6. در macOS bundle به‌صورت ad-hoc امضا و نتیجه verify می‌شود.

هیچ سرویس پس‌زمینه‌ای نصب نمی‌شود و پردازش متن در همان برنامه و روی دستگاه کاربر انجام می‌شود.

---

<a id="english"></a>

## English guide

**Codex RTL Plus** adds smart right-to-left support to the ChatGPT/Codex desktop app. It correctly handles Persian, Arabic, Hebrew, and mixed RTL/LTR sentences—including RTL prose that begins with an English word—while keeping code, terminals, diffs, math, and application chrome LTR.

For example, the following sentence is semantically RTL even though it starts with a Latin word:

```text
Codex می‌تواند این File را دوباره بررسی کند.
```

The engine evaluates the complete sentence, applies an RTL base direction, and preserves the internal LTR order of `Codex` and `File`.

### Features

- Smart Persian, Arabic, Hebrew, and mixed-text detection
- Correct direction for RTL sentences that begin with a Latin word
- Live prompt-composer updates while typing or pasting
- Mixed multi-line content support
- Conversation-only scoping; sidebars and toolbars remain unchanged
- LTR isolation for code blocks, inline code, diffs, and terminals
- LTR islands for LaTeX and arithmetic such as `2 + 3 = 5`
- RTL-aware tables
- Independent Persian/Arabic, English, and code fonts
- Built-in Vazirmatn font
- Persian keyboard `Shift + 2 → @` fix
- Versioned backups and safe restoration

### Installation

Install a recent version of [Node.js](https://nodejs.org/), completely quit the ChatGPT/Codex desktop app, then run:

```bash
npx codex-rtl-plus
```

On Windows, run PowerShell as Administrator. On Linux, use:

```bash
sudo npx codex-rtl-plus
```

To patch a non-standard `app.asar` location:

```bash
npx codex-rtl-plus --asar "/full/path/to/app.asar"
```

On macOS, grant your terminal App Management access if installation reports a permission error:

```text
System Settings → Privacy & Security → App Management
```

### Settings panel

Click the floating **RTL** button to open the settings panel.

| Setting | Purpose |
| --- | --- |
| Smart RTL | Enable or disable the complete direction engine |
| Force RTL | Force conversation prose to use RTL |
| Prompt RTL | Detect prompt direction while typing and pasting |
| FA / AR | Set the Persian and Arabic font |
| English | Set the Latin font |
| Code | Set the code, diff, and terminal font |
| Line height | Adjust conversation line spacing |
| Shift + 2 → @ | Fix the Persian keyboard shortcut |

Settings are stored in `~/.codex-rtl.json`.

### Upgrade

Quit the desktop app, restore the current patch, and install the latest release:

```bash
npx codex-rtl-plus --restore
npx codex-rtl-plus@latest
```

ChatGPT/Codex updates replace the patched archive. Run the installation command again after an application update.

### Uninstall and restore

```bash
npx codex-rtl-plus --restore
```

Versioned backups are stored in `~/.codex-rtl/backups/` outside the application bundle.

### Development

```bash
git clone https://github.com/raminrzdh/Codex-RTL-Plus.git
cd Codex-RTL-Plus
npm ci
npm test
```

After changing files under `src/`, rebuild and validate the generated payload:

```bash
npm run build
npm test
npm pack --dry-run
```

Report bugs through [GitHub Issues](https://github.com/raminrzdh/Codex-RTL-Plus/issues).

---

<a id="arabic"></a>

<div dir="rtl">

## الدليل العربي

يضيف **Codex RTL Plus** دعماً ذكياً للكتابة من اليمين إلى اليسار في تطبيق ChatGPT/Codex لسطح المكتب. يتعامل مع النصوص العربية والفارسية والعبرية والمحتوى المختلط، بما في ذلك الجمل التي تبدأ بكلمة إنجليزية، مع إبقاء الشيفرة البرمجية والطرفية والفروقات والمعادلات وواجهة التطبيق باتجاه LTR.

على سبيل المثال، تبدأ الجملة التالية بكلمة لاتينية لكنها جملة عربية واتجاهها الصحيح RTL:

```text
Codex يمكنه مراجعة هذا File مرة أخرى.
```

يفحص المحرك الجملة كاملة، ثم يحدد اتجاهها الأساسي مع الحفاظ على الترتيب الداخلي الصحيح للكلمات الإنجليزية.

### المزايا

- اكتشاف ذكي للنصوص العربية والفارسية والعبرية والمختلطة
- معالجة الجمل RTL التي تبدأ بكلمة لاتينية
- تحديث مباشر لاتجاه مربع كتابة الطلب أثناء الكتابة أو اللصق
- دعم المحتوى المختلط متعدد الأسطر
- حصر تغييرات RTL داخل المحادثة دون تغيير الشريط الجانبي والأدوات
- إبقاء كتل الشيفرة والفروقات والطرفية باتجاه LTR
- عزل LaTeX والعمليات الحسابية مثل `2 + 3 = 5`
- دعم الجداول العربية واتجاه خلاياها
- خطوط منفصلة للعربية/الفارسية والإنجليزية والشيفرة
- تضمين خط Vazirmatn
- إصلاح اختصار `Shift + 2 → @` للوحة المفاتيح الفارسية
- نسخ احتياطية مرقمة واستعادة آمنة

### التثبيت

ثبّت إصداراً حديثاً من [Node.js](https://nodejs.org/)، ثم أغلق تطبيق ChatGPT/Codex بالكامل وشغّل:

```bash
npx codex-rtl-plus
```

في Windows افتح PowerShell بصلاحية Administrator. وفي Linux استخدم:

```bash
sudo npx codex-rtl-plus
```

لتحديد مسار غير افتراضي لملف `app.asar`:

```bash
npx codex-rtl-plus --asar "/full/path/to/app.asar"
```

إذا ظهر خطأ صلاحيات في macOS، امنح تطبيق الطرفية صلاحية App Management من المسار:

```text
System Settings → Privacy & Security → App Management
```

### لوحة الإعدادات

انقر زر **RTL** العائم لفتح لوحة الإعدادات.

| الإعداد | الوظيفة |
| --- | --- |
| Smart RTL | تشغيل محرك الاتجاه أو إيقافه بالكامل |
| Force RTL | فرض RTL على نص المحادثة |
| Prompt RTL | اكتشاف اتجاه الطلب أثناء الكتابة واللصق |
| FA / AR | تحديد خط العربية والفارسية |
| English | تحديد خط النص اللاتيني |
| Code | تحديد خط الشيفرة والفروقات والطرفية |
| Line height | ضبط تباعد أسطر المحادثة |
| Shift + 2 → @ | إصلاح اختصار لوحة المفاتيح الفارسية |

تُحفظ الإعدادات في الملف `~/.codex-rtl.json`.

### الترقية

أغلق التطبيق، استعد النسخة الأصلية، ثم ثبّت أحدث إصدار:

```bash
npx codex-rtl-plus --restore
npx codex-rtl-plus@latest
```

تستبدل تحديثات ChatGPT/Codex ملف التطبيق المعدّل، لذلك أعد تشغيل أمر التثبيت بعد تحديث التطبيق.

### الإزالة والاستعادة

```bash
npx codex-rtl-plus --restore
```

تُحفظ النسخ الاحتياطية المرقمة خارج حزمة التطبيق في `~/.codex-rtl/backups/`.

### التطوير

```bash
git clone https://github.com/raminrzdh/Codex-RTL-Plus.git
cd Codex-RTL-Plus
npm ci
npm test
```

بعد تعديل ملفات `src/` شغّل:

```bash
npm run build
npm test
npm pack --dry-run
```

للإبلاغ عن مشكلة، استخدم [GitHub Issues](https://github.com/raminrzdh/Codex-RTL-Plus/issues).

</div>

## مجوز / License / الترخيص

این پروژه تحت مجوز MIT منتشر شده است.<br>
This project is released under the MIT License.<br>
هذا المشروع منشور بموجب ترخيص MIT.
