import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, qs } from '../lib/api';
import SortableList from '../components/SortableList.jsx';
import {
  ConfirmButton, Empty, ErrorBox, Loading, Modal, TRACK_ICONS, TRACK_LABELS,
} from '../components/ui.jsx';

function NewUnitModal({ track, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ nameAr: '', nameEn: '', emoji: '📘', tag: '', mascot: '' });
  const [error, setError] = useState(null);

  const create = useMutation({
    mutationFn: body => api.post('/admin/units', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['units', track] });
      onClose();
    },
    onError: setError,
  });

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  return (
    <Modal
      title="وحدة جديدة"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose} type="button">إلغاء</button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={create.isPending || !form.nameAr.trim()}
            onClick={() => create.mutate({ track, ...form })}
          >
            {create.isPending ? 'جاري الإنشاء...' : 'إنشاء'}
          </button>
        </>
      }
    >
      <ErrorBox error={error} onDismiss={() => setError(null)} />

      <div className="field-row">
        <div className="field" style={{ flex: '0 0 90px' }}>
          <label>الأيقونة</label>
          <input type="text" value={form.emoji} onChange={e => set('emoji', e.target.value)} maxLength={4} />
        </div>
        <div className="field">
          <label>الاسم بالعربي *</label>
          <input type="text" value={form.nameAr} onChange={e => set('nameAr', e.target.value)} autoFocus />
        </div>
      </div>

      <div className="field">
        <label>الاسم بالإنجليزي</label>
        <input type="text" className="ltr" value={form.nameEn} onChange={e => set('nameEn', e.target.value)} />
      </div>

      {track !== 'reading' && (
        <div className="field-row">
          <div className="field">
            <label>وسم الوحدة</label>
            <input type="text" value={form.tag} onChange={e => set('tag', e.target.value)} placeholder="الوحدة الأولى" />
          </div>
          <div className="field" style={{ flex: '0 0 90px' }}>
            <label>التميمة</label>
            <input type="text" value={form.mascot} onChange={e => set('mascot', e.target.value)} maxLength={4} />
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function TrackUnits() {
  const { track } = useParams();
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState(null);

  const { data: units, isLoading, error: loadError } = useQuery({
    queryKey: ['units', track],
    queryFn: () => api.get('/admin/units' + qs({ track })),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['units', track] });
    qc.invalidateQueries({ queryKey: ['overview'] });
  };

  const reorder = useMutation({
    mutationFn: ids => api.patch(`/admin/units/reorder/${track}`, { ids }),
    // تحديث متفائل: الترتيب بيتغيّر فوراً في الواجهة قبل رد السيرفر
    onMutate: async ids => {
      await qc.cancelQueries({ queryKey: ['units', track] });
      const previous = qc.getQueryData(['units', track]);
      qc.setQueryData(['units', track], old => {
        if (!old) return old;
        const byId = new Map(old.map(u => [u.id, u]));
        return ids.map(id => byId.get(id)).filter(Boolean);
      });
      return { previous };
    },
    onError: (err, _ids, context) => {
      if (context?.previous) qc.setQueryData(['units', track], context.previous);
      setError(err);
    },
    onSettled: invalidate,
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, published }) => api.patch(`/admin/units/${id}`, { published }),
    onSuccess: invalidate,
    onError: setError,
  });

  const remove = useMutation({
    mutationFn: id => api.delete(`/admin/units/${id}`),
    onSuccess: invalidate,
    onError: setError,
  });

  if (isLoading) return <Loading />;
  if (loadError) return <ErrorBox error={loadError} />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{TRACK_ICONS[track]} {TRACK_LABELS[track]}</h1>
          <div className="sub">{units.length} وحدة — اسحب من ⋮⋮ لإعادة الترتيب</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)} type="button">
          + وحدة جديدة
        </button>
      </div>

      <ErrorBox error={error} onDismiss={() => setError(null)} />

      <div className="card">
        {units.length === 0 ? (
          <Empty icon="📭" title="مفيش وحدات في المسار ده">
            اضغط «وحدة جديدة» عشان تبدأ.
          </Empty>
        ) : (
          <SortableList
            items={units}
            onReorder={ids => reorder.mutate(ids)}
            renderItem={unit => (
              <>
                <span style={{ fontSize: '1.25rem', width: '1.8rem', textAlign: 'center' }}>
                  {unit.emoji || '📄'}
                </span>

                <div className="item-main">
                  <div className="item-title">
                    <Link to={`/content/${track}/${unit.id}`}>{unit.nameAr}</Link>
                    {!unit.published && <span className="badge badge-red" style={{ marginInlineStart: '0.5rem' }}>مخفية</span>}
                  </div>
                  <div className="item-sub ltr">{unit.nameEn}</div>
                </div>

                <div className="btn-row small muted nowrap" style={{ gap: '0.35rem' }}>
                  <span className="badge">{unit._count.strategies} استراتيجية</span>
                  <span className="badge">{unit._count.questions} سؤال</span>
                  {unit._count.videos > 0 && <span className="badge">{unit._count.videos} فيديو</span>}
                  {unit._count.vocabCategories > 0 && (
                    <span className="badge">{unit._count.vocabCategories} تصنيف</span>
                  )}
                </div>

                <div className="btn-row" style={{ gap: '0.35rem' }}>
                  <Link className="btn btn-sm" to={`/content/${track}/${unit.id}`}>تحرير</Link>
                  <button
                    className="btn btn-sm"
                    type="button"
                    onClick={() => togglePublish.mutate({ id: unit.id, published: !unit.published })}
                    title={unit.published ? 'إخفاء من الموقع' : 'نشر على الموقع'}
                  >
                    {unit.published ? '👁️' : '🚫'}
                  </button>
                  <ConfirmButton
                    message="هيتحذف كل محتواها"
                    onConfirm={() => remove.mutate(unit.id)}
                  >
                    حذف
                  </ConfirmButton>
                </div>
              </>
            )}
          />
        )}
      </div>

      {showNew && <NewUnitModal track={track} onClose={() => setShowNew(false)} />}
    </>
  );
}
