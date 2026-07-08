// Smart Analytics Engine
window.SmartAnalytics = {
  data: JSON.parse(localStorage.getItem('gs_analytics')) || {
    grammar: { correct: 0, total: 0 },
    reading: { correct: 0, total: 0 },
    listening: { correct: 0, total: 0 }
  },

  record: function(category, isCorrect) {
    if (!this.data[category]) this.data[category] = { correct: 0, total: 0 };
    this.data[category].total++;
    if (isCorrect) this.data[category].correct++;
    localStorage.setItem('gs_analytics', JSON.stringify(this.data));
  },

  getAdvice: function() {
    let advice = [];
    for (let cat in this.data) {
      const stats = this.data[cat];
      if (stats.total > 5) {
        const percent = stats.correct / stats.total;
        if (percent < 0.5) {
          advice.push(`⚠️ أداؤك في قسم (${cat}) يحتاج إلى تطوير (نسبة نجاحك ${Math.round(percent*100)}%). ننصحك بمراجعة استراتيجياته مرة أخرى.`);
        } else if (percent > 0.8) {
          advice.push(`⭐ أداؤك ممتاز جداً في قسم (${cat})! استمر على هذا المستوى.`);
        }
      }
    }
    if (advice.length === 0) return "قم بحل المزيد من التدريبات أو الاختبارات للحصول على تحليل ذكي لمستواك.";
    return advice.join('<br><br>');
  },

  renderDashboardStats: function() {
    const dashContainer = document.getElementById('analytics-container');
    if (!dashContainer) return;
    
    // Check if we have any data
    const totalQuestions = Object.values(this.data).reduce((acc, curr) => acc + curr.total, 0);
    const totalCorrect = Object.values(this.data).reduce((acc, curr) => acc + curr.correct, 0);
    const overallPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    
    const advice = this.getAdvice();
    
    let html = `
      <div class="dash-card" style="margin-top: 2rem; cursor: default; text-align: right; max-width: 100%;">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
          <div>
            <h3 style="color: var(--text-primary); font-size:1.25rem; margin-bottom:0.4rem; display:flex; align-items:center; gap:8px;">
              <span style="color:var(--accent);">${window.getIcon ? window.getIcon('target') : '🎯'}</span>
              التحليل الذكي لمستواك
            </h3>
            <p style="color: var(--text-muted); font-size:0.9rem; max-width:600px;">
              إجمالي الإنجاز: <strong style="color:var(--text-primary); font-family:var(--ff-en);">${overallPct}%</strong> 
              (${totalCorrect}/${totalQuestions} سؤال)
            </p>
          </div>
          <button id="open-user-dashboard" class="btn btn-primary" style="display:flex; align-items:center; gap:8px;">
            <span style="width:18px;height:18px;display:inline-block;">${window.getIcon ? window.getIcon('target') : '📊'}</span>
            عرض نتائج الأداء التفصيلية
          </button>
        </div>
        
        ${totalQuestions > 0 ? `
          <div style="margin-top: 1.25rem; padding: 1rem 1.25rem; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--r-md); color: var(--text-sec); font-size: 0.9rem; line-height: 1.6;">
            ${advice}
          </div>
        ` : ''}
      </div>
    `;
    
    dashContainer.innerHTML = html;
    
    const btn = document.getElementById('open-user-dashboard');
    if (btn) {
      btn.onclick = () => {
        document.getElementById('main-dashboard').classList.add('hidden');
        if (typeof openUserDashboard === 'function') openUserDashboard();
      };
    }
  }
};
