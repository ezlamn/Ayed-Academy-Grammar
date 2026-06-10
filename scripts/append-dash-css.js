const fs = require('fs');

const dashCSS = `
/* ============================================================
   MAIN DASHBOARD (Track Selection)
   ============================================================ */
#main-dashboard {
  min-height: 100vh;
  padding: 4rem 2rem;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fadeUp 0.6s ease-out;
}
.dash-header { text-align: center; margin-bottom: 4rem; }
.dash-logo { font-size: 2rem; color: var(--gold); font-weight: 900; margin-bottom: 1rem; }
.dash-title { font-size: 2.5rem; color: var(--text-primary); font-weight: 800; margin-bottom: 0.5rem; }
.dash-subtitle { font-size: 1.2rem; color: var(--text-sec); }

.dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: 1000px;
}
.dash-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--sh-md);
}
.dash-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 30px rgba(245, 158, 11, 0.15);
  border-color: var(--gold);
}
.dash-icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
  background: rgba(245, 158, 11, 0.1);
  width: 80px; height: 80px;
  line-height: 80px;
  border-radius: 50%;
  margin: 0 auto 1.5rem auto;
}
.dash-card h3 { color: var(--text-primary); font-size: 1.4rem; font-weight: 800; margin-bottom: 0.8rem; }
.dash-card p { color: var(--text-sec); font-size: 0.95rem; line-height: 1.6; }

.dash-footer { margin-top: 4rem; }
.dash-logout-btn {
  background: transparent;
  color: var(--text-muted);
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.2s;
}
.dash-logout-btn:hover { color: var(--red); }

.btn-back-dash {
  position: fixed;
  bottom: 2rem;
  left: 5rem; /* Next to scroll-top fab */
  width: 52px; height: 52px;
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; box-shadow: var(--sh-md); cursor: pointer;
  transition: all 0.3s ease; z-index: 990;
}
.btn-back-dash:hover { transform: scale(1.1); border-color: var(--gold); }
`;

fs.appendFileSync('public/style.css', dashCSS, 'utf8');
console.log('Dashboard CSS appended.');
