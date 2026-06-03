const fs = require('fs');

const newCSS = `
/* ================================================================
   NEW FEATURES (Dark Mode, Chatbot, Progress, Scroll-To-Top)
   ================================================================ */

/* ===== DARK MODE ===== */
body.dark-mode {
  --bg: #0f1624;
  --surface: #1a2235;
  --surface2: #243047;
  --border: rgba(255,255,255,0.1);
  --text-primary: #e2e8f5;
  --text-sec: #cbd5e1;
  --text-muted: #94a3b8;
}
body.dark-mode .topbar { background: #111827; }
body.dark-mode .units-panel { background: #1a2235; }
body.dark-mode .unit-nav-item:hover { background: rgba(255,255,255,0.08); }
body.dark-mode .strategy-card { background: #1a2235; border-color: rgba(255,255,255,0.1); }
body.dark-mode .formula-block { background: #243047; border-color: rgba(255,255,255,0.1); }
body.dark-mode .fb-form { background: rgba(0,0,0,0.2); }
body.dark-mode .mini-q-text { background: #1a2235; color: #e2e8f5; }
body.dark-mode .mini-opt { background: #243047; color: #e2e8f5; border-color: #304060; }
body.dark-mode .bottom-nav { background: #1a2235; border-color: rgba(255,255,255,0.1); }
body.dark-mode .right-toolbar { background: #1a2235; }

/* Dark Toggle Button */
.dark-toggle {
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  color: white; width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 1.1rem; transition: all 0.3s ease;
}
.dark-toggle:hover { background: rgba(245,166,35,0.3); transform: rotate(20deg); }

/* ===== OVERALL PROGRESS TRACKER ===== */
.overall-progress-section {
  background: linear-gradient(135deg, #0d1b3e 0%, #1a2f5e 100%);
  padding: 2.5rem 1.5rem; text-align: center; border-radius: var(--r-xl);
  margin-bottom: 2rem; box-shadow: var(--sh-md);
}
.overall-progress-inner { max-width: 700px; margin: 0 auto; }
.overall-progress-section h3 { color: white; font-size: 1.3rem; font-weight: 800; margin-bottom: 0.5rem; }
.overall-progress-section p { color: rgba(255,255,255,0.6); font-size: 0.85rem; margin-bottom: 1.5rem; }
.overall-bar-wrap {
  background: rgba(255,255,255,0.1); border-radius: 50px; height: 14px;
  overflow: hidden; margin-bottom: 0.6rem; position: relative;
}
.overall-bar-fill {
  height: 100%; background: linear-gradient(90deg, var(--gold), var(--green));
  border-radius: 50px; transition: width 0.8s ease; width: 0%;
}
.overall-bar-label { color: var(--gold); font-weight: 800; font-size: 1rem; }
.overall-stats-row { display: flex; justify-content: center; gap: 3rem; margin-top: 1.5rem; flex-wrap: wrap; }
.overall-stat-item { text-align: center; }
.overall-stat-item .num { color: var(--gold); font-size: 1.8rem; font-weight: 900; display: block; }
.overall-stat-item .lbl { color: rgba(255,255,255,0.6); font-size: 0.8rem; }

/* ===== SCROLL TO TOP FAB ===== */
.fab-scroll {
  position: fixed; bottom: 2rem; left: 2rem; width: 52px; height: 52px;
  background: linear-gradient(135deg, var(--gold), #e09212);
  color: var(--navy); border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; box-shadow: 0 4px 20px rgba(245,166,35,0.5); cursor: pointer;
  transition: all 0.3s ease; z-index: 990; border: none;
  opacity: 0; pointer-events: none; transform: translateY(20px);
}
.fab-scroll.visible { opacity: 1; pointer-events: auto; transform: translateY(0); }
.fab-scroll:hover { transform: scale(1.1) rotate(-10deg); box-shadow: 0 8px 30px rgba(245,166,35,0.6); }

/* ===== AI CHATBOT FAB & WINDOW ===== */
.ai-fab-wrap {
  position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
  display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem;
}
.ai-fab {
  width: 62px; height: 62px; background: linear-gradient(135deg, #0d1b3e, #1a2f5e);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 6px 25px rgba(13,27,62,0.5);
  animation: aiFabPulse 2.5s infinite; transition: all 0.3s ease;
  border: 2px solid var(--gold); position: relative;
}
.ai-fab:hover { transform: scale(1.12); box-shadow: 0 10px 35px rgba(245,166,35,0.5); }
@keyframes aiFabPulse {
  0%,100% { box-shadow: 0 6px 25px rgba(13,27,62,0.5), 0 0 0 0 rgba(245,166,35,0.5); }
  50% { box-shadow: 0 6px 25px rgba(13,27,62,0.5), 0 0 0 12px rgba(245,166,35,0); }
}
.ai-fab-icon { font-size: 1.8rem; color: #fff; }
.ai-fab-badge {
  position: absolute; top: -4px; left: -4px; background: var(--red); color: white;
  font-size: 0.6rem; font-weight: 800; padding: 2px 5px; border-radius: 8px;
  box-shadow: 0 2px 8px rgba(239,35,60,0.5); animation: badgeBlink 2s infinite;
}
@keyframes badgeBlink { 0%,100%{opacity:1} 50%{opacity:0.6} }
.ai-fab-tooltip {
  background: var(--navy-mid); color: white; font-size: 0.78rem; padding: 0.4rem 0.9rem;
  border-radius: 8px; font-weight: 600; white-space: nowrap; opacity: 0;
  transform: translateX(10px); transition: all 0.3s ease; pointer-events: none;
  position: absolute; right: 72px; bottom: 10px; box-shadow: var(--sh-md);
}
.ai-fab:hover .ai-fab-tooltip { opacity: 1; transform: translateX(0); }

/* Chatbot Window */
.chatbot-window {
  position: fixed; bottom: 7rem; right: 2rem; width: 370px; max-height: 520px;
  background: var(--surface); border-radius: 22px;
  box-shadow: 0 20px 60px rgba(13,27,62,0.3), 0 0 0 1px rgba(245,166,35,0.15);
  z-index: 9998; display: none; flex-direction: column; overflow: hidden;
  animation: chatSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
  border: 1.5px solid rgba(245,166,35,0.2);
}
body.dark-mode .chatbot-window { background: #1a2235; border-color: rgba(245,166,35,0.3); }
.chatbot-window.open { display: flex; }
@keyframes chatSlideUp { from { opacity:0; transform: translateY(30px) scale(0.92); } to { opacity:1; transform: translateY(0) scale(1); } }
.chatbot-header {
  background: linear-gradient(135deg, var(--navy), #1a2f5e); padding: 1rem 1.25rem;
  display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid rgba(245,166,35,0.2);
}
.chatbot-header-icon { font-size: 1.5rem; color: var(--gold); }
.chatbot-header-info { flex: 1; }
.chatbot-header-info h4 { color: white; font-size: 0.95rem; font-weight: 800; margin-bottom: 0.1rem; }
.chatbot-header-info span { color: rgba(255,255,255,0.6); font-size: 0.72rem; display: flex; align-items: center; gap: 0.3rem; }
.online-dot { width: 7px; height: 7px; background: #10b981; border-radius: 50%; animation: onlinePulse 2s infinite; display: inline-block; }
@keyframes onlinePulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
.chatbot-close { width: 30px; height: 30px; background: rgba(255,255,255,0.1); border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.chatbot-close:hover { background: rgba(245,166,35,0.4); transform: rotate(90deg); }

.chatbot-messages {
  flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column;
  gap: 0.75rem; scrollbar-width: thin; max-height: 330px;
}
.chat-msg { max-width: 85%; padding: 0.65rem 0.9rem; border-radius: 14px; font-size: 0.87rem; line-height: 1.6; word-break: break-word; }
.chat-msg.bot { background: #f1f5f9; color: var(--navy); align-self: flex-start; border-bottom-right-radius: 4px; }
body.dark-mode .chat-msg.bot { background: #243047; color: #e2e8f5; }
.chat-msg.user { background: linear-gradient(135deg, var(--gold), #e09212); color: var(--navy); align-self: flex-end; border-bottom-left-radius: 4px; font-weight: 600; }

.chat-typing { display: flex; gap: 4px; padding: 0.65rem 0.9rem; background: #f1f5f9; border-radius: 14px; align-self: flex-start; border-bottom-right-radius: 4px; align-items: center; }
body.dark-mode .chat-typing { background: #243047; }
.typing-dot { width: 6px; height: 6px; background: var(--gold); border-radius: 50%; animation: typingAnim 1.2s infinite; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; } .typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingAnim { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

.chatbot-quick-btns { padding: 0.5rem 1rem; display: flex; flex-wrap: wrap; gap: 0.4rem; border-top: 1px solid var(--border); }
.quick-btn { background: rgba(245,166,35,0.1); border: 1px solid rgba(245,166,35,0.3); color: var(--gold); font-size: 0.75rem; padding: 0.3rem 0.65rem; border-radius: 20px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
.quick-btn:hover { background: var(--gold); color: var(--navy); }

.chatbot-input-area { padding: 0.75rem 1rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); background: var(--surface); }
.chatbot-input { flex: 1; border: 1.5px solid var(--border); border-radius: 25px; padding: 0.6rem 1rem; font-size: 0.88rem; color: var(--text-primary); outline: none; background: var(--surface2); transition: all 0.2s; direction: rtl; }
.chatbot-input:focus { border-color: var(--gold); }
.chatbot-send { width: 40px; height: 40px; background: linear-gradient(135deg, var(--gold), #e09212); border-radius: 50%; color: var(--navy); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; transition: all 0.2s; flex-shrink: 0; }
.chatbot-send:hover { transform: scale(1.1); box-shadow: 0 4px 15px rgba(245,166,35,0.5); }
`;

fs.appendFileSync('public/style.css', newCSS, 'utf8');
console.log('Appended new features CSS');
