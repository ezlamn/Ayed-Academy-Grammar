const fs = require('fs');
const path = require('path');

// Dummy audio URL for the sake of the interface
const DUMMY_AUDIO = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const listeningData = [
  {
    id: 1,
    emoji: "🎧",
    nameAr: "مقدمة وتعليمات عامة",
    nameEn: "Intro & Instructions",
    page: {
      tag: "الوحدة الأولى",
      mascot: "📚",
      strategies: [
        {
          id: "L1S1",
          theme: "sc-theme-blue",
          icon: "💡",
          title: "تعليمات عامة عن قسم الاستماع",
          subtitle: "General Instructions",
          badge: "Info",
          usage: "ترتيب القسم: الأول من الاختبار | عدد الأسئلة: 20 سؤال | مدة القسم: 25 دقيقة.",
          keywords: [
            { f: "Conversation (محادثة)", b: "بين شخصين" },
            { f: "Presentation (عرض تقديمي)", b: "عن موضوع او منتج معين" },
            { f: "Lecture (محاضرة)", b: "عن موضوع معين" }
          ],
          formulas: [
            { subj: "تأكد من", form: "وضع سماعات الأذن بشكل صحيح", ex: "تجنب أي ضوضاء من المكان." },
            { subj: "استمع جيدا", form: "يبدأ المقطع الصوتي تلقائيا ولمرة واحدة فقط", ex: "لا تقم بالإجابة على الأسئلة الا بعد انتهاء المقطع" }
          ],
          practice: []
        },
        {
          id: "L1S2",
          theme: "sc-theme-gold",
          icon: "🤫",
          title: "فترة الصمت والتهيئة الذهنية",
          subtitle: "Benefit of Silence",
          badge: "Strategy 1",
          usage: "بعد معرفة محتوى المقطع الصوتي، تكون هناك فترة صمت لتهيئة عقلك جيدا وتكون مدتها بين 15 إلى 60 ثانية.",
          formulas: [
            { subj: "15 ثانية", form: "سؤال واحد", ex: "على المقطع الصوتي" },
            { subj: "30 ثانية", form: "سؤالين", ex: "على المقطع الصوتي" },
            { subj: "45 ثانية", form: "3 أسئلة", ex: "على المقطع الصوتي" }
          ],
          exception: {
            title: "عليك الاستفادة من فترة الصمت جيدا عن طريق:",
            body: "1. قراءة الأسئلة لمعرفة المعلومة المطلوبة.<br>2. اثناء قراءة الأسئلة ركز جيدا على الكلمات المفتاحية مثل: (where - when - how many - who - what - why)<br>3. قراءة الاختيارات لمساعدة عقلك في الربط بين الإجابة الموجودة في المقطع وبين احدى الخيارات."
          },
          practice: []
        }
      ],
      quizzes: []
    }
  },
  {
    id: 2,
    emoji: "🎯",
    nameAr: "مقاطع السؤال والمقاطع المتعددة",
    nameEn: "Single & Multiple Questions",
    page: {
      tag: "الوحدة الثانية",
      mascot: "🎙️",
      strategies: [
        {
          id: "L2S1",
          theme: "sc-theme-red",
          icon: "1️⃣",
          title: "مقاطع السؤال الواحد",
          subtitle: "Single Question Clips",
          badge: "Strategy 2",
          usage: "يكون دائما سؤال مباشر. نقوم بقراءة السؤال لتحديد المعلومة المطلوبة و قراءة الاختيارات ثم انتظار تقصي المعلومة من المقطع الصوتي.",
          practice: [
            {
              audioUrl: DUMMY_AUDIO,
              q: "What kind of project is Osama Working on?",
              opts: ["A current events project", "A business project", "A family project", "A history project"],
              c: 3,
              expl: "كما ستسمع في المقطع الصوتي، المشروع الذي يعمل عليه أسامة هو History project."
            },
            {
              audioUrl: DUMMY_AUDIO,
              q: "What is the favorite sport?",
              opts: ["football", "baseball", "handball", "tennis"],
              c: 1,
              expl: "الإجابة الصحيحة بناءً على الحوار هي baseball."
            },
            {
              audioUrl: DUMMY_AUDIO,
              q: "In what subject does Salah have an examination?",
              opts: ["Geology", "Psychology", "Biology", "Chemistry"],
              c: 1,
              expl: "ملاحظة: لو لقيت كلمة تبدأ بـ (Ps) لا ننطق الـ (P). المادة هي Psychology."
            }
          ]
        },
        {
          id: "L2S2",
          theme: "sc-theme-teal",
          icon: "🔢",
          title: "مقاطع الأسئلة المتعددة",
          subtitle: "Multiple Questions Clips",
          badge: "Strategy 3",
          usage: "هنا نحتاج لتدريب العقل على الانتقاء (الفلترة) حيث نركز على المعلومات التي يسأل عنها في رأس السؤال فقط وليس كل المعلومات الموجودة في المقطع الصوتي.",
          practice: [
            {
              audioUrl: DUMMY_AUDIO,
              q: "How much did travelers spend in 1990?",
              opts: ["4.2 trillion dollars", "3.2 trillion dollars", "41.3 million dollars", "46.3 million dollars"],
              c: 1,
              expl: "نركز على الرقم الذي يخص عام 1990 وهو 3.2 trillion dollars."
            },
            {
              audioUrl: DUMMY_AUDIO,
              q: "What is the most popular country people go to?",
              opts: ["France", "U.S.A", "Spain", "China"],
              c: 0,
              expl: "البلد الأكثر شعبية المذكور هو فرنسا."
            }
          ]
        }
      ],
      quizzes: []
    }
  },
  {
    id: 3,
    emoji: "📍",
    nameAr: "أسئلة المكان والزمان",
    nameEn: "Location & Time",
    page: {
      tag: "الوحدة الثالثة",
      mascot: "🗺️",
      strategies: [
        {
          id: "L3S1",
          theme: "sc-theme-blue",
          icon: "📍",
          title: "مقاطع السؤال عن المكان",
          subtitle: "Location Questions",
          badge: "Strategy 4",
          usage: "سؤال عن مكان حدوث المحادثة. المكان لا يقال صراحة، ولكن نستنتج ذلك من السياق حسب الكلمات الموجودة في المقطع.",
          exception: {
            title: "مثال توضيحي",
            body: "\"Could you bring me the menu, please?\"<br>\"Sure, would you like to order now?\"<br>هذا يدل بوضوح على أن المكان هو مطعم (Restaurant)."
          },
          practice: [
            {
              audioUrl: DUMMY_AUDIO,
              q: "The conversation most likely takes place …………",
              opts: ["In a grocery store", "In a restaurant", "In a house", "In a train"],
              c: 1,
              expl: "بناءً على طلب قائمة الطعام والطلب، المحادثة في مطعم."
            },
            {
              audioUrl: DUMMY_AUDIO,
              q: "Where might you hear this?",
              opts: ["A school", "An office", "A hospital", "A barber shop"],
              c: 0,
              expl: "الكلمات الدالة مثل teacher و students تدل على المدرسة."
            }
          ]
        },
        {
          id: "L3S2",
          theme: "sc-theme-purple",
          icon: "⏱️",
          title: "مقاطع السؤال عن الزمان",
          subtitle: "Time Questions",
          badge: "Strategy 5",
          usage: "سؤال عن الزمان الذي تحدث فيه المحادثة. لا يقول الوقت صراحة، و لكن نستنتج ذلك من التحية (مثل Good morning تعني in the morning).",
          practice: [
            {
              audioUrl: DUMMY_AUDIO,
              q: "The conversation takes place in the …………….",
              opts: ["Morning", "Afternoon", "Evening", "Night"],
              c: 1,
              expl: "المتحدث قال Good afternoon، إذن الوقت هو Afternoon."
            }
          ]
        }
      ],
      quizzes: [
        {
          audioUrl: DUMMY_AUDIO,
          q: "What is the location of the Panama Canal?",
          opts: ["South American country of Panama", "Central American country of Panama", "North American country of Panama", "East American country of Panama"],
          c: 1,
          expl: "Central American country of Panama."
        },
        {
          audioUrl: DUMMY_AUDIO,
          q: "How long is the Panama Canal?",
          opts: ["80 kilometers", "83 kilometers", "82 kilometers", "90 kilometers"],
          c: 2,
          expl: "طول القناة 82 كيلومتراً."
        }
      ]
    }
  },
  {
    id: 4,
    emoji: "🧠",
    nameAr: "أسئلة الفهم والاستنتاج والمعاني",
    nameEn: "Inference & Meaning",
    page: {
      tag: "الوحدة الرابعة",
      mascot: "💡",
      strategies: [
        {
          id: "L4S1",
          theme: "sc-theme-red",
          icon: "🔎",
          title: "مقاطع السؤال عن معاني الكلمات والتعبيرات",
          subtitle: "Advanced Strategies - Meaning",
          badge: "Strategy 6",
          usage: "يقول كلمة او تعبير معين في المقطع الصوتي ثم يطلب منك معناه. والاجابة أو المعنى يقوله بعد الكلمة التي يسأل عن معناها مباشرة.",
          practice: [
            {
              audioUrl: DUMMY_AUDIO,
              q: "In the conversation, the word “focus” is closest in meaning to………….",
              opts: ["separate", "concentrate", "participate", "delegate"],
              c: 1,
              expl: "focus تعني يركز، وهي مرادفة لـ concentrate."
            },
            {
              audioUrl: DUMMY_AUDIO,
              q: "The phrase “It’s anyone’s guess” is closest in meaning to…………….",
              opts: ["Everyone can be sure", "Only the office can be sure", "No one can be sure", "Anyone can be sure"],
              c: 2,
              expl: "عبارة It’s anyone’s guess تعني أنه لا أحد يعرف الإجابة بالتأكيد (No one can be sure)."
            }
          ]
        },
        {
          id: "L4S2",
          theme: "sc-theme-green",
          icon: "🧠",
          title: "مقاطع السؤال عن الفهم - الاستنتاج",
          subtitle: "Inference Questions",
          badge: "Strategy 7",
          usage: "الإجابة التي يتم سماعها في المقطع الصوتي غير موجوده نصاً في الاختيارات ولكن نستنتج الاختيار الذي يُعطي نفس المعنى للإجابة.",
          practice: [
            {
              audioUrl: DUMMY_AUDIO,
              q: "What can we understand about Lisa?",
              opts: ["she is not busy.", "she is married.", "she is single.", "she is worried."],
              c: 1,
              expl: "من سياق الحديث عن زوجها نستنتج أنها متزوجة (she is married)."
            }
          ]
        },
        {
          id: "L4S3",
          theme: "sc-theme-blue",
          icon: "💡",
          title: "مقاطع السؤال عن الفكرة الرئيسية",
          subtitle: "Main Idea Questions",
          badge: "Strategy 8",
          usage: "في هذا النوع من الأسئلة، يختبر قدرة الطالب على فهم الفكرة الأساسية أو الهدف من الحوار، و ليس عن رقم أو معلومة أو كلمة محددة.",
          practice: [
            {
              audioUrl: DUMMY_AUDIO,
              q: "What is the main idea of the recording?",
              opts: ["How to lose weight quickly.", "The importance of having a balanced and healthy lifestyle.", "Why sleep is more important than exercise.", "How to avoid going to the doctor."],
              c: 1,
              expl: "الهدف العام كان أهمية نمط الحياة الصحي والمتوازن."
            }
          ]
        }
      ],
      quizzes: []
    }
  }
];

const dbPath = path.join(__dirname, 'data', 'db.json');
try {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  data.listening = listeningData;
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  console.log('Listening Track has been populated successfully!');
} catch (e) {
  console.error('Failed to populate listening track:', e);
}
