# 📜 DATA CONTRACTS (API SCHEMA)

This document defines the exact JSON schema that the future Backend API must return. The frontend relies strictly on these contracts via the `dataService.js` abstraction layer.

## 1. Track Index API
**Mock Path:** `/public/data/{trackId}/index.json`
**Future API:** `GET /api/units?track={trackId}`

**Response:** Array of objects.
```json
[
  {
    "id": 1,
    "nameAr": "الأزمنة",
    "nameEn": "Tenses",
    "emoji": "⏱️"
  }
]
```

## 2. Unit Detail API
**Mock Path:** `/public/data/{trackId}/unit-{unitId}.json`
**Future API:** `GET /api/units/{unitId}?track={trackId}`

**Response:** Object representing a full unit.
### Grammar Track Schema:
```json
{
  "id": 1,
  "emoji": "⏱️",
  "nameAr": "الأزمنة",
  "nameEn": "Tenses",
  "page": {
    "tag": "الوحدة الأولى",
    "mascot": "📅",
    "strategies": [
      {
        "id": "u1s1",
        "title": "المضارع البسيط",
        "subtitle": "Present Simple",
        "badge": "Tense 1/6",
        "usage": "يُعبِّر عن حقائق علمية...",
        "keywords": ["always", "usually"],
        "rule": "Subject + V1 (s/es)",
        "examples": [
          { "en": "He plays tennis.", "ar": "هو يلعب التنس." }
        ],
        "quiz": [
          {
            "q": "She ___ to school every day.",
            "options": ["go", "goes", "going", "gone"],
            "correct": 1,
            "expl": "الفاعل مفرد غائب، فنضيف es"
          }
        ]
      }
    ]
  }
}
```

### Reading Track Schema:
```json
{
  "id": 101,
  "nameAr": "القطع القصيرة",
  "nameEn": "Short Passages",
  "emoji": "📄",
  "page": {
    "tag": "قسم القراءة",
    "passages": [
      {
        "passageText": "The history of the world...",
        "imgUrl": "/uploads/image.png",
        "layout": "split",
        "quiz": [
          {
            "q": "What is the main idea?",
            "options": ["History", "Geography", "Math", "Science"],
            "correct": 0,
            "expl": "The passage discusses history."
          }
        ]
      }
    ]
  }
}
```

### Listening Track Schema:
```json
{
  "id": 201,
  "nameAr": "المحادثات اليومية",
  "nameEn": "Daily Conversations",
  "emoji": "🎧",
  "page": {
    "tag": "قسم الاستماع",
    "audios": [
      {
        "audioUrl": "/uploads/audio1.mp3",
        "transcript": "Hello, how are you?",
        "quiz": [
          {
            "q": "What did the man say?",
            "options": ["Hello", "Goodbye", "Yes", "No"],
            "correct": 0,
            "expl": "He said hello."
          }
        ]
      }
    ]
  }
}
```

### Tests (Mock Exams) Schema:
```json
{
  "id": "mock1",
  "nameAr": "النموذج التجريبي الأول",
  "nameEn": "Mock Exam 1",
  "emoji": "📝",
  "sections": {
    "reading": [ /* List of questions */ ],
    "grammar": [ /* List of questions */ ],
    "listening": [ /* List of questions */ ],
    "composition": [ /* List of questions */ ]
  }
}
```

## 3. Student Progress & Profile
*(Currently handled by IndexedDB locally, but ready for `POST/GET` mapping in `dataService.js`)*

### Profile
```json
{
  "id": "main",
  "name": "طالب STEP",
  "completedUnits": [1, 2, "u1s1"]
}
```

### Gamification
```json
{
  "id": "main",
  "xp": 1500,
  "level": 3,
  "streak": 5,
  "bestStreak": 10,
  "lastActive": "2023-10-01",
  "bestCombo": 5
}
```
