const fs = require('fs');
const path = require('path');

const dashboardCode = fs.readFileSync(path.resolve(__dirname, '../../public/js/core/dashboard.js'), 'utf8');

describe('Dashboard Recommendation Engine (Unit Test)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.SmartAnalytics = {
      data: {
        reading: { correct: 2, total: 10 },    // 20% score
        grammar: { correct: 8, total: 10 },    // 80% score
        listening: { correct: 5, total: 10 },  // 50% score
        composition: { correct: 0, total: 0 }
      }
    };
    const script = document.createElement('script');
    script.textContent = dashboardCode;
    document.body.appendChild(script);
  });

  test('should recommend the track with the highest weighted gap', () => {
    // Gap calculations based on the weights in dashboard.js:
    // reading: 0.40 * (1 - 0.20) = 0.40 * 0.80 = 0.32
    // grammar: 0.30 * (1 - 0.80) = 0.30 * 0.20 = 0.06
    // listening: 0.20 * (1 - 0.50) = 0.20 * 0.50 = 0.10
    // composition: 0.10 * (1 - 0) = 0.10
    // The highest gap is "reading" (0.32)
    
    // We expect the function `getRecommendedFocus` (defined in dashboard.js) to return 'reading'
    const recommendation = window.getRecommendedFocus();
    
    // In our localized text, the tracks map as follows:
    // 'reading' -> 'فهم المقروء'
    expect(recommendation).toBe('فهم المقروء');
  });
});
