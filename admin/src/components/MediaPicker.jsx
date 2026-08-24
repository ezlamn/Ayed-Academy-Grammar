/* ================================================================
   MEDIA-PICKER.JSX — اختيار ملف من المكتبة (أو رفع واحد جديد)
   ================================================================ */
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, qs } from '../lib/api';
import { Empty, ErrorBox, Loading, Modal } from './ui.jsx';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

export default function MediaPicker({ kind, onPick, onClose }) {
  const qc = useQueryClient();
  const fileInput = useRef(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['media', kind, search],
    queryFn: () => api.get('/admin/media' + qs({ kind, q: search, take: 60 })),
  });

  const upload = useMutation({
    mutationFn: files => {
      const fd = new FormData();
      for (const f of files) fd.append('files', f);
      return api.post('/admin/media', fd);
    },
    onSuccess: assets => {
      qc.invalidateQueries({ queryKey: ['media'] });
      // الرفع من هنا معناه إن الأدمن عايز الملف ده — نختاره فوراً
      if (assets && assets.length) onPick(assets[0]);
    },
    onError: setError,
  });

  return (
    <Modal
      title={kind === 'audio' ? 'اختر مقطعاً صوتياً' : 'اختر صورة'}
      onClose={onClose}
      wide
      footer={<button className="btn" onClick={onClose} type="button">إغلاق</button>}
    >
      <ErrorBox error={error} onDismiss={() => setError(null)} />

      <div className="toolbar">
        <input
          type="text"
          placeholder="بحث بالاسم..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="spacer" />
        <input
          ref={fileInput}
          type="file"
          accept={kind === 'audio' ? 'audio/*' : 'image/*'}
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files?.length) upload.mutate(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={upload.isPending}
        >
          {upload.isPending ? 'جاري الرفع...' : <><CloudUploadIcon fontSize="inherit" /> رفع ملف جديد</>}
        </button>
      </div>

      {isLoading ? (
        <Loading />
      ) : !data?.items.length ? (
        <Empty icon={<FolderOpenIcon fontSize="inherit" />} title="المكتبة فاضية">ارفع ملفاً جديداً من الزر فوق.</Empty>
      ) : (
        <div className="media-grid">
          {data.items.map(asset => (
            <div className="media-card" key={asset.id}>
              {asset.kind === 'image' ? (
                <img src={asset.publicPath} alt={asset.originalName || ''} />
              ) : (
                <audio controls src={asset.publicPath} preload="none" />
              )}
              <div className="media-name" title={asset.originalName || asset.filename}>
                {asset.originalName || asset.filename}
              </div>
              <button
                className="btn btn-sm btn-primary"
                type="button"
                style={{ width: '100%', marginTop: '0.4rem' }}
                onClick={() => onPick(asset)}
              >
                اختيار
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
