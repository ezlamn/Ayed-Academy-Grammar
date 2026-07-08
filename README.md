# Ayed Academy - STEP English Preparation Platform

This repository contains the **Frontend** Single Page Application (SPA) for the Ayed Academy STEP preparation platform. 

Currently, the project is in a **Frontend-Only** architecture state to facilitate a clean handoff to the Backend development phase. 

## Project Structure & Architecture

- **`index.html`**: The main entry point. It loads all UI elements and scripts.
- **`public/js/`**: Contains all frontend logic, structured cleanly:
  - **`core/`**: Essential logic (`dataService.js`, `app.js`, `state.js`, `dashboard.js`, `auth.js`, `analytics.js`).
    - **`dataService.js`** is the **Abstraction Layer** for all data access. It handles fetching data from mock JSON files and uses IndexedDB locally to save student progress. No other file should call `fetch()` or `indexedDB` directly.
  - **`features/`**: Feature-specific logic (`gamification.js`, `quiz.js`, `interactive.js`, `units.js`, `mock_exam.js`).
  - **`ui/`**: Visual logic (`renderers.js`, `ui.js`, `icons.js`, `anim-explainer.js`, etc.).
- **`public/data/`**: Contains mock JSON files representing the future API endpoints.
- **`DATA_CONTRACTS.md`**: Defines the exact JSON schemas that the Backend API should eventually return.

## Frontend Handoff Instructions for Backend Developer

1. **Do NOT rewrite the UI.** The frontend logic is deeply integrated with the UI (confetti, streaks, SVG icons, audio players).
2. **Implement APIs according to `DATA_CONTRACTS.md`.**
3. **Connect APIs in `dataService.js`.** 
   - Replace the local `fetch('/public/data/...')` calls with real `fetch('/api/...')` endpoints.
   - For `saveGamification` and `saveProfile`, add `POST` requests to your backend instead of (or in addition to) the local `IndexedDB` caching.
4. **Remove or secure `IndexedDB`**: Once the backend handles user data, you can phase out IndexedDB or keep it only as an offline cache.

## Features Currently Mocked Locally

- **Student Profile & XP**: Saved to IndexedDB via `dataService.js`.
- **Tracks (Grammar, Reading, Listening, Composition, Vocab)**: Loaded from `/public/data/*/index.json`.
- **Weighted Recommendation Engine**: Evaluates weak points based on STEP exam weights (Reading 40%, Grammar 30%, Listening 20%, Composition 10%).

## Setup and Run

To run the application locally, you just need a static file server:

```bash
# Using Node.js / npx
npx serve .

# OR using Python
python -m http.server 8000
```

Open your browser to `http://localhost:8000`.
