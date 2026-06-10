const fs = require('fs');

const dbPath = 'data/db.json';
let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

db.reading = [
  {
    id: "r1",
    title: "First Strategy: Figures Analysis",
    type: "reading_strategy",
    page: {
      strategies: [
        {
          id: "rs1",
          theme: "sc-theme-blue",
          icon: "📊",
          title: "Figures Analysis (تحليل الرسوم البيانية)",
          subtitle: "First Strategy",
          usage: "كيفية التعامل مع الرسوم البيانية والجداول والإحصاءات:\n1. الفئة المراد تقييمها (مثل: أنواع الرياضات)\n2. السنة التي يتم فيها التقييم\n3. قيمة هذه الفئة",
          keywords: [
            { f: "the most - highest - largest", b: "القيمة الأكثر" },
            { f: "the least - lowest - fewest", b: "القيمة الأقل" },
            { f: "between", b: "الفارق بين قيمتين" }
          ],
          practice: [
            {
              passageId: "p1",
              passageText: "Look at the chart showing the percentage of spending in 1929, 1965, and 2001.",
              imgUrl: "public/uploads/chart1.jpg", // Just a placeholder if we want to add images later
              q: "What percentage of spending was on food in 1929?",
              opts: ["10%", "15%", "24%", "27%"],
              c: 3,
              expl: "بالنظر للرسم البياني في عام 1929 (اللون الغامق) لعمود Food، نجد أنه يتجاوز 25% ليصل لـ 27%."
            },
            {
              passageId: "p2",
              passageText: "Look at the same chart regarding transportation.",
              imgUrl: "",
              q: "In which year was the percentage of spending on transportation highest?",
              opts: ["1929", "1965", "2001", "2011"],
              c: 2, // 2001
              expl: "العمود الأعلى في قسم Transportation هو باللون الأسود والذي يمثل عام 2001."
            }
          ]
        }
      ]
    }
  },
  {
    id: "r2",
    title: "Second Strategy: Meaning Technique",
    type: "reading_strategy",
    page: {
      strategies: [
        {
          id: "rs2",
          theme: "sc-theme-red",
          icon: "📖",
          title: "Meaning Technique (أسئلة المعاني)",
          subtitle: "Second Strategy",
          usage: "تقسم هذه الاستراتيجية لنوعين: \n1. سؤال عن كلمة ومطلوب أقرب معنى لها (The word ... is closest in meaning to ...)\n2. سؤال عن عبارة لها نفس الفكرة المذكورة بالقطعة.",
          practice: [
            {
              passageId: "p3",
              passageText: "Although he was not an explorer like Christopher Columbus, Piri was an expert cartographer. He used a map of Columbus, as well as other older Arab, Chinese, Indian, Spanish and Greek maps, to create the most accurate map of the known world of that time. A small part of one of Piri’s first world maps was discovered in 1929 at the Topkapi Palace in Istanbul. It was drawn in 1513 on gazelle skin. Copies of Piri’s book and maps can be found in many libraries and museums around the world. including the Topkapi Palace, the British Museum in London, and the National Library of France in Paris.",
              q: "The word cartographer in Paragraph (3) is closest in meaning to………...",
              opts: ["ship maker", "map maker", "navigator", "Sailor"],
              c: 1,
              expl: "الكاتب يقول أنه استخدم خرائط لإنشاء خريطة دقيقة، مما يعني أن cartographer تعني صانع خرائط (map maker)."
            },
            {
              passageId: "p4",
              passageText: "An Air India flight bound for New Delhi with 130 people onboard made an emergency landing in southern Pakistan last week due to technical problems, aviation officials said. The Airbus A320 from Abu Dhabi made the unscheduled stop at Nawabshah airport, around 230 kilometers northeast of the port city of Karachi, Pakistan.",
              q: "The word unscheduled in the passage is closest in meaning to……….",
              opts: ["not planned", "not timed", "extra", "long"],
              c: 0,
              expl: "كلمة unscheduled تعني غير مجدول أو غير مخطط له، والأقرب لها not planned."
            }
          ]
        }
      ]
    }
  },
  {
    id: "r3",
    title: "نماذج الكلمات (Vocabulary Models)",
    type: "vocab",
    page: {
      vocabCategories: [
        {
          title: "Model 5 & 6",
          color: "#0891b2",
          words: [
            { en: "Cartographer", ar: "صانع الخرائط" },
            { en: "Unscheduled", ar: "غير مخطط" },
            { en: "Carved", ar: "نحت - شكّل" },
            { en: "Expedition", ar: "رحلة شاقة" },
            { en: "Equilibrium", ar: "توازن" },
            { en: "Crucial", ar: "هام - ضروري" }
          ]
        },
        {
          title: "Model 7 & 8",
          color: "#059669",
          words: [
            { en: "Essential", ar: "ضروري" },
            { en: "Clues", ar: "علامات" },
            { en: "Dozing", ar: "نائم" },
            { en: "Effortless", ar: "بدون جهد" },
            { en: "Pleased", ar: "مسرور" },
            { en: "Legend", ar: "أسطورة" }
          ]
        }
      ]
    }
  }
];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Successfully added reading data to db.json');
