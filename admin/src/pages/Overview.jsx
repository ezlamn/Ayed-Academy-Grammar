import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { api } from '../lib/api';
import { DateText, Empty, ErrorBox, Loading, TRACK_ICONS, TRACK_LABELS } from '../components/ui.jsx';
import PeopleIcon from '@mui/icons-material/People';

function Stat({ label, value, note }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value num">{value ?? '—'}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}

export default function Overview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['overview'],
    queryFn: () => api.get('/admin/overview'),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;

  const c = data.counts;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>نظرة عامة</h1>
          <div className="sub">ملخّص المحتوى ونشاط الطلاب</div>
        </div>
      </div>

      <div className="grid grid-stats" style={{ marginBottom: '1.5rem' }}>
        <Stat label="الوحدات" value={c.units} note={`${c.publishedUnits} منشورة`} />
        <Stat label="الاستراتيجيات" value={c.strategies} />
        <Stat label="الأسئلة" value={c.questions} />
        <Stat label="نماذج الاختبارات" value={c.exams} />
        <Stat label="الطلاب" value={c.students} note={`${c.activeStudents} نشط هذا الأسبوع`} />
        <Stat label="إجابات مسجّلة" value={c.attempts} />
        <Stat label="امتحانات مكتملة" value={c.examAttempts} />
        <Stat label="ملفات الميديا" value={c.media} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">المحتوى حسب المسار</div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {['grammar', 'reading', 'listening'].map(track => (
              <Link
                key={track}
                to={`/content/${track}`}
                className="sortable-item"
                style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
              >
                <span style={{ fontSize: '1.3rem' }}>{TRACK_ICONS[track]}</span>
                <div className="item-main">
                  <div className="item-title">{TRACK_LABELS[track]}</div>
                  <div className="item-sub">{data.unitsByTrack[track] || 0} وحدة</div>
                </div>
                <span className="muted">‹</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <span>آخر الطلاب نشاطاً</span>
            <Link to="/students" className="btn btn-sm">الكل</Link>
          </div>
          {data.recentStudents.length === 0 ? (
            <Empty icon={<PeopleIcon fontSize="inherit" />} title="مفيش طلاب مسجّلين بعد">
              أول ما طالب يسجّل من الموقع هيظهر هنا.
            </Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>المستوى</th>
                    <th>XP</th>
                    <th>آخر نشاط</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentStudents.map(s => (
                    <tr key={s.id}>
                      <td>
                        <Link to={`/students/${s.id}`} style={{ fontWeight: 700 }}>{s.name}</Link>
                        <div className="small muted ltr">{s.email}</div>
                      </td>
                      <td><span className="badge badge-brand">{s.state?.level ?? 1}</span></td>
                      <td className="num">{s.state?.xp ?? 0}</td>
                      <td><DateText value={s.lastActiveAt} fallback="لم يدخل بعد" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
