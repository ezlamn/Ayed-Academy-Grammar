/* ================================================================
   UI.JSX — مكوّنات صغيرة مشتركة
   ================================================================ */
import { useEffect, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import HeadphonesIcon from '@mui/icons-material/Headphones';

export function Loading({ label = 'جاري التحميل...' }) {
  return <div className="loading"><span className="spinner" /> {label}</div>;
}

export function Empty({ icon = <InboxOutlinedIcon fontSize="inherit" />, title, children }) {
  return (
    <div className="empty">
      <span className="ico">{icon}</span>
      {title && <h3>{title}</h3>}
      {children && <p className="small">{children}</p>}
    </div>
  );
}

/** يعرض رسالة الخطأ مع تفاصيل التحقق لو موجودة. */
export function ErrorBox({ error, onDismiss }) {
  if (!error) return null;
  return (
    <div className="alert alert-error">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span><WarningAmberIcon fontSize="inherit" /> {error.message}</span>
        {onDismiss && (
          <button className="btn btn-sm" onClick={onDismiss} type="button">إغلاق</button>
        )}
      </div>
      {Array.isArray(error.details) && error.details.length > 0 && (
        <ul>
          {error.details.map((d, i) => (
            <li key={i}><code>{d.field}</code>: {d.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }) {
  // Escape بيقفل، والتمرير في الخلفية بيتوقف
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={wide ? { maxWidth: 900 } : undefined}>
        <div className="modal-head">
          <span>{title}</span>
          <button className="btn btn-icon" onClick={onClose} type="button" aria-label="إغلاق"><CloseIcon fontSize="inherit" /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/** تأكيد قبل إجراء لا رجعة فيه. */
export function ConfirmButton({ onConfirm, children, message, className = 'btn btn-sm btn-danger', ...rest }) {
  const [armed, setArmed] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (armed) {
    return (
      <span className="btn-row" style={{ gap: '0.3rem' }}>
        <span className="small muted">{message || 'متأكد؟'}</span>
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={() => { clearTimeout(timer.current); setArmed(false); onConfirm(); }}
        >
          نعم
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => { clearTimeout(timer.current); setArmed(false); }}
        >
          لا
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        setArmed(true);
        // بيرجع لحالته لو الأدمن سابه — عشان ما يفضلش "مسلّح"
        timer.current = setTimeout(() => setArmed(false), 6000);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/** شريط نسبة بلون حسب القيمة. */
export function PercentBar({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const tone = pct < 50 ? 'low' : pct < 75 ? 'mid' : 'high';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <span className={`bar ${tone}`} style={{ flex: 1 }}><i style={{ width: `${pct}%` }} /></span>
      <span className="num small nowrap">{pct}%</span>
    </span>
  );
}

/** تاريخ بصيغة عربية مختصرة. */
export function DateText({ value, fallback = '—' }) {
  if (!value) return <span className="muted">{fallback}</span>;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return <span className="muted">{fallback}</span>;
  return (
    <span className="small nowrap" title={d.toLocaleString('ar-EG')}>
      {d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
    </span>
  );
}

/** ينزع وسوم HTML لعرض نص المحتوى في الجداول والقوائم. */
export function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export const TRACK_LABELS = {
  grammar: 'الجرامر',
  reading: 'الريدينج',
  listening: 'الليسينينج',
};

export const TRACK_ICONS = {
  grammar: <MenuBookIcon fontSize="inherit" />,
  reading: <AutoStoriesIcon fontSize="inherit" />,
  listening: <HeadphonesIcon fontSize="inherit" />,
};

export const SECTION_LABELS = {
  listening: 'الاستماع',
  reading: 'القراءة',
  grammar: 'القواعد',
  writing: 'الكتابة',
};

export const KIND_LABELS = {
  mcq: 'اختيار من متعدد',
  fill: 'إكمال فراغ',
  order: 'ترتيب كلمات',
};
