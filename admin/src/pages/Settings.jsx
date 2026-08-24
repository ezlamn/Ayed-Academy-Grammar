import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth.jsx';
import { ErrorBox, Loading } from '../components/ui.jsx';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function ConfigSection() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['config'],
    queryFn: () => api.get('/admin/config'),
  });

  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // البيانات بتوصل بعد أول رندر — نملأ النموذج أول ما تيجي
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: body => api.patch('/admin/config', body),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      refetch();
    },
    onError: setError,
  });

  if (isLoading) return <Loading />;

  return (
    <div className="card card-pad" style={{ maxWidth: 700, marginBottom: '1.2rem' }}>
      <h3 style={{ marginBottom: '0.9rem' }}>إعدادات الموقع</h3>

      <ErrorBox error={error} onDismiss={() => setError(null)} />
      {saved && <div className="alert alert-ok"><CheckCircleIcon fontSize="inherit" /> اتحفظت</div>}

      <div className="field">
        <label>رابط الفيديو التعريفي</label>
        <span className="hint">بيظهر في صفحة البداية للطالب</span>
        <input
          type="text"
          className="ltr"
          value={form.introVideoUrl || ''}
          onChange={e => setForm(f => ({ ...f, introVideoUrl: e.target.value }))}
        />
      </div>

      {/* أي مفاتيح إعدادات أخرى موجودة في الداتابيز بتظهر تلقائياً */}
      {Object.keys(form)
        .filter(k => k !== 'introVideoUrl')
        .map(key => (
          <div className="field" key={key}>
            <label className="ltr">{key}</label>
            <input
              type="text"
              className="ltr"
              value={typeof form[key] === 'string' ? form[key] : JSON.stringify(form[key])}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}

      <button
        className="btn btn-primary"
        type="button"
        disabled={save.isPending}
        onClick={() => save.mutate(form)}
      >
        {save.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
      </button>
    </div>
  );
}

function PasswordSection() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const change = useMutation({
    mutationFn: () => api.post('/auth/admin/change-password', {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    }),
    onSuccess: () => {
      setDone(true);
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => setDone(false), 3500);
    },
    onError: setError,
  });

  const mismatch = form.newPassword && form.confirm && form.newPassword !== form.confirm;
  const canSubmit = form.currentPassword && form.newPassword.length >= 8 && !mismatch;

  return (
    <div className="card card-pad" style={{ maxWidth: 700 }}>
      <h3 style={{ marginBottom: '0.9rem' }}>تغيير كلمة المرور</h3>

      <ErrorBox error={error} onDismiss={() => setError(null)} />
      {done && <div className="alert alert-ok"><CheckCircleIcon fontSize="inherit" /> اتغيّرت كلمة المرور</div>}

      <div className="field">
        <label>كلمة المرور الحالية</label>
        <input
          type="password"
          value={form.currentPassword}
          onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
          autoComplete="current-password"
        />
      </div>
      <div className="field">
        <label>كلمة المرور الجديدة</label>
        <span className="hint">8 أحرف على الأقل</span>
        <input
          type="password"
          value={form.newPassword}
          onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
          autoComplete="new-password"
        />
      </div>
      <div className="field">
        <label>تأكيد كلمة المرور</label>
        <input
          type="password"
          value={form.confirm}
          onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
          autoComplete="new-password"
        />
        {mismatch && <span className="hint" style={{ color: 'var(--red)' }}>الكلمتان غير متطابقتين</span>}
      </div>

      <button
        className="btn btn-primary"
        type="button"
        disabled={!canSubmit || change.isPending}
        onClick={() => change.mutate()}
      >
        {change.isPending ? 'جاري التغيير...' : 'تغيير'}
      </button>
    </div>
  );
}

export default function Settings() {
  const { admin } = useAuth();

  return (
    <>
      <div className="page-head">
        <div>
          <h1><SettingsIcon fontSize="inherit" /> الإعدادات</h1>
          <div className="sub ltr">{admin?.email}</div>
        </div>
      </div>

      <ConfigSection />
      <PasswordSection />
    </>
  );
}
