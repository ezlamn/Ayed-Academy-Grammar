const fs = require('fs');
const path = require('path');

const analyticsCode = fs.readFileSync(path.resolve(__dirname, '../../public/js/core/analytics.js'), 'utf8');

describe('Smart Analytics Engine (Unit Test)', () => {
  beforeEach(() => {
    // Reset DOM and localStorage
    document.body.innerHTML = '';
    localStorage.clear();
    // Load script into global context
    eval(analyticsCode);
  });

  test('should initialize data correctly if empty', () => {
    expect(window.SmartAnalytics.data).toBeDefined();
    expect(window.SmartAnalytics.data.grammar).toEqual({ correct: 0, total: 0 });
  });

  test('should record correct answers properly', () => {
    window.SmartAnalytics.record('reading', true);
    expect(window.SmartAnalytics.data.reading.total).toBe(1);
    expect(window.SmartAnalytics.data.reading.correct).toBe(1);
    expect(JSON.parse(localStorage.getItem('gs_analytics')).reading.total).toBe(1);
  });

  test('should record incorrect answers properly', () => {
    window.SmartAnalytics.record('grammar', false);
    expect(window.SmartAnalytics.data.grammar.total).toBe(1);
    expect(window.SmartAnalytics.data.grammar.correct).toBe(0);
  });
});
