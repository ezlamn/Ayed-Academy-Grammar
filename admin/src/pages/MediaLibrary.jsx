import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, qs } from '../lib/api';
import { ConfirmButton, DateText, Empty, ErrorBox, Loading } from '../components/ui.jsx';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaLibrary() {
  const qc = useQueryClient();
  const fileInput = useRef(null);
  const [kind, setKind] = useState('');
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['media', kind, search],
    queryFn: () => api.get('/admin/media' + qs({ kind, q: search, take: 120 })),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['media'] });
    qc.invalidateQueries({ queryKey: ['overview'] });
  };

  const upload = useMutation({
    mutationFn: files => {
      const fd = new FormData();
      for (const f of files) fd.append('files', f);
      return api.post('/admin/media', fd);
    },
    onSuccess: invalidate,
    onError: setError,
  });

  const remove = useMutation({
    // force=true بيحذف حتى لو الملف مستخدم — السيرفر بيفكّ الربط
    mutationFn: ({ id, force }) => api.delete(`/admin/media/${id}${force ? '?force=true' : ''}`),
    onSuccess: invalidate,
    onError: setError,
  });

  function handleFiles(files) {
    if (files && files.length) upload.mutate(files);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>🎬 مكتبة الميديا</h1>
          <div className="sub">
            {data ? `${data.total} ملف` : '...'} — الملفات بتتخزن مرة واحدة حتى لو رفعتها أكتر من مرة
          </div>
        </div>
      </div>

      <ErrorBox error={error} onDismiss={() => setError(null)} />

      <div
        className={`dropzone${dragOver ? ' over' : ''}`}
        onClick={() => fileInput.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <div style={{ fontSize: '1.8rem' }}>⬆</div>
        <div style={{ fontWeight: 700 }}>
          {upload.isPending ? 'جاري الرفع...' : 'اسحب الملفات هنا أو اضغط للاختيار'}
        </div>
        <div className="small">صوت (mp3, wav, ogg) أو صور (png, jpg, webp)</div>
      </div>

      <input
        ref={fileInput}
        type="file"
        multiple
        accept="audio/*,image/*"
        style={{ display: 'none' }}
        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
      />

      <div className="toolbar">
        <input
          type="text"
          placeholder="بحث بالاسم..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={kind} onChange={e => setKind(e.target.value)}>
          <option value="">كل الأنواع</option>
          <option value="audio">صوت</option>
          <option value="image">صور</option>
        </select>
      </div>

      {isLoading ? (
        <Loading />
      ) : !data.items.length ? (
        <Empty icon="📂" title="المكتبة فاضية">ارفع أول ملف من فوق.</Empty>
      ) : (
        <div className="media-grid">
          {data.items.map(asset => {
            const used = asset._count.questions + asset._count.examQuestions;
            return (
              <div className="media-card" key={asset.id}>
                {asset.kind === 'image' ? (
                  <img src={asset.publicPath} alt={asset.originalName || ''} />
                ) : (
                  <audio controls src={asset.publicPath} preload="none" />
                )}

                <div className="media-name" title={asset.originalName || asset.filename}>
                  {asset.originalName || asset.filename}
                </div>

                <div className="small muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{formatSize(asset.sizeBytes)}</span>
                  <DateText value={asset.createdAt} />
                </div>

                <div className="btn-row" style={{ marginTop: '0.5rem', justifyContent: 'space-between' }}>
                  {used > 0 ? (
                    <span className="badge badge-gold">مستخدم في {used}</span>
                  ) : (
                    <span className="badge">غير مستخدم</span>
                  )}
                  <ConfirmButton
                    message={used > 0 ? `مستخدم في ${used} سؤال!` : 'حذف نهائي؟'}
                    onConfirm={() => remove.mutate({ id: asset.id, force: used > 0 })}
                  >
                    حذف
                  </ConfirmButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
