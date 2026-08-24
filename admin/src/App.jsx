/* ================================================================
   APP.JSX — التوجيه والهيكل العام
   ================================================================ */
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './lib/auth.jsx';
import { Loading, TRACK_ICONS, TRACK_LABELS } from './components/ui.jsx';

import Login from './pages/Login.jsx';
import Overview from './pages/Overview.jsx';
import TrackUnits from './pages/TrackUnits.jsx';
import UnitEditor from './pages/UnitEditor.jsx';
import MediaLibrary from './pages/MediaLibrary.jsx';
import Exams from './pages/Exams.jsx';
import ExamEditor from './pages/ExamEditor.jsx';
import Students from './pages/Students.jsx';
import StudentDetail from './pages/StudentDetail.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';

function Sidebar() {
  const { admin, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span>📚</span>
        <span>عايد أكاديمي</span>
      </div>

      <NavLink to="/" end className="nav-link">
        <span className="ico">📊</span> نظرة عامة
      </NavLink>

      <div className="nav-group-label">المحتوى</div>
      {['grammar', 'reading', 'listening'].map(track => (
        <NavLink key={track} to={`/content/${track}`} className="nav-link">
          <span className="ico">{TRACK_ICONS[track]}</span> {TRACK_LABELS[track]}
        </NavLink>
      ))}
      <NavLink to="/exams" className="nav-link">
        <span className="ico">📝</span> نماذج الاختبارات
      </NavLink>
      <NavLink to="/media" className="nav-link">
        <span className="ico">🎬</span> مكتبة الميديا
      </NavLink>

      <div className="nav-group-label">الطلاب</div>
      <NavLink to="/students" className="nav-link">
        <span className="ico">👥</span> قائمة الطلاب
      </NavLink>
      <NavLink to="/analytics" className="nav-link">
        <span className="ico">📈</span> التحليلات
      </NavLink>

      <div className="nav-group-label">النظام</div>
      <NavLink to="/settings" className="nav-link">
        <span className="ico">⚙️</span> الإعدادات
      </NavLink>
      <a href="/" className="nav-link" target="_blank" rel="noreferrer">
        <span className="ico">🔗</span> عرض الموقع
      </a>

      <div className="sidebar-footer">
        <div style={{ fontWeight: 700 }}>{admin?.name}</div>
        <div className="small muted ltr" style={{ marginBottom: '0.5rem' }}>{admin?.email}</div>
        <button className="btn btn-sm" onClick={logout} type="button">تسجيل الخروج</button>
      </div>
    </aside>
  );
}

function Protected({ children }) {
  const { admin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="login-wrap"><Loading label="جاري التحقق من الجلسة..." /></div>;
  if (!admin) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}

function Shell() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <Protected>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/content/:track" element={<TrackUnits />} />
              <Route path="/content/:track/:unitId" element={<UnitEditor />} />
              <Route path="/media" element={<MediaLibrary />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/exams/:examId" element={<ExamEditor />} />
              <Route path="/students" element={<Students />} />
              <Route path="/students/:studentId" element={<StudentDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Protected>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
