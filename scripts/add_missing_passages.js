const fs = require('fs');
const dbPath = 'data/db.json';
let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Find Strategy 1 and 2
let s1 = db.reading.find(u => u.id === 'r1').page.strategies[0];
let s2 = db.reading.find(u => u.id === 'r2').page.strategies[0];

// Full data for Strategy 1 (Figures Analysis) - Relies on charts in PDF
s1.practice = [
  {
    passageId: "r1-p1-q1",
    passageText: "PASSAGE 1\n(يرجى الرجوع إلى صفحة 4 في ملف الـ PDF للاطلاع على الرسم البياني الخاص بنسب الإنفاق في عام 1929)",
    q: "What percentage of spending was on food in 1929?",
    opts: ["10%", "15%", "24%", "27%"],
    c: 3,
    expl: "بالنظر للرسم البياني لعام 1929 لعمود Food نجد أنه وصل لـ 27%."
  },
  {
    passageId: "r1-p1-q2",
    passageText: "PASSAGE 1\n(يرجى الرجوع إلى صفحة 4 في ملف الـ PDF للاطلاع على الرسم البياني)",
    q: "In which year was the percentage of spending on transportation highest?",
    opts: ["1929", "1965", "2001", "2011"],
    c: 2,
    expl: "أعلى نسبة في قسم transportation كانت في عام 2001."
  },
  {
    passageId: "r1-p2-q1",
    passageText: "PASSAGE 2\n(يرجى الرجوع إلى صفحة 5 في ملف الـ PDF لمشاهدة رسم Homicide rates)",
    q: "What was the homicide rate per 100,000 people in Europe in 2015?",
    opts: ["2", "5", "12", "15"],
    c: 1,
    expl: "معدل جرائم القتل في أوروبا (Europe) في عام 2015 من الرسم البياني هو 5."
  },
  {
    passageId: "r1-p2-q2",
    passageText: "PASSAGE 2\n(يرجى الرجوع إلى صفحة 5 في ملف الـ PDF لمشاهدة الرسم البياني)",
    q: "How many homicides per 100,000 people happened in Africa in 2005?",
    opts: ["7", "13", "19", "24"],
    c: 3,
    expl: "في عام 2005، معدل جرائم القتل في أفريقيا كان 24."
  },
  {
    passageId: "r1-p3-q1",
    passageText: "PASSAGE 3\n(يرجى الرجوع إلى صفحة 6 في ملف الـ PDF للاطلاع على رسم pilgrims to Saudi Arabia)",
    q: "Which year had the most pilgrims to Saudi Arabia?",
    opts: ["2002", "2008", "2010", "2012"],
    c: 3,
    expl: "أعلى عمود في الرسم البياني يمثل عام 2012."
  },
  {
    passageId: "r1-p4-q1",
    passageText: "PASSAGE 4\n(يرجى الرجوع إلى صفحة 6 في ملف الـ PDF للاطلاع على رسم Investments Energy)",
    q: "Which year represents the highest wind investment?",
    opts: ["2002", "2004", "2010", "2012"],
    c: 3,
    expl: "من الرسم البياني، أعلى استثمار للرياح كان في 2012."
  },
  {
    passageId: "r1-p4-q2",
    passageText: "PASSAGE 4\n(يرجى الرجوع إلى صفحة 6 في ملف الـ PDF للاطلاع على رسم Investments Energy)",
    q: "Which year represents the lowest solar investment?",
    opts: ["2004", "2006", "2011", "2015"],
    c: 0,
    expl: "أقل نسبة استثمار في الطاقة الشمسية كانت في عام 2004."
  },
  {
    passageId: "r1-p5-q1",
    passageText: "PASSAGE 5\n(يرجى الرجوع إلى صفحة 7 في ملف الـ PDF للاطلاع على رسم INDONESIA: Palm Area Growth)",
    q: "How many hectares of palm area did the Private Estate reach by 2008?",
    opts: ["1 million", "2.3 million", "1.3 million", "3.5 million"],
    c: 3,
    expl: "في عام 2008، مؤشر الـ Private Estate وصل إلى 3.5 مليون هكتار."
  },
  {
    passageId: "r1-p5-q2",
    passageText: "PASSAGE 5\n(يرجى الرجوع إلى صفحة 7 في ملف الـ PDF للاطلاع على رسم INDONESIA: Palm Area Growth)",
    q: "What year did the Government Estate reach 500,000 hectares?",
    opts: ["1989", "1997", "2004", "2009"],
    c: 1,
    expl: "مؤشر الحكومة (Government Estate) وصل إلى 0.5 مليون (أي 500,000) هكتار في عام 1997."
  },
  {
    passageId: "r1-p6-q1",
    passageText: "PASSAGE 6\n(يرجى الرجوع إلى صفحة 7 في ملف الـ PDF للاطلاع على الرسم الخاص بمستويات المياه العذبة)",
    q: "How much did the freshwater levels decrease in Syria between 1967 and 2011?",
    opts: ["about 800 cubic meters", "about 500 cubic meters", "about 400 cubic meters", "about 250 cubic meters"],
    c: 2,
    expl: "طرح القيمة في عام 2011 من القيمة في عام 1967 لدولة سوريا يعطي انخفاضاً بحوالي 400 متر مكعب."
  },
  {
    passageId: "r1-p7-q1",
    passageText: "PASSAGE 7\n(يرجى الرجوع إلى صفحة 8 في ملف الـ PDF للاطلاع على رسم Average life expectancy)",
    q: "How much did life expectancy increase in Latin America between 1960 and 2010?",
    opts: ["almost 25 years", "almost 20 years", "almost 15 years", "almost 10 years"],
    c: 1,
    expl: "الزيادة لمتوسط العمر في Latin America من عام 1960 إلى 2010 هي حوالي 20 عاماً."
  },
  {
    passageId: "r1-p7-q2",
    passageText: "PASSAGE 7\n(يرجى الرجوع إلى صفحة 8 في ملف الـ PDF للاطلاع على الرسم)",
    q: "What was the average life expectancy at birth in Sub-Saharan Africa in 1970?",
    opts: ["about 45", "about 50", "about 55", "about 60"],
    c: 0,
    expl: "مؤشر Sub-Saharan Africa في عام 1970 يشير تقريباً إلى الرقم 45."
  },
  {
    passageId: "r1-p8-q1",
    passageText: "PASSAGE 8\n(يرجى الرجوع إلى صفحة 8 في ملف الـ PDF للاطلاع على الخريطة Where Employees Have the Most and Least Holidays)",
    q: "What was the lowest number of paid holidays for any city?",
    opts: ["4.2 days", "6.1 days", "8.0 days", "9.7 days"],
    c: 1,
    expl: "أقل رقم مدون على الخريطة لمدينة ما هو 6.1 days."
  }
];

// Full data for Strategy 2 (Meaning Technique)
s2.practice = [
  {
    passageId: "r2-p1-q1",
    passageText: "PASSAGE 1\n3) Although he was not an explorer like Christopher Columbus, Piri was an expert cartographer. He used a map of Columbus, as well as other older Arab, Chinese, Indian, Spanish and Greek maps, to create the most accurate map of the known world of that time. A small part of one of Piri’s first world maps was discovered in 1929 at the Topkapi Palace in Istanbul. It was drawn in 1513 on gazelle skin. Copies of Piri’s book and maps can be found in many libraries and museums around the world. including the Topkapi Palace, the British Museum in London, and the National Library of France in Paris.",
    q: "The word cartographer in Paragraph (3) is closest in meaning to………...",
    opts: ["ship maker", "map maker", "navigator", "Sailor"],
    c: 1,
    expl: "الكاتب يقول أنه استخدم خرائط لإنشاء خريطة دقيقة، مما يعني أن cartographer تعني صانع خرائط (map maker)."
  },
  {
    passageId: "r2-p2-q1",
    passageText: "PASSAGE 2\nAn Air India flight bound for New Delhi with 130 people onboard made an emergency landing in southern Pakistan last week due to technical problems, aviation officials said. The Airbus A320 from Abu Dhabi made the unscheduled stop at Nawabshah airport, around 230 kilometers northeast of the port city of Karachi, Pakistan.",
    q: "The word unscheduled in the passage is closest in meaning to……….",
    opts: ["not planned", "not timed", "extra", "long"],
    c: 0,
    expl: "كلمة unscheduled تعني غير مجدول أو غير مخطط له، والأقرب لها not planned."
  },
  {
    passageId: "r2-p3-q1",
    passageText: "PASSAGE 3\n1) A matryoshka doll refers to a set of dolls of decreasing word size placed one inside the other, The word a diminutive form of the Russian female first name 3 “atryoshka”, “Matryona”. The first doll set in Russia was carved in1890 by VasilyZvyozdochkin from a design by Sergey Malyutin, who was a folk crafts painter. Traditionally the outer layer is a woman, dressed in a sarafan, a long traditional Russian dress.",
    q: "The word carved in Paragraph (1) is closest in meaning to………...",
    opts: ["sourced", "planned", "shaped", "copied"],
    c: 2,
    expl: "كلمة carved تعني نحت أو شُكّل، وأقرب كلمة لها هي shaped."
  },
  {
    passageId: "r2-p4-q1",
    passageText: "PASSAGE 4\n1) All living organisms need food. They need it as a source of raw materials to build new cells and tissues as they grow. They also need food as a source of energy. Food is a kind of ‘fuel’ that drives essential living processes and brings about chemical changes. Animals take in food, digest it and use the digested products to build their tissues or to produce energy.",
    q: "What word other than ‘food’ does the writer use to talk about the need of all living things?",
    opts: ["cell", "fuel", "material", "process"],
    c: 1,
    expl: "الكاتب استخدم كلمة fuel بمعنى وقود أو مصدر طاقة ليعبر عن حاجة الكائنات للغذاء."
  },
  {
    passageId: "r2-p5-q1",
    passageText: "PASSAGE 5\n(3) Costs play an important role in setting international prices. Travelers abroad are often surprised to find that goods that are relatively inexpensive at home may carry outrageously higher price tags in other countries. A pair of Levi's selling for $30 in the United States might go for $63 in Tokyo or $88 in Paris. A McDonald's Big Mac selling for a modest $3.50 here in Saudi Arabia might cost $7.50 in Berlin, Germany. Conversely, a Gucci handbag going for only $140 in Milan, Italy. might fetch $240 in the United States. In some cases, such price escalations may result from different selling strategies or market conditions. In some instances, however, it is simply the result of the higher cost of selling in another country – the additional cost of product modifications, shipping and insurance, import taxes. exchange-rate fluctuations, and physical distribution.",
    q: "What word other than ‘inexpensive’ the writer uses to talk about prices at home?",
    opts: ["various", "modest", "additional", "competitive"],
    c: 1,
    expl: "الكاتب استخدم كلمة modest (بمعنى متواضع أو بسيط) عند وصف سعر الوجبة بأنه رخيص."
  },
  {
    passageId: "r2-p6-q1",
    passageText: "PASSAGE 6\n1) When Mikhail Gorbachev became the leader of the Soviet Union (USSR) in 1985, no one predicted that the end of Cold War was only six years away.\n2) It all began in Poland in June 1989. A non-communist party did well in the general election and people were celebrating in the streets. Everyone expected Gorbachev to send the army in, but he did nothing at all. European communist governments under the Soviet influence started to fall one by one. In autumn 1989, East Germans were knocking down the Berlin Wall. Then communist governments fell in Hungary, Czechoslovakia and in Romania the people put the president in prison.\n3) Demands for freedom soon spread to the Soviet Union and Estonia, Latvia, and Lithuania announced their freedom from Soviet control. In December 1991. Russia itself followed these three and declared independence. The USSR was finished. Gorbachev was a president without a country.",
    q: "What idea do the words “declared independence” repeat?",
    opts: ["did nothing at all", "announced their freedom", "put the president in prison", "did well in the general election"],
    c: 1,
    expl: "أعلنوا استقلالهم (declared independence) تحمل نفس فكرة عبارة announced their freedom."
  },
  {
    passageId: "r2-p7-q1",
    passageText: "PASSAGE 7\n(1) Take a moment and imagine you are traveling in a country you have never been to before. Everything about the sights, the smells, the sounds seem strange. People are speaking a language you do not understand and wearing clothes unlike yours. But they greet you with a smile and you sense that, despite the differences you observe, deep down inside these people have the same feelings as you. But is this true? Do people from opposite ends of the world really feel the same emotions? While most scholars agree that members of different cultures may vary in the foods they eat, the languages they speak, and the holidays they celebrate, there is disagreement about how much culture shapes people’s emotions and feelings including what people feel, what they express, and what they do during an emotional event.",
    q: "What idea does the expression “opposite ends of the world” in Paragraph (1) repeat?",
    opts: ["disagreement", "strange things", "different cultures", "countries not visited before"],
    c: 2,
    expl: "التعبير يشير إلى أقصى بقاع العالم، وهي عبارة تكرر فكرة الثقافات المختلفة (different cultures)."
  }
];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Fixed missing passages for Strategy 1 and 2.');
