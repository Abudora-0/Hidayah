export type Edition = {
  id: string;
  name: string;
  note: string;
};

export const ARABIC_EDITION = "quran-uthmani";

/** Default translations. Urdu defaults to Tahir ul Qadri. */
export const DEFAULT_ENGLISH = "en.sahih";
export const DEFAULT_URDU = "ur.qadri";

export const ENGLISH_EDITIONS: Edition[] = [
  { id: "en.sahih", name: "Saheeh International", note: "Clear and widely used" },
  { id: "en.itani", name: "Talal Itani", note: "Plain modern English" },
  { id: "en.pickthall", name: "Marmaduke Pickthall", note: "Classical register" },
  { id: "en.yusufali", name: "Abdullah Yusuf Ali", note: "Literary, well known" },
  { id: "en.hilali", name: "Hilali and Khan", note: "With bracketed glosses" },
  { id: "en.asad", name: "Muhammad Asad", note: "Interpretive and discursive" },
  { id: "en.arberry", name: "A. J. Arberry", note: "Preserves the cadence" },
  { id: "en.maududi", name: "Abul Ala Maududi", note: "From Tafhim ul Quran" },
  { id: "en.qarai", name: "Ali Quli Qarai", note: "Closely literal" },
  { id: "en.wahiduddin", name: "Wahiduddin Khan", note: "Simple and direct" },
];

export const URDU_EDITIONS: Edition[] = [
  { id: "ur.qadri", name: "طاہر القادری", note: "Tahir ul Qadri, Irfan ul Quran" },
  { id: "ur.jalandhry", name: "جالندہری", note: "Fateh Muhammad Jalandhry" },
  { id: "ur.kanzuliman", name: "احمد رضا خان", note: "Ahmed Raza Khan, Kanzul Iman" },
  { id: "ur.junagarhi", name: "محمد جوناگڑھی", note: "Muhammad Junagarhi" },
  { id: "ur.maududi", name: "ابو الاعلی مودودی", note: "Abul Ala Maududi" },
  { id: "ur.ahmedali", name: "احمد علی", note: "Ahmed Ali" },
  { id: "ur.najafi", name: "محمد حسین نجفی", note: "Muhammad Hussain Najafi" },
  { id: "ur.jawadi", name: "علامہ جوادی", note: "Syed Zeeshan Haider Jawadi" },
];

export type Reciter = {
  id: string;
  name: string;
  arabicName: string;
  style: string;
};

/**
 * Every reciter here was checked against the audio CDN. Abdul Basit and Sudais
 * are absent because that CDN answers 403 for them, and a dead option in a
 * dropdown is worse than a shorter list.
 */
export const RECITERS: Reciter[] = [
  {
    id: "ar.alafasy",
    name: "Mishary Rashid Alafasy",
    arabicName: "مشاري راشد العفاسي",
    style: "Murattal",
  },
  {
    id: "ar.husary",
    name: "Mahmoud Khalil Al Husary",
    arabicName: "محمود خليل الحصري",
    style: "Murattal, measured",
  },
  {
    id: "ar.minshawi",
    name: "Mohamed Siddiq Al Minshawi",
    arabicName: "محمد صديق المنشاوي",
    style: "Murattal",
  },
  {
    id: "ar.mahermuaiqly",
    name: "Maher Al Muaiqly",
    arabicName: "ماهر المعيقلي",
    style: "Murattal",
  },
  {
    id: "ar.shaatree",
    name: "Abu Bakr Ash Shaatree",
    arabicName: "أبو بكر الشاطري",
    style: "Murattal",
  },
  {
    id: "ar.hudhaify",
    name: "Ali Al Hudhaify",
    arabicName: "علي الحذيفي",
    style: "Murattal",
  },
  {
    id: "ar.ahmedajamy",
    name: "Ahmed ibn Ali Al Ajamy",
    arabicName: "أحمد بن علي العجمي",
    style: "Murattal",
  },
];

export type Tafsir = {
  id: string;
  name: string;
  author: string;
  language: "english" | "urdu" | "arabic";
};

/** Served as static JSON from the jsDelivr mirror of the tafsir dataset. */
export const TAFSIRS: Tafsir[] = [
  {
    id: "en-tafisr-ibn-kathir",
    name: "Ibn Kathir, abridged",
    author: "Hafiz Ibn Kathir",
    language: "english",
  },
  {
    id: "en-tafsir-maarif-ul-quran",
    name: "Maarif ul Quran",
    author: "Mufti Muhammad Shafi",
    language: "english",
  },
  {
    id: "ur-tafseer-ibn-e-kaseer",
    name: "تفسیر ابن کثیر",
    author: "Ibn Kathir, Urdu",
    language: "urdu",
  },
  {
    id: "ur-tafsir-bayan-ul-quran",
    name: "بیان القرآن",
    author: "Dr Israr Ahmad",
    language: "urdu",
  },
  {
    id: "ur-tafsir-as-saadi-urdu",
    name: "تفسیر السعدی",
    author: "Abd al Rahman al Saadi",
    language: "urdu",
  },
  {
    id: "ur-tafsir-fe-zalul-quran-syed-qatab",
    name: "فی ظلال القرآن",
    author: "Sayyid Qutb",
    language: "urdu",
  },
  {
    id: "en-al-jalalayn",
    name: "Tafsir al Jalalayn",
    author: "Al Mahalli and Al Suyuti",
    language: "english",
  },
  {
    id: "en-tafsir-al-mukhtasar",
    name: "Al Mukhtasar",
    author: "Centre for Quranic Studies",
    language: "english",
  },
];

export function findReciter(id: string) {
  return RECITERS.find((reciter) => reciter.id === id) ?? RECITERS[0];
}

export function findTafsir(id: string) {
  return TAFSIRS.find((tafsir) => tafsir.id === id) ?? TAFSIRS[0];
}
