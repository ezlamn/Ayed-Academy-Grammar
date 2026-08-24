import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { api } from '../lib/api';
import {
  Empty, ErrorBox, Loading, PercentBar, SECTION_LABELS, TRACK_LABELS, stripHtml,
} from '../components/ui.jsx';
import InsightsIcon from '@mui/icons-material/Insights';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import AdjustIcon from '@mui/icons-material/Adjust';
import InfoIcon from '@mui/icons-material/Info';

/** رسم بياني عمودي بسيط بـ SVG — من غير مكتبات خارجية. */
function ActivityChart({ rows }) {
  const max = Math.max(1, ...rows.map(r => r.answers));
  const width = 100;
  const height = 34;
  const gap = 0.6;
  const barW = width / rows.length - gap;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: 120, display: 'block' }}
      role="img"
      aria-label="نشاط الإجابات اليومي"
    >
      {rows.map((r, i) => {
        const h = (r.answers / max) * (height - 2);
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={height - h}
            width={barW}
            height={h || 0.4}
            fill={r.answers ? 'var(--brand)' : 'var(--border)'}
            rx="0.5"
          >
            <title>
              {new Date(r.day).toLocaleDateString('ar-EG')} — {r.answers} إجابة، {r.activeStudents} طالب
            </title>
          </rect>
        );
      })}
    </svg>
  );
}

export default function Analytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/admin/analytics'),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;

  const { weakestUnits, hardestQuestions, completion, exams, activity } = data;
  const hasData = weakestUnits.length || hardestQuestions.length;

  const completionByTrack = completion.reduce((acc, u) => {
    (acc[u.track] = acc[u.track] || []).push(u);
    return acc;
  }, {});

  const maxCompleted = Math.max(1, ...completion.map(u => u.completedBy));

  return (
    <>
      <div className="page-head">
        <div>
          <h1><InsightsIcon fontSize="inherit" /> التحليلات</h1>
          <div className="sub">مبنية على إجابات الطلاب الفعلية</div>
        </div>
      </div>

      {!hasData && (
        <div className="alert alert-info">
          <InfoIcon fontSize="inherit" /> لسه مفيش إجابات كفاية. الأرقام هنا بتظهر بعد ما الطلاب يبدأوا يحلّوا التمارين.
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <div className="card-head">النشاط — آخر 30 يوم</div>
        <div className="card-pad">
          <ActivityChart rows={activity} />
          <div className="small muted center" style={{ marginTop: '0.4rem' }}>
            إجمالي {activity.reduce((s, r) => s + r.answers, 0)} إجابة
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '1.2rem' }}>
        <div className="card">
          <div className="card-head">أضعف الوحدات</div>
          {!weakestUnits.length ? (
            <Empty icon={<QueryStatsIcon fontSize="inherit" />} title="">محتاج إجابات أكتر.</Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>الوحدة</th><th>إجابات</th><th style={{ width: '38%' }}>الدقّة</th></tr>
                </thead>
                <tbody>
                  {weakestUnits.map(u => (
                    <tr key={u.id}>
                      <td>
                        <Link to={`/content/${u.track}/${u.id}`} style={{ fontWeight: 600 }}>{u.nameAr}</Link>
                        <div className="small muted">{TRACK_LABELS[u.track]}</div>
                      </td>
                      <td className="num">{u.answered}</td>
                      <td><PercentBar value={u.accuracyPct} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">أصعب الأسئلة</div>
          {!hardestQuestions.length ? (
            <Empty icon={<AdjustIcon fontSize="inherit" />} title="">محتاج إجابات أكتر.</Empty>
          ) : (
            <div className="table-wrap" style={{ maxHeight: 420, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr><th>السؤال</th><th style={{ width: '30%' }}>الدقّة</th></tr>
                </thead>
                <tbody>
                  {hardestQuestions.map(q => (
                    <tr key={q.id}>
                      <td>
                        <div className="truncate-2">{stripHtml(q.text)}</div>
                        <div className="small muted">
                          {q.unitNameAr}
                          {q.strategyTitle ? ` · ${stripHtml(q.strategyTitle)}` : ''}
                          {' · '}{q.answered} محاولة
                        </div>
                      </td>
                      <td><PercentBar value={q.accuracyPct} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">أداء الامتحانات</div>
          <div className="card-pad">
            <div className="grid grid-stats" style={{ marginBottom: '1rem' }}>
              <div className="stat">
                <div className="stat-label">محاولات مكتملة</div>
                <div className="stat-value num">{exams.overall.attempts}</div>
              </div>
              <div className="stat">
                <div className="stat-label">متوسط الدرجات</div>
                <div className="stat-value num">{exams.overall.avgPct ?? '—'}%</div>
              </div>
              <div className="stat">
                <div className="stat-label">أعلى درجة</div>
                <div className="stat-value num">{exams.overall.bestPct ?? '—'}%</div>
              </div>
            </div>

            {exams.bySection.length > 0 && (
              <>
                <h4 className="small muted" style={{ marginBottom: '0.5rem' }}>حسب القسم</h4>
                <table>
                  <tbody>
                    {exams.bySection.map(s => (
                      <tr key={s.section}>
                        <td style={{ fontWeight: 600 }}>{SECTION_LABELS[s.section] || s.section}</td>
                        <td style={{ width: '55%' }}><PercentBar value={s.avgPct} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {exams.byExam.length > 0 && (
              <>
                <h4 className="small muted" style={{ margin: '1rem 0 0.5rem' }}>حسب النموذج</h4>
                <table>
                  <tbody>
                    {exams.byExam.map((e, i) => (
                      <tr key={i}>
                        <td>
                          {e.title}
                          <div className="small muted">{e.attempts} محاولة</div>
                        </td>
                        <td style={{ width: '45%' }}><PercentBar value={e.avgPct} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">قمع الإكمال</div>
          <div className="card-pad" style={{ maxHeight: 480, overflowY: 'auto' }}>
            {Object.entries(completionByTrack).map(([track, units]) => (
              <div key={track} style={{ marginBottom: '1.1rem' }}>
                <h4 className="small muted" style={{ marginBottom: '0.5rem' }}>{TRACK_LABELS[track]}</h4>
                <table>
                  <tbody>
                    {units.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontSize: '0.85rem' }}>{u.nameAr}</td>
                        <td className="num nowrap" style={{ width: '1%' }}>{u.completedBy}</td>
                        <td style={{ width: '45%' }}>
                          <span className="bar high">
                            <i style={{ width: `${(u.completedBy / maxCompleted) * 100}%` }} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
