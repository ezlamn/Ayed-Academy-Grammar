import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../lib/api';
import SortableList from '../components/SortableList.jsx';
import { ConfirmButton, Empty, ErrorBox, Loading, Modal } from '../components/ui.jsx';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

function NewExamModal({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: '', durationMin: 120 });
  const [error, setError] = useState(null);

  const create = useMutation({
    mutationFn: body => api.post('/admin/exams', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exams'] }); onClose(); },
    onError: setError,
  });

  return (
    <Modal
      title="نموذج امتحان جديد"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose} type="button">إلغاء</button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={!form.title.trim() || create.isPending}
            onClick={() => create.mutate(form)}
          >
            إنشاء
          </button>
        </>
      }
    >
      <ErrorBox error={error} onDismiss={() => setError(null)} />
      <div className="field">
        <label>عنوان النموذج *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="النموذج الأول — شامل"
          autoFocus
        />
      </div>
      <div className="field">
        <label>مدة الامتحان (دقيقة)</label>
        <input
          type="number"
          className="ltr"
          value={form.durationMin}
          min={1}
          max={600}
          onChange={e => setForm(f => ({ ...f, durationMin: Number(e.target.value) }))}
        />
      </div>
    </Modal>
  );
}

export default function Exams() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState(null);

  const { data: exams, isLoading, error: loadError } = useQuery({
    queryKey: ['exams'],
    queryFn: () => api.get('/admin/exams'),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['exams'] });
    qc.invalidateQueries({ queryKey: ['overview'] });
  };

  const togglePublish = useMutation({
    mutationFn: ({ id, published }) => api.patch(`/admin/exams/${id}`, { published }),
    onSuccess: invalidate,
    onError: setError,
  });

  const remove = useMutation({
    mutationFn: id => api.delete(`/admin/exams/${id}`),
    onSuccess: invalidate,
    onError: setError,
  });

  const reorder = useMutation({
    mutationFn: ids => api.patch('/admin/exams/reorder', { ids }),
    onSuccess: invalidate,
    onError: setError,
  });

  if (isLoading) return <Loading />;
  if (loadError) return <ErrorBox error={loadError} />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1><AssignmentIcon fontSize="inherit" /> نماذج الاختبارات</h1>
          <div className="sub">
            النماذج المنشورة بتظهر للطالب في صفحة الامتحانات جنب التوليد العشوائي
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)} type="button">
          + نموذج جديد
        </button>
      </div>

      <ErrorBox error={error} onDismiss={() => setError(null)} />

      <div className="card">
        {exams.length === 0 ? (
          <Empty icon={<AssignmentIcon fontSize="inherit" />} title="مفيش نماذج محفوظة">
            الطالب دلوقتي بياخد امتحانات مولّدة عشوائياً من أسئلة الوحدات.
            أنشئ نموذجاً ثابتاً لو عايز امتحاناً محدداً.
          </Empty>
        ) : (
          <SortableList
            items={exams}
            onReorder={ids => reorder.mutate(ids)}
            renderItem={exam => (
              <>
                <span style={{ fontSize: '1.15rem' }}><DescriptionIcon fontSize="inherit" /></span>
                <div className="item-main">
                  <div className="item-title">
                    <Link to={`/exams/${exam.id}`}>{exam.title}</Link>
                    {!exam.published && (
                      <span className="badge badge-red" style={{ marginInlineStart: '0.5rem' }}>مسودّة</span>
                    )}
                  </div>
                  <div className="item-sub">
                    {exam._count.questions} سؤال · {exam.durationMin} دقيقة · {exam._count.attempts} محاولة
                  </div>
                </div>
                <div className="btn-row" style={{ gap: '0.3rem' }}>
                  <Link className="btn btn-sm" to={`/exams/${exam.id}`}>تحرير</Link>
                  <button
                    className="btn btn-sm"
                    type="button"
                    disabled={!exam._count.questions && !exam.published}
                    title={
                      !exam._count.questions && !exam.published
                        ? 'أضف أسئلة قبل النشر'
                        : exam.published ? 'إخفاء' : 'نشر'
                    }
                    onClick={() => togglePublish.mutate({ id: exam.id, published: !exam.published })}
                  >
                    {exam.published
                      ? <><VisibilityIcon fontSize="inherit" /> منشور</>
                      : <><VisibilityOffIcon fontSize="inherit" /> مخفي</>}
                  </button>
                  <ConfirmButton onConfirm={() => remove.mutate(exam.id)}>حذف</ConfirmButton>
                </div>
              </>
            )}
          />
        )}
      </div>

      {showNew && <NewExamModal onClose={() => setShowNew(false)} />}
    </>
  );
}
