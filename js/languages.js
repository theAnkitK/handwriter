// Writing languages. `script` selects which fonts can write the language
// (see `scripts` in fonts.js). `labels` translate the assignment header and
// cover page: name, roll no, class, subject, date, teacher, submitted by,
// submitted to, and the cover heading. `sample` is shown on the font cards and
// `text` replaces the demo text when the language is picked. `font` is the
// default handwriting (otherwise the first font that supports the script).
const L = (name, roll, cls, subject, date, teacher, by, to, assignment) =>
  ({ name, roll, cls, subject, date, teacher, by, to, assignment });

export const LANGUAGES = [
  { id: 'en', name: 'English', native: 'English', script: 'latin', sample: 'Hello, Assignment',
    labels: L('Name', 'Roll No', 'Class', 'Subject', 'Date', 'Submitted to', 'Submitted By', 'Submitted To', 'Assignment') },
  { id: 'ur', name: 'Urdu', native: 'اردو', script: 'urdu', sample: 'میرا اسائنمنٹ',
    text: 'السلام علیکم! یہ میرا ہاتھ سے لکھا ہوا اسائنمنٹ ہے۔ ٹیکسٹ ٹو ہینڈ رائٹنگ کنورٹر طلبہ کے لیے ایک مفت ٹول ہے جو کمپیوٹر کے متن کو انسانی لکھائی میں بدل دیتا ہے۔',
    labels: L('نام', 'رول نمبر', 'کلاس', 'مضمون', 'تاریخ', 'استاد', 'پیش کردہ', 'بخدمت', 'اسائنمنٹ') },
  { id: 'ar', name: 'Arabic', native: 'العربية', script: 'arabic', font: 'aref-ruqaa', sample: 'واجبي المدرسي',
    text: 'مرحباً! هذا واجبي المكتوب بخط اليد. محوّل النص إلى خط اليد أداة مجانية للطلاب تحوّل نص الحاسوب إلى كتابة يدوية.',
    labels: L('الاسم', 'الرقم', 'الصف', 'المادة', 'التاريخ', 'المعلم', 'مقدم من', 'مقدم إلى', 'واجب') },
  { id: 'fa', name: 'Persian', native: 'فارسی', script: 'persian', sample: 'تکلیف من',
    text: 'سلام! این تکلیف دست‌نویس من است. مبدل متن به دست‌خط ابزاری رایگان برای دانش‌آموزان است که متن رایانه را به دست‌خط انسان تبدیل می‌کند.',
    labels: L('نام', 'شماره', 'کلاس', 'درس', 'تاریخ', 'استاد', 'ارائه‌دهنده', 'ارائه به', 'تکلیف') },
  { id: 'pa-pk', name: 'Punjabi (Shahmukhi)', native: 'پنجابی', script: 'urdu', sample: 'میرا کم',
    text: 'سلام! ایہہ میرا ہتھ نال لکھیا ہویا کم اے۔ ایہہ ٹول سارے طالب علماں لئی مفت اے۔',
    labels: L('ناں', 'رول نمبر', 'جماعت', 'مضمون', 'تریخ', 'استاد', 'پیش کرن والا', 'بخدمت', 'اسائنمنٹ') },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी', script: 'devanagari', sample: 'मेरा असाइनमेंट',
    text: 'नमस्ते! यह मेरा हाथ से लिखा हुआ असाइनमेंट है। टेक्स्ट टू हैंडराइटिंग कन्वर्टर छात्रों के लिए एक मुफ़्त टूल है जो कंप्यूटर के टेक्स्ट को इंसानी लिखावट में बदल देता है।',
    labels: L('नाम', 'रोल नंबर', 'कक्षा', 'विषय', 'दिनांक', 'शिक्षक', 'प्रस्तुतकर्ता', 'मार्गदर्शक', 'असाइनमेंट') },
  { id: 'mr', name: 'Marathi', native: 'मराठी', script: 'devanagari', sample: 'माझा गृहपाठ',
    text: 'नमस्कार! हा माझा हाताने लिहिलेला गृहपाठ आहे. हे साधन सर्व विद्यार्थ्यांसाठी मोफत आहे.',
    labels: L('नाव', 'रोल नंबर', 'वर्ग', 'विषय', 'दिनांक', 'शिक्षक', 'सादरकर्ता', 'मार्गदर्शक', 'गृहपाठ') },
  { id: 'ne', name: 'Nepali', native: 'नेपाली', script: 'devanagari', sample: 'मेरो गृहकार्य',
    text: 'नमस्ते! यो मेरो हातले लेखिएको गृहकार्य हो। यो उपकरण सबै विद्यार्थीहरूका लागि निःशुल्क छ।',
    labels: L('नाम', 'रोल नम्बर', 'कक्षा', 'विषय', 'मिति', 'शिक्षक', 'प्रस्तुतकर्ता', 'मार्गदर्शक', 'गृहकार्य') },
  { id: 'bn', name: 'Bangla', native: 'বাংলা', script: 'bengali', sample: 'আমার অ্যাসাইনমেন্ট',
    text: 'নমস্কার! এটি আমার হাতে লেখা অ্যাসাইনমেন্ট। টেক্সট টু হ্যান্ডরাইটিং কনভার্টার শিক্ষার্থীদের জন্য একটি বিনামূল্যের টুল, যা কম্পিউটারের লেখাকে হাতের লেখায় বদলে দেয়।',
    labels: L('নাম', 'রোল নম্বর', 'শ্রেণি', 'বিষয়', 'তারিখ', 'শিক্ষক', 'জমাদানকারী', 'জমা দেওয়া হলো', 'অ্যাসাইনমেন্ট') },
  { id: 'pa', name: 'Punjabi (Gurmukhi)', native: 'ਪੰਜਾਬੀ', script: 'gurmukhi', sample: 'ਮੇਰਾ ਅਸਾਈਨਮੈਂਟ',
    text: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਇਹ ਮੇਰਾ ਹੱਥ ਨਾਲ ਲਿਖਿਆ ਅਸਾਈਨਮੈਂਟ ਹੈ। ਇਹ ਟੂਲ ਸਾਰੇ ਵਿਦਿਆਰਥੀਆਂ ਲਈ ਮੁਫ਼ਤ ਹੈ।',
    labels: L('ਨਾਮ', 'ਰੋਲ ਨੰਬਰ', 'ਜਮਾਤ', 'ਵਿਸ਼ਾ', 'ਮਿਤੀ', 'ਅਧਿਆਪਕ', 'ਪੇਸ਼ਕਰਤਾ', 'ਪੇਸ਼ ਕੀਤਾ', 'ਅਸਾਈਨਮੈਂਟ') },
  { id: 'gu', name: 'Gujarati', native: 'ગુજરાતી', script: 'gujarati', sample: 'મારું અસાઇનમેન્ટ',
    text: 'નમસ્તે! આ મારું હાથે લખેલું અસાઇનમેન્ટ છે. આ સાધન બધા વિદ્યાર્થીઓ માટે મફત છે.',
    labels: L('નામ', 'રોલ નંબર', 'વર્ગ', 'વિષય', 'તારીખ', 'શિક્ષક', 'રજૂકર્તા', 'રજૂ કર્યું', 'અસાઇનમેન્ટ') },
  { id: 'ta', name: 'Tamil', native: 'தமிழ்', script: 'tamil', sample: 'என் ஒப்படைப்பு',
    text: 'வணக்கம்! இது என் கையால் எழுதிய ஒப்படைப்பு. இந்தக் கருவி எல்லா மாணவர்களுக்கும் இலவசம்.',
    labels: L('பெயர்', 'பதிவு எண்', 'வகுப்பு', 'பாடம்', 'தேதி', 'ஆசிரியர்', 'சமர்ப்பித்தவர்', 'சமர்ப்பிக்கப்பட்டது', 'ஒப்படைப்பு') },
  { id: 'te', name: 'Telugu', native: 'తెలుగు', script: 'telugu', sample: 'నా అసైన్‌మెంట్',
    text: 'నమస్కారం! ఇది నా చేతితో రాసిన అసైన్‌మెంట్. ఈ సాధనం విద్యార్థులందరికీ ఉచితం.',
    labels: L('పేరు', 'రోల్ నంబర్', 'తరగతి', 'విషయం', 'తేదీ', 'ఉపాధ్యాయులు', 'సమర్పించినవారు', 'సమర్పించబడినది', 'అసైన్‌మెంట్') },
  { id: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', script: 'kannada', sample: 'ನನ್ನ ಅಸೈನ್‌ಮೆಂಟ್',
    text: 'ನಮಸ್ಕಾರ! ಇದು ನನ್ನ ಕೈಬರಹದ ಅಸೈನ್‌ಮೆಂಟ್. ಈ ಸಾಧನ ಎಲ್ಲಾ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಉಚಿತ.',
    labels: L('ಹೆಸರು', 'ರೋಲ್ ಸಂಖ್ಯೆ', 'ತರಗತಿ', 'ವಿಷಯ', 'ದಿನಾಂಕ', 'ಶಿಕ್ಷಕರು', 'ಸಲ್ಲಿಸಿದವರು', 'ಸಲ್ಲಿಸಲಾಗಿದೆ', 'ಅಸೈನ್‌ಮೆಂಟ್') },
  { id: 'ml', name: 'Malayalam', native: 'മലയാളം', script: 'malayalam', sample: 'എന്റെ അസൈൻമെന്റ്',
    text: 'നമസ്കാരം! ഇത് എന്റെ കൈയക്ഷരത്തിലുള്ള അസൈൻമെന്റ് ആണ്. ഈ ഉപകരണം എല്ലാ വിദ്യാർത്ഥികൾക്കും സൗജന്യമാണ്.',
    labels: L('പേര്', 'റോൾ നമ്പർ', 'ക്ലാസ്', 'വിഷയം', 'തീയതി', 'അധ്യാപകൻ', 'സമർപ്പിച്ചത്', 'സമർപ്പിക്കുന്നത്', 'അസൈൻമെന്റ്') },
  { id: 'th', name: 'Thai', native: 'ไทย', script: 'thai', sample: 'การบ้านของฉัน',
    text: 'สวัสดีครับ นี่คือการบ้านที่เขียนด้วยลายมือของฉัน เครื่องมือนี้ใช้ได้ฟรีสำหรับนักเรียนทุกคน',
    labels: L('ชื่อ', 'เลขที่', 'ชั้น', 'วิชา', 'วันที่', 'ครู', 'ผู้จัดทำ', 'เสนอ', 'รายงาน') },
  { id: 'zh-Hans', name: 'Chinese (Simplified)', native: '简体中文', script: 'sc', sample: '我的作业',
    text: '你好！这是我的手写作业。文字转手写工具是一个免费的学生工具，可以把电脑文字变成真实的手写字。',
    labels: L('姓名', '学号', '班级', '科目', '日期', '老师', '提交人', '提交给', '作业') },
  { id: 'zh-Hant', name: 'Chinese (Traditional)', native: '繁體中文', script: 'tc', sample: '我的作業',
    text: '你好！這是我的手寫作業。文字轉手寫工具是一個免費的學生工具，可以把電腦文字變成真實的手寫字。',
    labels: L('姓名', '學號', '班級', '科目', '日期', '老師', '提交人', '提交給', '作業') },
  { id: 'ja', name: 'Japanese', native: '日本語', script: 'ja', sample: 'わたしの課題',
    text: 'こんにちは！これは手書きの課題です。テキスト手書き変換ツールは、学生のための無料ツールです。',
    labels: L('氏名', '学籍番号', 'クラス', '科目', '日付', '先生', '提出者', '提出先', '課題') },
  { id: 'ko', name: 'Korean', native: '한국어', script: 'ko', sample: '나의 과제',
    text: '안녕하세요! 이것은 손으로 쓴 저의 과제입니다. 이 도구는 학생들을 위한 무료 도구입니다.',
    labels: L('이름', '학번', '반', '과목', '날짜', '선생님', '제출자', '제출처', '과제') },
  { id: 'ru', name: 'Russian', native: 'Русский', script: 'cyrillic', sample: 'Моё задание',
    text: 'Привет! Это моё домашнее задание, написанное от руки. Этот инструмент бесплатный для всех студентов.',
    labels: L('Имя', 'Номер', 'Группа', 'Предмет', 'Дата', 'Преподаватель', 'Выполнил(а)', 'Проверил(а)', 'Задание') },
  { id: 'uk', name: 'Ukrainian', native: 'Українська', script: 'cyrillic', sample: 'Моє завдання',
    text: 'Привіт! Це моє домашнє завдання, написане від руки. Цей інструмент безкоштовний для всіх студентів.',
    labels: L("Ім'я", 'Номер', 'Група', 'Предмет', 'Дата', 'Викладач', 'Виконав(ла)', 'Перевірив(ла)', 'Завдання') },
  { id: 'el', name: 'Greek', native: 'Ελληνικά', script: 'greek', sample: 'Η εργασία μου',
    text: 'Γεια σας! Αυτή είναι η χειρόγραφη εργασία μου. Το εργαλείο είναι δωρεάν για όλους τους μαθητές.',
    labels: L('Όνομα', 'Αριθμός μητρώου', 'Τάξη', 'Μάθημα', 'Ημερομηνία', 'Καθηγητής', 'Υποβλήθηκε από', 'Υποβλήθηκε σε', 'Εργασία') },
  { id: 'he', name: 'Hebrew', native: 'עברית', script: 'hebrew', sample: 'העבודה שלי',
    text: 'שלום! זאת העבודה שלי בכתב יד. הכלי הזה חינמי לכל התלמידים.',
    labels: L('שם', 'מספר תלמיד', 'כיתה', 'מקצוע', 'תאריך', 'מורה', 'מגיש', 'מוגש ל', 'עבודה') },
  { id: 'es', name: 'Spanish', native: 'Español', script: 'latin', sample: 'Mi tarea',
    text: '¡Hola! Esta es mi tarea escrita a mano. Esta herramienta es gratis para todos los estudiantes.',
    labels: L('Nombre', 'Matrícula', 'Curso', 'Asignatura', 'Fecha', 'Profesor', 'Presentado por', 'Presentado a', 'Tarea') },
  { id: 'fr', name: 'French', native: 'Français', script: 'latin', sample: 'Mon devoir',
    text: 'Bonjour ! Voici mon devoir écrit à la main. Cet outil est gratuit pour tous les élèves.',
    labels: L('Nom', 'N° étudiant', 'Classe', 'Matière', 'Date', 'Professeur', 'Présenté par', 'Présenté à', 'Devoir') },
  { id: 'de', name: 'German', native: 'Deutsch', script: 'latin', sample: 'Meine Hausaufgabe',
    text: 'Hallo! Das ist meine handgeschriebene Hausaufgabe. Dieses Werkzeug ist für alle Schüler kostenlos.',
    labels: L('Name', 'Matrikelnr.', 'Klasse', 'Fach', 'Datum', 'Lehrer', 'Eingereicht von', 'Eingereicht bei', 'Hausarbeit') },
  { id: 'pt', name: 'Portuguese', native: 'Português', script: 'latin', sample: 'Meu trabalho',
    text: 'Olá! Este é o meu trabalho escrito à mão. Esta ferramenta é gratuita para todos os estudantes.',
    labels: L('Nome', 'Matrícula', 'Turma', 'Disciplina', 'Data', 'Professor', 'Apresentado por', 'Apresentado a', 'Trabalho') },
  { id: 'it', name: 'Italian', native: 'Italiano', script: 'latin', sample: 'Il mio compito',
    text: 'Ciao! Questo è il mio compito scritto a mano. Questo strumento è gratuito per tutti gli studenti.',
    labels: L('Nome', 'Matricola', 'Classe', 'Materia', 'Data', 'Docente', 'Presentato da', 'Presentato a', 'Compito') },
  { id: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', script: 'latin', sample: 'Tugas saya',
    text: 'Halo! Ini adalah tugas tulisan tangan saya. Alat ini gratis untuk semua pelajar.',
    labels: L('Nama', 'NIM', 'Kelas', 'Mata Pelajaran', 'Tanggal', 'Guru', 'Disusun oleh', 'Diajukan kepada', 'Tugas') },
  { id: 'ms', name: 'Malay', native: 'Bahasa Melayu', script: 'latin', sample: 'Tugasan saya',
    text: 'Helo! Ini ialah tugasan tulisan tangan saya. Alat ini percuma untuk semua pelajar.',
    labels: L('Nama', 'No. Matrik', 'Kelas', 'Subjek', 'Tarikh', 'Guru', 'Disediakan oleh', 'Disediakan untuk', 'Tugasan') },
  { id: 'tr', name: 'Turkish', native: 'Türkçe', script: 'latin-ext', sample: 'Ödevim',
    text: 'Merhaba! Bu benim el yazısıyla yazılmış ödevim. Bu araç tüm öğrenciler için ücretsizdir.',
    labels: L('Ad Soyad', 'Öğrenci No', 'Sınıf', 'Ders', 'Tarih', 'Öğretmen', 'Hazırlayan', 'Teslim Edilen', 'Ödev') },
  { id: 'pl', name: 'Polish', native: 'Polski', script: 'latin-ext', sample: 'Moja praca',
    text: 'Cześć! To jest moja praca domowa napisana odręcznie. To narzędzie jest darmowe dla wszystkich uczniów.',
    labels: L('Imię i nazwisko', 'Nr indeksu', 'Klasa', 'Przedmiot', 'Data', 'Nauczyciel', 'Wykonał(a)', 'Dla', 'Praca domowa') },
  { id: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', script: 'vietnamese', sample: 'Bài tập của tôi',
    text: 'Xin chào! Đây là bài tập viết tay của tôi. Công cụ này miễn phí cho tất cả học sinh.',
    labels: L('Họ tên', 'Mã số', 'Lớp', 'Môn học', 'Ngày', 'Giáo viên', 'Người thực hiện', 'Gửi tới', 'Bài tập') },
  { id: 'sw', name: 'Swahili', native: 'Kiswahili', script: 'latin', sample: 'Kazi yangu',
    text: 'Habari! Hii ni kazi yangu iliyoandikwa kwa mkono. Zana hii ni bure kwa wanafunzi wote.',
    labels: L('Jina', 'Namba ya usajili', 'Darasa', 'Somo', 'Tarehe', 'Mwalimu', 'Imewasilishwa na', 'Imewasilishwa kwa', 'Kazi') },
  { id: 'fil', name: 'Filipino', native: 'Filipino', script: 'latin', sample: 'Aking takdang-aralin',
    text: 'Kumusta! Ito ang aking sulat-kamay na takdang-aralin. Libre ang tool na ito para sa lahat ng mag-aaral.',
    labels: L('Pangalan', 'Numero', 'Seksyon', 'Asignatura', 'Petsa', 'Guro', 'Ipinasa ni', 'Ipinasa kay', 'Takdang-Aralin') },
];

export function getLanguage(id) {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}

// Which script a piece of text is mostly written in (used to suggest the
// right language when someone pastes text).
const DETECT = [
  ['urdu', /[ٹڈڑںھہے]/g],
  ['persian', /[پچژگکی]/g],
  ['arabic', /[؀-ۿ]/g],
  ['hebrew', /[֐-׿]/g],
  ['devanagari', /[ऀ-ॿ]/g],
  ['bengali', /[ঀ-৿]/g],
  ['gurmukhi', /[਀-੿]/g],
  ['gujarati', /[઀-૿]/g],
  ['tamil', /[஀-௿]/g],
  ['telugu', /[ఀ-౿]/g],
  ['kannada', /[ಀ-೿]/g],
  ['malayalam', /[ഀ-ൿ]/g],
  ['thai', /[฀-๿]/g],
  ['ja', /[぀-ヿ]/g],
  ['ko', /[가-힯ᄀ-ᇿ]/g],
  ['sc', /[一-鿿]/g],
  ['cyrillic', /[Ѐ-ӿ]/g],
  ['greek', /[Ͱ-Ͽ]/g],
  ['latin', /[A-Za-z]/g],
];

export function detectScript(text) {
  const sample = text.length > 4000 ? text.slice(0, 4000) : text;
  let best = null;
  let bestN = 0;
  for (const [script, re] of DETECT) {
    const n = (sample.match(re) || []).length;
    // Urdu / Persian letters are a subset signal inside Arabic script.
    if ((script === 'urdu' || script === 'persian') && n >= 2) return script;
    if (n > bestN) { best = script; bestN = n; }
  }
  if (best === 'sc' && /[぀-ヿ]/.test(sample)) return 'ja';
  return bestN >= 3 ? best : null;
}
