import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { api, qs } from '../lib/api';
import { DateText, Empty, ErrorBox, Loading } from '../components/ui.jsx';

export default function Students() {
  const [filters, setFilters] = useState({ q: '', active: '', sort: 'recent' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['students', filters],
    queryFn: () => api.get('/admin/students' + qs({ ...filters, take: 100 })),
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>👥 الطلاب</h1>
          <div className="sub">{data ? `${data.total} طالب مسجّل` : '...'}</div>
        </div>
      </div>

      <ErrorBox error={error} />

      <div className="toolbar">
        <input
          type="text"
          placeholder="بحث بالاسم أو الإيميل..."
          value={filters.q}
          onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
        />
        <select value={filters.active} onChange={e => setFilters(f => ({ ...f, active: e.target.value }))}>
          <option value="">الكل</option>
          <option value="true">نشط</option>
          <option value="false">موقوف</option>
        </select>
        <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}>
          <option value="recent">الأحدث نشاطاً</option>
          <option value="joined">الأحدث تسجيلاً</option>
          <option value="xp">الأعلى نقاطاً</option>
          <option value="name">الاسم</option>
        </select>
      </div>

      <div className="card">
        {isLoading ? (
          <Loading />
        ) : !data.items.length ? (
          <Empty icon="👥" title="مفيش طلاب">
            الطلاب بيسجّلوا بنفسهم من صفحة البداية في الموقع.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>المستوى</th>
                  <th>XP</th>
                  <th>السلسلة</th>
                  <th>وحدات مكتملة</th>
                  <th>إجابات</th>
                  <th>امتحانات</th>
                  <th>آخر نشاط</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map(s => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/students/${s.id}`} style={{ fontWeight: 700 }}>{s.name}</Link>
                      {!s.active && <span className="badge badge-red" style={{ marginInlineStart: '0.4rem' }}>موقوف</span>}
                      <div className="small muted ltr">{s.email}</div>
                    </td>
                    <td><span className="badge badge-brand">{s.state?.level ?? 1}</span></td>
                    <td className="num">{s.state?.xp ?? 0}</td>
                    <td className="num">{s.state?.streak ? `🔥 ${s.state.streak}` : '—'}</td>
                    <td className="num">{s._count.progress}</td>
                    <td className="num">{s._count.attempts}</td>
                    <td className="num">{s._count.examAttempts}</td>
                    <td><DateText value={s.lastActiveAt} fallback="—" /></td>
                    <td><Link className="btn btn-sm" to={`/students/${s.id}`}>تفاصيل</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
