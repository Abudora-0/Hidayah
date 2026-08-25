"use client";

import { useCallback } from "react";

import { LANGUAGE_DIRECTION, type Language } from "./i18n-shared";
import { useSettings } from "./settings";

export {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_DIRECTION,
  LANGUAGE_LABELS,
  isLanguage,
  type Language,
} from "./i18n-shared";


/**
 * Interface copy.
 *
 * English is the source, so a missing Urdu entry falls back to it rather than
 * showing a key. That keeps a partial translation usable instead of broken.
 */
const UR: Record<string, string> = {
  // Navigation and chrome
  "nav.prayer": "نماز",
  "nav.quran": "قرآن",
  "nav.calendar": "تقویم",
  "nav.tasbih": "تسبیح",
  "nav.settings": "ترتیبات",
  "nav.openMenu": "مینو کھولیں",
  "nav.changeTheme": "رنگ تبدیل کریں",
  "nav.language": "زبان",
  "push.notify":
    "سائٹ بند ہونے پر بھی مجھے اطلاع دیں",
  "push.installHint":
    "سب سے بھروسہ مند اطلاع کے لیے ہدایہ کو اپنی ہوم اسکرین پر شامل کریں۔",
  "push.toggleAria":
    "پس منظر میں نماز کی اطلاعات",
  "push.unsupported":
    "یہ براؤزر پس منظر میں اطلاعات نہیں بھیج سکتا۔ ہدایہ کھلی ہو تو الارم پھر بھی بجتا ہے۔",
  "push.notConfiguredPanel":
    "اس تنصیب پر پس منظر کی اطلاعات مرتب نہیں ہیں۔ ہدایہ کھلی ہو تو نیچے والا الارم پھر بھی کام کرتا ہے۔",
  "push.stored":
    "آپ کے متناسقات اور ٹائم زون سرور پر محفوظ ہیں تاکہ کوئی براؤزر نہ چل رہا ہو تب بھی نماز کے اوقات نکالے جا سکیں۔ اسے بند کرنے پر یہ حذف ہو جاتے ہیں۔",
  "push.willStore":
    "اسے آن کرنے سے آپ کے متناسقات اور ٹائم زون سرور کو بھیجے جاتے ہیں۔ یہ اس لیے درکار ہیں کہ کوئی براؤزر نہ چل رہا ہو تب بھی نماز کے اوقات نکالے جا سکیں، اور بند کرنے پر حذف ہو جاتے ہیں۔",
  "push.queued":
    "{n} آنے والی نمازیں قطار میں ہیں۔ یہ ہر ونڈو بند ہونے پر بھی پہنچ جائیں گی۔",
  "push.queuedNone":
    "آج آپ کی چنی ہوئی کوئی نماز باقی نہیں۔ کل کی نمازیں روزانہ کے عمل میں قطار میں لگ جائیں گی۔",
  "push.schedulingOff":
    "یہ آلہ سبسکرائب ہے، مگر اس تنصیب پر نماز کے اوقات قطار میں نہیں لگ رہے، اس لیے خود سے کچھ نہیں پہنچے گا۔ آزمائشی اطلاع پھر بھی کام کرتی ہے۔",
  "push.test":
    "آزمائشی اطلاع بھیجیں",
  "push.testSending":
    "بھیجی جا رہی ہے",
  "push.testSent":
    "بھیج دی گئی۔ یہ چند سیکنڈ میں پہنچ جانی چاہیے، چاہے یہ ٹیب بند ہو۔",
  "push.testArrived":
    "پش اس آلے تک پہنچ گیا۔ اگر کوئی اطلاع ظاہر نہیں ہوئی تو نظام اسے چھپا رہا ہے: اپنی سسٹم سیٹنگز میں براؤزر کی اطلاعات دیکھیں، اور ڈسٹرب نہ کریں بند کریں۔",
  "push.needLocation":
    "پہلے اپنا مقام مقرر کریں، تاکہ نماز کے اوقات نکالے جا سکیں۔",
  "push.needPrayer":
    "نیچے سے کم از کم ایک نماز چنیں۔",
  "push.err.unsupported":
    "یہ براؤزر پس منظر میں اطلاعات نہیں بھیج سکتا۔",
  "push.err.notConfigured":
    "اس تنصیب پر پس منظر کی اطلاعات مرتب نہیں ہیں۔",
  "push.err.permissionDenied":
    "اطلاعات کی اجازت نہیں دی گئی۔ سائٹ کھلی ہو تو آپ الارم پھر بھی استعمال کر سکتے ہیں۔",
  "push.err.workerFailed":
    "سروس ورکر رجسٹر نہیں ہو سکا۔",
  "push.err.badKey":
    "اس تنصیب کی اطلاعاتی کلید درست نہیں، اس لیے یہ بلڈ سبسکرائب نہیں کر سکتا۔",
  "push.err.braveBlocked":
    "بریو پش سروس کو اجازت ملنے تک روکتا ہے۔ brave://settings/privacy کھولیں، Use Google services for push messaging آن کریں، پھر بریو دوبارہ چلائیں اور کوشش کریں۔",
  "push.err.pushServiceUnreachable":
    "براؤزر اپنی پش سروس تک نہیں پہنچ سکا، اس لیے اطلاعات رجسٹر نہیں ہو سکتیں۔ عام طور پر یہ براؤزر کی کوئی ترتیب یا نیٹ ورک کی رکاوٹ ہوتی ہے، ہدایہ کی خرابی نہیں۔",
  "push.err.notAllowed":
    "اس سائٹ کے لیے، یا آپریٹنگ سسٹم کی طرف سے، اطلاعات بند ہیں۔ براؤزر میں ہدایہ کے لیے اجازت دیں، اور سسٹم سیٹنگز میں براؤزر کی اطلاعات بھی دیکھیں۔",
  "push.err.refused":
    "براؤزر نے سبسکرپشن سے انکار کر دیا۔",
  "push.err.saveFailed":
    "سبسکرپشن محفوظ نہیں ہو سکی۔",
  "push.err.notSubscribed":
    "یہ آلہ سبسکرائب نہیں ہے۔ اطلاعات بند کر کے دوبارہ آن کریں۔",
  "push.err.incomplete":
    "پش سبسکرپشن نامکمل ہے۔",
  "push.err.badCoordinates":
    "نماز کے اوقات نکالنے کے لیے درست متناسقات درکار ہیں۔",
  "push.err.noPrayers":
    "کم از کم ایک نماز چنیں جس کی اطلاع دی جائے۔",
  "push.err.badRequest":
    "درخواست سمجھ نہیں آئی۔",
  "push.err.deliveryGone":
    "براؤزر نے یہ سبسکرپشن ترک کر دی ہے۔ اطلاعات بند کر کے دوبارہ آن کریں۔",
  "push.err.deliveryFailed":
    "پش سروس نے پیغام قبول نہیں کیا۔",
  "welcome.tagline":
    "نماز کے اوقات، قرآن، اور ہجری تقویم، سب ایک پرسکون جگہ پر۔",
  "welcome.inside": "اندر کیا ہے",
  "welcome.prayerNote": "آپ کے شہر کے اوقات، ہر نماز سے پہلے الارم کے ساتھ",
  "welcome.quranNote": "تمام ۱۱۴ سورتیں، ترجمہ، تفسیر اور تلاوت کے ساتھ",
  "welcome.tasbihNote": "ذکر کا شمار، جو آپ کی واپسی تک محفوظ رہتا ہے",
  "welcome.calendarNote": "ہجری تاریخ، اور وہ مہینے جو اہم ہیں",

  // Prayer dashboard
  "prayer.next": "اگلی نماز",
  "prayer.tomorrow": "کل",
  "prayer.remaining": "باقی",
  "prayer.now": "اب",
  "prayer.qibla": "قبلہ",
  "prayer.bearing": "شمال سے سمت",
  "prayer.liveCompass": "کمپاس استعمال کریں",
  "prayer.usingCompass": "آپ کے آلے کا کمپاس",
  "prayer.night": "رات",
  "prayer.middleOfNight": "نصف رات",
  "prayer.lastThird": "آخری تہائی کا آغاز",
  "prayer.tahajjudNote":
    "آخری تہائی تہجد کا وقت ہے، مغرب سے اگلی فجر تک شمار کیا جاتا ہے۔",
  "prayer.calculation": "حساب",
  "prayer.calculationNote":
    "اوقات آپ کے آلے پر آپ کے مقام سے شمار کیے جاتے ہیں، اس لیے یہ آف لائن بھی کام کرتے ہیں۔",
  "prayer.methodNote": "طریقہ اور مسلک ترتیبات میں تبدیل کیے جا سکتے ہیں۔",
  "prayer.tracker": "ریکارڈ",
  "prayer.dayStreak": "دن مسلسل",
  "prayer.markedToday": "آج {done} از {total} مکمل",
  "prayer.markAsPrayed": "{name} کو ادا شدہ نشان زد کریں",
  "prayer.alarmFor": "{name} کے لیے الارم",

  // Location
  "location.set": "اپنا مقام منتخب کریں",
  "location.where": "آپ کہاں نماز پڑھ رہے ہیں؟",
  "location.whyNote":
    "نماز کے اوقات آپ کے مقام پر منحصر ہیں۔ اجازت دیں یا اپنا شہر منتخب کریں۔ آپ کا مقام اسی آلے پر رہتا ہے۔",
  "location.useMine": "میرا مقام استعمال کریں",
  "location.locating": "مقام معلوم کیا جا رہا ہے",
  "location.searchCity": "شہر تلاش کریں",
  "location.noMatch":
    "کوئی نتیجہ نہیں۔ قریب ترین بڑا شہر آزمائیں، یا مقام کی اجازت دیں۔",

  // Quran
  "quran.title": "قرآن مجید",
  "quran.intro":
    "عثمانی رسم الخط میں ایک سو چودہ سورتیں، انگریزی اور اردو ترجمے، تفسیر اور تلاوت کے ساتھ۔",
  "quran.bySurah": "سورت کے اعتبار سے",
  "quran.byPara": "پارے کے اعتبار سے",
  "quran.searchPlaceholder": "نام، معنی یا نمبر سے تلاش کریں",
  "quran.filterAll": "سب",
  "quran.filterMeccan": "مکی",
  "quran.filterMedinan": "مدنی",
  "quran.surahCount": "{count} سورتیں",
  "quran.nothingMatches": "اس تلاش سے کچھ نہیں ملا۔",
  "quran.ayahs": "آیات",
  "quran.ayah": "آیت",
  "quran.allSurahs": "تمام سورتیں",
  "quran.allParas": "تمام پارے",
  "quran.reciteSurah": "یہ سورت سنیں",
  "quran.recitePara": "یہ پارہ سنیں",
  "quran.previous": "پچھلا",
  "quran.next": "اگلا",
  "quran.para": "پارہ",
  "quran.paraOf": "پارہ {n} از 30",
  "quran.beginsAt": "آغاز",
  "quran.searchTranslations": "ترجموں میں تلاش کریں",
  "quran.bookmarks": "نشان زد آیات",
  "quran.continueReading": "پڑھنا جاری رکھیں",
  "quran.surah": "سورت",

  // Reader controls
  "reader.display": "نمائش",
  "reader.mode": "پڑھنے کا انداز",
  "reader.study": "مطالعہ",
  "reader.studyNote": "آیت بہ آیت",
  "reader.mushaf": "مصحف",
  "reader.mushafNote": "رواں متن",
  "reader.size": "متن کا حجم",
  "reader.translations": "ترجمے",
  "reader.english": "انگریزی",
  "reader.urdu": "اردو",
  "reader.pages": "صفحات",
  "reader.pageRange": "{from} تا {to} از {total} آیات",
  "reader.previousPage": "پچھلا صفحہ",
  "reader.nextPage": "اگلا صفحہ",
  "reader.speed": "رفتار",
  "reader.repeat": "یہی آیت دہرائیں",
  "reader.seek": "آیت میں آگے پیچھے",

  // Ayah actions
  "ayah.play": "یہ آیت سنیں",
  "ayah.playing": "چل رہی ہے",
  "ayah.pause": "روکیں",
  "ayah.tafsir": "تفسیر پڑھیں",
  "ayah.copy": "آیت نقل کریں",
  "ayah.copied": "نقل ہو گئی",
  "ayah.bookmark": "نشان لگائیں",
  "ayah.bookmarked": "نشان زد",
  "ayah.sajdah": "سجدہ",
  "ayah.close": "بند کریں",

  // Tafsir
  "tafsir.title": "تفسیر",
  "tafsir.choose": "تفسیر منتخب کریں",
  "tafsir.unavailable":
    "یہ تفسیر لوڈ نہیں ہو سکی۔ کوئی اور نسخہ آزمائیں یا اپنا رابطہ جانچیں۔",
  "tafsir.noneForAyah":
    "اس نسخے میں اس آیت کی تفسیر موجود نہیں۔ بعض تفاسیر پورے رکوع پر بات کرتی ہیں۔",

  // Search
  "search.title": "تلاش",
  "search.placeholder": "ترجمے میں تلاش کریں",
  "search.minLength": "تلاش کے لیے کم از کم دو حروف لکھیں۔",
  "search.failed": "تلاش مکمل نہیں ہو سکی۔ اپنا رابطہ جانچ کر دوبارہ کوشش کریں۔",
  "search.noResults":
    "{query} کے لیے کچھ نہیں ملا۔ کوئی اور لفظ یا دوسرا ترجمہ آزمائیں۔",
  "search.results": "{count} نتائج",

  // Calendar
  "calendar.title": "اسلامی تقویم",
  "calendar.comingUp": "آنے والے دن",
  "calendar.backToMonth": "رواں مہینہ",
  "calendar.previousMonth": "پچھلا مہینہ",
  "calendar.nextMonth": "اگلا مہینہ",
  "calendar.nothingMarked": "اس دن کوئی خاص موقع درج نہیں۔",
  "calendar.whiteDayNote":
    "ایام بیض میں سے ایک، ہر مہینے کی تیرہ، چودہ اور پندرہ تاریخ کا روزہ۔",
  "calendar.sightingNote":
    "تاریخیں ام القریٰ تقویم کے مطابق ہیں، جو حساب سے طے ہوتی ہے۔ مقامی رویتِ ہلال ایک دن آگے پیچھے ہو سکتی ہے۔",

  // Tasbih
  "tasbih.title": "تسبیح",
  "tasbih.reset": "یہ ذکر صفر کریں",
  "tasbih.rounds": "مکمل دور",
  "tasbih.instructions":
    "دائرے پر ٹیپ کریں یا اسپیس دبائیں۔ گنتی اسی آلے پر محفوظ رہتی ہے۔",
  "tasbih.of": "{done} از {total}",

  // Settings
  "settings.title": "ترتیبات",
  "settings.location": "مقام",
  "settings.locationNote":
    "اسی براؤزر میں محفوظ ہے۔ سرور کو صرف اس صورت بھیجا جاتا ہے جب آپ پس منظر کی اطلاعات چالو کریں۔",
  "settings.calculation": "حساب",
  "settings.authority": "ادارہ",
  "settings.madhab": "مسلک، عصر کے لیے",
  "settings.twelveHour": "بارہ گھنٹے کی گھڑی",
  "settings.twelveHourNote": "اوقات صبح اور شام کے ساتھ دکھائیں",
  "settings.alarm": "نماز کا الارم",
  "settings.whichPrayers": "کون سی نمازیں",
  "settings.playSound": "آواز چلائیں",
  "settings.playSoundNote": "ایک گھنٹی، یا آپ کی اپنی adhan.mp3 اگر نصب ہو",
  "settings.reading": "پڑھائی",
  "settings.arabicSize": "عربی متن کا حجم",
  "settings.showEnglish": "انگریزی ترجمہ دکھائیں",
  "settings.showUrdu": "اردو ترجمہ دکھائیں",
  "settings.reciter": "قاری",
  "settings.tafsir": "تفسیر",
  "settings.appearance": "ظاہری شکل",
  "settings.language": "زبان",
  "settings.languageNote": "پورے صفحے کی زبان",

  // Footer
  "footer.browse": "صفحات",
  "footer.builtOn": "مآخذ",
  "footer.licence": "ایم آئی ٹی لائسنس کے تحت جاری",
  "footer.note":
    "نماز کے اوقات آپ کے آلے پر شمار ہوتے ہیں، اس لیے آف لائن بھی کام کرتے ہیں۔ تاریخیں ام القریٰ تقویم کے مطابق ہیں اور مقامی اعلان سے ایک دن مختلف ہو سکتی ہیں۔",
};

const EN: Record<string, string> = {
  "nav.prayer": "Prayer",
  "nav.quran": "Quran",
  "nav.calendar": "Calendar",
  "nav.tasbih": "Tasbih",
  "nav.settings": "Settings",
  "nav.openMenu": "Open menu",
  "nav.changeTheme": "Change theme",
  "nav.language": "Language",
  "push.notify":
    "Notify me when the site is closed",
  "push.installHint":
    "Install Hidayah to your home screen for the most reliable delivery.",
  "push.toggleAria":
    "Background prayer notifications",
  "push.unsupported":
    "This browser cannot deliver notifications in the background. The alarm still sounds while Hidayah is open in a tab.",
  "push.notConfiguredPanel":
    "Background notifications are not configured on this deployment. The alarm below still works whenever Hidayah is open.",
  "push.stored":
    "Your coordinates and time zone are stored on the server so prayer times can be worked out while no browser is running. Turning this off deletes them.",
  "push.willStore":
    "Turning this on sends your coordinates and time zone to the server. They are needed to work out prayer times when no browser is running, and are deleted when you turn it off.",
  "push.queued":
    "{n} upcoming prayers are queued. They will arrive even with every window closed.",
  "push.queuedNone":
    "None of your chosen prayers are still ahead today. Tomorrow's are queued at the daily run.",
  "push.schedulingOff":
    "This device is subscribed, but prayer times are not being queued on this deployment, so nothing will arrive on its own. A test notification still works.",
  "push.test":
    "Send a test notification",
  "push.testSending":
    "Sending",
  "push.testSent":
    "Sent. It should arrive within a few seconds, even with this tab closed.",
  "push.testArrived":
    "The push reached this device. If no notification appeared, the system is hiding it: check notifications for your browser in your system settings, and turn off Do not disturb.",
  "push.needLocation":
    "Set your location first, so prayer times can be computed.",
  "push.needPrayer":
    "Choose at least one prayer below.",
  "push.err.unsupported":
    "This browser cannot deliver background notifications.",
  "push.err.notConfigured":
    "Background notifications are not configured on this deployment.",
  "push.err.permissionDenied":
    "Notification permission was declined. You can still use the alarm while the site is open.",
  "push.err.workerFailed":
    "The service worker could not be registered.",
  "push.err.badKey":
    "The notification key on this deployment is not valid, so this build cannot subscribe.",
  "push.err.braveBlocked":
    "Brave blocks the push service until you allow it. Open brave://settings/privacy, turn on Use Google services for push messaging, then restart Brave and try again.",
  "push.err.pushServiceUnreachable":
    "The browser could not reach its push service, so notifications cannot be registered. This is usually a browser setting or a network that blocks it rather than a fault in Hidayah.",
  "push.err.notAllowed":
    "Notifications are blocked for this site, or by the operating system. Allow them for Hidayah in the browser, and check that notifications are enabled for your browser in system settings.",
  "push.err.refused":
    "The browser refused the subscription.",
  "push.err.saveFailed":
    "The subscription could not be saved.",
  "push.err.notSubscribed":
    "This device is not subscribed. Turn notifications off and on again.",
  "push.err.incomplete":
    "The push subscription is incomplete.",
  "push.err.badCoordinates":
    "Valid coordinates are required to compute prayer times.",
  "push.err.noPrayers":
    "Choose at least one prayer to be notified about.",
  "push.err.badRequest":
    "The request was not understood.",
  "push.err.deliveryGone":
    "The browser has discarded this subscription. Turn notifications off and on again.",
  "push.err.deliveryFailed":
    "The push service refused the message.",
  "welcome.tagline":
    "Prayer times, the Quran, and the Hijri calendar, kept in one quiet place.",
  "welcome.inside": "What is inside",
  "welcome.prayerNote": "Times for your city, with an alarm before each one",
  "welcome.quranNote": "All 114 surahs, with translation, tafsir and recitation",
  "welcome.tasbihNote": "A count for dhikr, kept for your return",
  "welcome.calendarNote": "The Hijri date, and the months that matter",

  "prayer.next": "Next prayer",
  "prayer.tomorrow": "Tomorrow",
  "prayer.remaining": "remaining",
  "prayer.now": "Now",
  "prayer.qibla": "Qibla",
  "prayer.bearing": "Bearing from true north",
  "prayer.liveCompass": "Use live compass",
  "prayer.usingCompass": "Following your device compass",
  "prayer.night": "Night",
  "prayer.middleOfNight": "Middle of the night",
  "prayer.lastThird": "Last third begins",
  "prayer.tahajjudNote":
    "The last third is the time of tahajjud, counted from Maghrib to the following Fajr.",
  "prayer.calculation": "Calculation",
  "prayer.calculationNote":
    "Times are computed on your device from your coordinates, so they work offline and are never rate limited.",
  "prayer.methodNote": "Method and madhab can be changed in settings.",
  "prayer.tracker": "Tracker",
  "prayer.dayStreak": "day streak",
  "prayer.markedToday": "{done} of {total} marked today",
  "prayer.markAsPrayed": "Mark {name} as prayed",
  "prayer.alarmFor": "Alarm for {name}",

  "location.set": "Set your location",
  "location.where": "Where are you praying?",
  "location.whyNote":
    "Prayer times depend on your coordinates. Allow location access, or pick the nearest city. Your location stays on this device.",
  "location.useMine": "Use my location",
  "location.locating": "Locating you",
  "location.searchCity": "Search for a city",
  "location.noMatch":
    "No match. Try the nearest large city, or allow location access.",

  "quran.title": "The Holy Quran",
  "quran.intro":
    "114 surahs in the Uthmani script, with translation in English and Urdu, tafsir, and recitation from seven reciters.",
  "quran.bySurah": "By surah",
  "quran.byPara": "By para",
  "quran.searchPlaceholder": "Search by name, meaning or number",
  "quran.filterAll": "All",
  "quran.filterMeccan": "Meccan",
  "quran.filterMedinan": "Medinan",
  "quran.surahCount": "{count} surahs",
  "quran.nothingMatches": "Nothing matches that search.",
  "quran.ayahs": "ayahs",
  "quran.ayah": "ayah",
  "quran.allSurahs": "All surahs",
  "quran.allParas": "All paras",
  "quran.reciteSurah": "Recite this surah",
  "quran.recitePara": "Recite this para",
  "quran.previous": "Previous",
  "quran.next": "Next",
  "quran.para": "Para",
  "quran.paraOf": "Para {n} of 30",
  "quran.beginsAt": "Begins at",
  "quran.searchTranslations": "Search the translations",
  "quran.bookmarks": "Bookmarks",
  "quran.continueReading": "Continue reading",
  "quran.surah": "Surah",

  "reader.display": "Display",
  "reader.mode": "Reading mode",
  "reader.study": "Study",
  "reader.studyNote": "Ayah by ayah",
  "reader.mushaf": "Mushaf",
  "reader.mushafNote": "Flowing text",
  "reader.size": "Reading size",
  "reader.translations": "Translations",
  "reader.english": "English",
  "reader.urdu": "Urdu",
  "reader.pages": "Reading pages",
  "reader.pageRange": "Ayahs {from} to {to} of {total}",
  "reader.previousPage": "Previous page",
  "reader.nextPage": "Next page",
  "reader.speed": "Playback speed",
  "reader.repeat": "Repeat this ayah",
  "reader.seek": "Seek within this ayah",

  "ayah.play": "Play this ayah",
  "ayah.playing": "Playing this ayah",
  "ayah.pause": "Pause",
  "ayah.tafsir": "Read the tafsir",
  "ayah.copy": "Copy this ayah",
  "ayah.copied": "Copied",
  "ayah.bookmark": "Bookmark",
  "ayah.bookmarked": "Bookmarked",
  "ayah.sajdah": "sajdah",
  "ayah.close": "Close",

  "tafsir.title": "Tafsir",
  "tafsir.choose": "Choose a tafsir",
  "tafsir.unavailable":
    "This tafsir could not be loaded. Try a different edition, or check your connection.",
  "tafsir.noneForAyah":
    "This edition has no commentary for this ayah. Some tafsirs cover a passage as a whole rather than each ayah in turn.",

  "search.title": "Search",
  "search.placeholder": "Search the translation, for example mercy",
  "search.minLength": "Type at least two letters to search.",
  "search.failed":
    "The search could not be run. Check your connection and try again.",
  "search.noResults":
    "Nothing found for {query}. Try a different word or another translation, since wording differs between them.",
  "search.results": "{count} results",

  "calendar.title": "Islamic calendar",
  "calendar.comingUp": "Coming up",
  "calendar.backToMonth": "Back to this month",
  "calendar.previousMonth": "Previous month",
  "calendar.nextMonth": "Next month",
  "calendar.nothingMarked": "Nothing particular is marked on this day.",
  "calendar.whiteDayNote":
    "One of the white days, the thirteenth to fifteenth of every month, kept as a fast.",
  "calendar.sightingNote":
    "Dates follow the Umm al Qura calendar, which is calculated rather than sighted. Your local announcement may fall a day either side.",

  "tasbih.title": "Tasbih",
  "tasbih.reset": "Reset this dhikr",
  "tasbih.rounds": "full rounds",
  "tasbih.instructions":
    "Tap the circle, or press space. Counts are kept on this device and carry over between visits.",
  "tasbih.of": "{done} of {total}",

  "settings.title": "Settings",
  "settings.location": "Location",
  "settings.locationNote":
    "Kept in this browser. It is only sent to the server if you turn on background notifications below.",
  "settings.calculation": "Calculation",
  "settings.authority": "Authority",
  "settings.madhab": "Madhab, for Asr",
  "settings.twelveHour": "Twelve hour clock",
  "settings.twelveHourNote": "Show times as am and pm",
  "settings.alarm": "Prayer alarm",
  "settings.whichPrayers": "Which prayers",
  "settings.playSound": "Play a sound",
  "settings.playSoundNote":
    "A chime, or your own adhan.mp3 if one is installed",
  "settings.reading": "Reading",
  "settings.arabicSize": "Arabic size",
  "settings.showEnglish": "Show English",
  "settings.showUrdu": "Show Urdu",
  "settings.reciter": "Reciter",
  "settings.tafsir": "Tafsir",
  "settings.appearance": "Appearance",
  "settings.language": "Language",
  "settings.languageNote": "The language of the interface",

  "footer.browse": "Browse",
  "footer.builtOn": "Built on",
  "footer.licence": "Released under the MIT licence",
  "footer.note":
    "Prayer times are calculated on your device, so they work offline. Occasion dates follow the Umm al Qura calendar, which is calculated rather than sighted, and may fall a day either side of your local announcement.",
};

const DICTIONARIES: Record<Language, Record<string, string>> = { en: EN, ur: UR };

export type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function translate(
  language: Language,
  key: string,
  values?: Record<string, string | number>,
) {
  // English is the source, so anything missing from Urdu falls back to it
  // rather than surfacing a key.
  const text = DICTIONARIES[language][key] ?? EN[key] ?? key;
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    name in values ? String(values[name]) : match,
  );
}

/** The interface language, and a lookup bound to it. */
export function useLanguage(): { language: Language; t: Translate; dir: "ltr" | "rtl" } {
  const settings = useSettings();
  const language = settings.display.language;

  const t = useCallback<Translate>(
    (key, values) => translate(language, key, values),
    [language],
  );

  return { language, t, dir: LANGUAGE_DIRECTION[language] };
}
