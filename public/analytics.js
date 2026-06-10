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
    
    let html = `<div class="analytics-card" style="background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 12px; margin-top: 2rem;">
      <h3 style="color: var(--gold); margin-bottom: 1rem;">📊 التحليل الذكي لمستواك</h3>
      <div class="analytics-bars">`;
      
    for (let cat in this.data) {
      const stats = this.data[cat];
      const percent = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      html += `
        <div style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: white; text-transform: uppercase;">${cat}</span>
            <span style="color: #aaa;">${percent}%</span>
          </div>
          <div style="width: 100%; background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="width: ${percent}%; background: ${percent < 50 ? '#e74c3c' : percent < 80 ? '#f39c12' : '#2ecc71'}; height: 100%;"></div>
          </div>
        </div>
      `;
    }
    html += `</div>
      <div style="margin-top: 1.5rem; color: #ddd; font-size: 0.95rem; line-height: 1.6; padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 8px;">
        ${this.getAdvice()}
      </div>
    </div>`;
    
    dashContainer.innerHTML = html;
  }
};
