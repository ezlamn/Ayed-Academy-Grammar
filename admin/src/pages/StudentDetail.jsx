import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '../lib/api';
import {
  ConfirmButton, DateText, Empty, ErrorBox, Loading, Modal,
  PercentBar, TRACK_LABELS,
} from '../components/ui.jsx';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import BlockIcon from '@mui/icons-material/Block';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DoneAllIcon from '@mui/icons-material/DoneAll';

function ResetPasswordModal({ studentId, onClose }) {
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const reset = useMutation({
    mutationFn: () => api.post(`/admin/students/${studentId}/reset-password`, { newPassword: password }),
    onSuccess: () => setDone(true),
    onError: setError,
  });

  return (
    <Modal
      title="إعادة تعيين كلمة المرور"
      onClose={onClose}
      footer={
        done ? (
          <button className="btn btn-primary" onClick={onClose} type="button">تمام</button>
        ) : (
          <>
            <button className="btn" onClick={onClose} type="button">إلغاء</button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={password.length < 8 || reset.isPending}
              onClick={() => reset.mutate()}
            >
              تعيين
            </button>
          </>
        )
      }
    >
      <ErrorBox error={error} onDismiss={() => setError(null)} />
      {done ? (
        <div className="alert alert-ok">
          <CheckCircleIcon fontSize="inherit" /> اتغيّرت. ابعت للطالب كلمة المرور الجديدة:
          <div className="ltr mono" style={{ fontSize: '1.05rem', marginTop: '0.4rem' }}>{password}</div>
        </div>
      ) : (
        <div className="field">
          <label>كلمة المرور الجديدة</label>
          <span className="hint">8 أحرف على الأقل — ابعتها للطالب بعد الحفظ</span>
          <input
            type="text"
            className="ltr"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
          />
        </div>
      )}
    </Modal>
  );
}

export default function StudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(null);

  const { data: student, isLoading, error: loadError, refetch } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => api.get(`/admin/students/${studentId}`),
  });

  const toggleActive = useMutation({
    mutationFn: active => api.patch(`/admin/students/${studentId}`, { active }),
    onSuccess: refetch,
    onError: setError,
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/admin/students/${studentId}`),
    onSuccess: () => navigate('/students'),
    onError: setError,
  });

  if (isLoading) return <Loading />;
  if (loadError) return <ErrorBox error={loadError} />;

  const st = student.state;
  const notesCount = Object.keys(st?.notes || {}).length;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="small muted"><Link to="/students">الطلاب</Link> ‹</div>
          <h1>{student.name}</h1>
          <div className="sub ltr">{student.email}</div>
        </div>
        <div className="btn-row">
          <button className="btn" type="button" onClick={() => setResetting(true)}>
            <VpnKeyIcon fontSize="inherit" /> كلمة مرور جديدة
          </button>
          <button className="btn" type="button" onClick={() => toggleActive.mutate(!student.active)}>
            {student.active
              ? <><BlockIcon fontSize="inherit" /> إيقاف الحساب</>
              : <><CheckCircleIcon fontSize="inherit" /> تفعيل الحساب</>}
          </button>
          <ConfirmButton
            message="هيتحذف مع كل تقدّمه"
            onConfirm={() => remove.mutate()}
            className="btn btn-danger"
          >
            حذف
          </ConfirmButton>
        </div>
      </div>

      <ErrorBox error={error} onDismiss={() => setError(null)} />

      <div className="grid grid-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="stat">
          <div className="stat-label">المستوى</div>
          <div className="stat-value num">{st?.level ?? 1}</div>
          <div className="stat-note">{st?.xp ?? 0} نقطة خبرة</div>
        </div>
        <div className="stat">
          <div className="stat-label">السلسلة الحالية</div>
          <div className="stat-value num"><LocalFireDepartmentIcon fontSize="inherit" /> {st?.streak ?? 0}</div>
          <div className="stat-note">أطول سلسلة: {st?.bestStreak ?? 0}</div>
        </div>
        <div className="stat">
          <div className="stat-label">وحدات مكتملة</div>
          <div className="stat-value num">{student.progress.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">ملاحظات محفوظة</div>
          <div className="stat-value num">{notesCount}</div>
        </div>
        <div className="stat">
          <div className="stat-label">تاريخ التسجيل</div>
          <div className="stat-value" style={{ fontSize: '1rem', paddingTop: '0.4rem' }}>
            <DateText value={student.createdAt} />
          </div>
          <div className="stat-note">آخر نشاط: {student.lastActiveAt ? new Date(student.lastActiveAt).toLocaleDateString('ar-EG') : '—'}</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">الأداء حسب المسار</div>
          {!student.perTrack.length ? (
            <Empty icon={<QueryStatsIcon fontSize="inherit" />} title="">لسه ما جاوبش على أسئلة.</Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>المسار</th><th>إجابات</th><th>صحيحة</th><th style={{ width: '40%' }}>الدقّة</th></tr>
                </thead>
                <tbody>
                  {student.perTrack.map(t => (
                    <tr key={t.track}>
                      <td style={{ fontWeight: 700 }}>{TRACK_LABELS[t.track] || t.track}</td>
                      <td className="num">{t.answered}</td>
                      <td className="num">{t.correct}</td>
                      <td><PercentBar value={Math.round((t.correct / t.answered) * 100)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">آخر الامتحانات</div>
          {!student.examAttempts.length ? (
            <Empty icon={<AssignmentIcon fontSize="inherit" />} title="">لسه ما دخلش امتحان.</Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>الامتحان</th><th>الدرجة</th><th style={{ width: '30%' }}>النسبة</th><th>التاريخ</th></tr>
                </thead>
                <tbody>
                  {student.examAttempts.map(a => (
                    <tr key={a.id}>
                      <td>{a.exam?.title || `عشوائي (${a.preset || '—'})`}</td>
                      <td className="num nowrap">{a.score} / {a.total}</td>
                      <td><PercentBar value={Math.round((a.score / a.total) * 100)} /></td>
                      <td><DateText value={a.finishedAt || a.startedAt} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">الوحدات المكتملة</div>
          {!student.progress.length ? (
            <Empty icon={<DoneAllIcon fontSize="inherit" />} title="">لسه ما أنهاش وحدة.</Empty>
          ) : (
            <div className="table-wrap" style={{ maxHeight: 340, overflowY: 'auto' }}>
              <table>
                <tbody>
                  {student.progress.map(p => (
                    <tr key={p.id}>
                      <td>
                        <span className="badge">{TRACK_LABELS[p.unit.track]}</span>
                        <span style={{ marginInlineStart: '0.5rem', fontWeight: 600 }}>{p.unit.nameAr}</span>
                      </td>
                      <td style={{ width: '1%' }}><DateText value={p.completedAt} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {resetting && <ResetPasswordModal studentId={studentId} onClose={() => setResetting(false)} />}
    </>
  );
}
