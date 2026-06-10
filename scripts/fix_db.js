const fs = require('fs');

const dbPath = 'data/db.json';
let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// We will map over db.reading and fix the strategies
db.reading.forEach((unit, index) => {
  if (!unit.page.strategies) return;
  
  if (unit.id === 'r3' && unit.title.includes('Third')) { // Referring Technique
    unit.page.strategies[0].usage = "هذا التكنيك يتناول السؤال بكلمة او عبارة او ضمير تم وضعه في القطعة ويطلب منك الى اي اختيار يعود هذا الضمير.\nصيغة السؤال:\nThe word\\pronoun (it) in paragraph (2) refers to...\n\nمراحل الحل:\n1. نوع الضمير: تحديده من ناحية المفرد والجمع.\n2. تحديد نطاق البحث: الضمير يعود على كلمة في الجملة التي قبله.\n3. السياق: يتطلب فهم السياق وترجمته.";
    unit.page.strategies[0].keywords = [
      { f: "It - its", b: "مفرد غير عاقل" },
      { f: "They - their - them", b: "جمع (عاقل أو غير عاقل)" },
      { f: "there", b: "يعود على مكان" }
    ];
    // Fix answers
    const p = unit.page.strategies[0].practice;
    if (p[0]) { p[0].c = 3; p[0].expl = "تعود على joint committee"; }
    if (p[1]) { p[1].c = 3; p[1].expl = "themselves تعود على farmers"; }
    if (p[2]) { p[2].c = 1; p[2].expl = "it تعود على water"; }
    if (p[3]) { p[3].c = 1; p[3].expl = "it تعود على deafness"; }
    if (p[4]) { p[4].c = 0; p[4].expl = "it تعود على peso"; }
    if (p[5]) { p[5].c = 0; p[5].expl = "they تعود على Ants"; }
    if (p[6]) { p[6].c = 2; p[6].expl = "there تعود على Italy"; }
    if (p[7]) { p[7].c = 2; p[7].expl = "it تعود على the unknown substance"; }
  }
  
  if (unit.id === 'r4') { // Conjunctions
    unit.page.strategies[0].usage = "تأتي الروابط بطريقتين:\nالطريقة الأولى: بيسأل عن معنى الرابط ويمكن حفظ الجدول للتسهيل.\nWhich word can we use to replace the word...in paragraph...?";
    unit.page.strategies[0].keywords = [
      { f: "Because / Due to", b: "Since / Because of (لأن - بسبب)" },
      { f: "While", b: "Although (رغم أن)" },
      { f: "For example / as well", b: "For instance / too (على سبيل المثال / بالإضافة إلى)" },
      { f: "Then", b: "after that (بعد ذلك)" }
    ];
    // Fix answers
    const p = unit.page.strategies[0].practice;
    if (p[0]) { p[0].c = 2; p[0].expl = "because يمكن استبدالها بـ since"; }
    if (p[1]) { p[1].c = 3; p[1].expl = "due to يمكن استبدالها بـ because of"; }
    if (p[2]) { p[2].c = 1; p[2].expl = "while يمكن استبدالها بـ although"; }
    if (p[3]) { p[3].c = 3; p[3].expl = "for example يمكن استبدالها بـ for instance"; }
    if (p[4]) { p[4].c = 0; p[4].expl = "in addition تعني الإضافة"; }
    if (p[5]) { p[5].c = 3; p[5].expl = "as well يمكن استبدالها بـ too"; }
    if (p[6]) { p[6].c = 3; p[6].expl = "then يمكن استبدالها بـ after that"; }
  }

  if (unit.id === 'r5') { // Direct Questions
    unit.page.strategies[0].usage = "استخراج المعلومات المباشرة من القطعة.\nرأس السؤال عبارة عن جزئين (جزء كلمة استفهامية – المعلومة المطلوبة)\n1. المسح: تحديد مكان المعلومة في القطعة.\n2. المطابقة: مطابقة المعلومة بين السؤال والقطعة.";
    unit.page.strategies[0].keywords = [
      { f: "When / Where / Who", b: "متى / أين / من" },
      { f: "Why / Which", b: "لماذا / أي" },
      { f: "How Much / Many / Long / Old", b: "كم التكلفة / العدد / المدة / العمر" },
      { f: "NOT mentioned / EXCEPT", b: "الاستخراج العكسي (يسأل عن المعلومة التي لم يتم ذكرها)" }
    ];
    const p = unit.page.strategies[0].practice;
    if (p[0]) { p[0].c = 3; p[0].expl = "العدد المذكور هو 586 chemicals"; }
    if (p[1]) { p[1].c = 1; p[1].expl = "مصادر الـ VOCs المذكورة هي photocopiers and computers"; }
    if (p[2]) { p[2].c = 1; p[2].expl = "النباتات استخدمت بنجاح في in a business center in India"; }
    if (p[3]) { p[3].c = 1; p[3].expl = "بدأت في France"; }
  }

  if (unit.id === 'r6') { // Purpose
    unit.page.strategies[0].usage = "الغرض من القطعة (what is the purpose of the passage? / why did the writer write the passage?)\nإذا كتب الكاتب هذه القطعة؟\nنبحث في الاختيارات عن واحدة من هذه الكلمات:\nto inform – to give information – to describe – to explain";
    unit.page.strategies[0].keywords = [
      { f: "to inform", b: "لإعلام (عند وجود أكثر من كلمة نختارها)" },
      { f: "to describe", b: "لوصف" },
      { f: "to explain", b: "لشرح" }
    ];
    const p = unit.page.strategies[0].practice;
    if (p[0]) { p[0].c = 2; p[0].expl = "الغرض إعلامي (to inform)"; }
    if (p[1]) { p[1].c = 3; p[1].expl = "الغرض إعلامي (to inform)"; }
    if (p[2]) { p[2].c = 1; p[2].expl = "الغرض إعلامي (to inform)"; }
    if (p[3]) { p[3].c = 1; p[3].expl = "الغرض الوصف (to describe)"; }
  }

  if (unit.id === 'r7') { // Opinion
    unit.page.strategies[0].usage = "ما هو الاختيار الذي يعبّر عن رأي؟ (Which one of the following is an opinion?)\nنقوم بعمل مسح سريع للقطعة ونبحث عن واحدة من هذه الكلمات الدالة على الرأي، ثم نربط بين الرأي الموجود في القطعة والاختيارات.";
    unit.page.strategies[0].keywords = [
      { f: "say - hard to say", b: "يقول - من الصعب القول" },
      { f: "believe - suggest", b: "يعتقد - يقترح" },
      { f: "argue - point out", b: "يجادل - يوضح" },
      { f: "think - expect - predict", b: "يفكر - يتوقع - يتنبأ" }
    ];
    const p = unit.page.strategies[0].practice;
    if (p[0]) { p[0].c = 0; p[0].expl = "توقع: will continue to grow"; }
    if (p[1]) { p[1].c = 3; p[1].expl = "يعتقد أن: could spread across the world in one day"; }
    if (p[2]) { p[2].c = 3; p[2].expl = "أشار المؤرخون أن: Nobody won the Cold War"; }
  }

  if (unit.id === 'r8') { // Deduction
    unit.page.strategies[0].title = "Deduction & Analysis (الفهم والاستنتاج)";
    unit.page.strategies[0].usage = "في هذا النوع من الأسئلة، الاحتياج للمعنى بيزيد.\nالإجابة الموجودة في القطعة ليست موجودة نصاً في الاختيارات ولكن هناك إجابة في الاختيارات تعطي نفس المعنى.\nالخطوة الأولى: فهم وتحليل المعلومات المذكورة في القطعة.\nالخطوة الثانية: موافقة إجابة القطعة بإحدى الخيارات.";
    const p = unit.page.strategies[0].practice;
    if (p[0]) { p[0].c = 2; p[0].expl = "8 شهور + 10 شهور = 18 شهراً"; }
    if (p[1]) { p[1].c = 1; p[1].expl = "لتخثر الدم وإيقاف النزيف"; }
  }

  if (unit.id === 'r9') { // One Important Idea
    unit.page.strategies[0].title = "One Important Idea (الفكرة المحورية)";
    unit.page.strategies[0].usage = "ما هي أهم فكرة الكاتب ذكرها؟ (What is one important idea that the writer mentions?)\n1. نحدد نطاق البحث إذا حدد البرقراف.\n2. نقرأ القطعة جيداً.\n3. نختار الفكرة المحورية التي ركّز عليها الكاتب وليست مجرد معلومة فرعية.";
    const p = unit.page.strategies[0].practice;
    if (p[0]) { p[0].c = 1; p[0].expl = "الفكرة المحورية الأولى هي نقص فيتامين أ"; }
    if (p[1]) { p[1].c = 3; p[1].expl = "الموز المعدل وراثياً ينقذ الحياة"; }
    if (p[2]) { p[2].c = 3; p[2].expl = "العمال عملوا بجد"; }
  }

  if (unit.id === 'r10' || unit.title.includes('Tenth')) { // Title, main idea
    unit.page.strategies[0].title = "Title, main idea, and topic (الفكرة الرئيسية)";
    unit.page.strategies[0].usage = "لما السؤال يطلب مني العنوان أو الموضوع أو الفكرة الرئيسية فهو يطلب فهم عام للقطعة.\n- الفهم العام: عنوان القطعة هو الفكرة المسيطرة على القطعة من البداية حتى النهاية (الشاملة).\n- إذا أي اقتباس مباشر (تفصيلة) نستبعدها.\n- كلمة history تأتي مع القطع اللي بتتكلم عن تسلسل زمني.";
    const p = unit.page.strategies[0].practice;
    if (p[0]) { p[0].c = 1; p[0].expl = "القطعة تتحدث عن التسلسل الزمني لظهور الآيسكريم"; }
    if (p[1]) { p[1].c = 3; p[1].expl = "الاجتماعات تحتاج لتنظيم"; }
    if (p[2]) { p[2].c = 3; p[2].expl = "تصنيف النجوم بناء على اللون والحجم"; }
  }
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Fixed reading data in db.json!');
