/* ================================================================
   STRATEGY-EDITOR.JSX — محرّر الاستراتيجية بكل بلوكاتها
   ----------------------------------------------------------------
   البلوكات (keywords / formulas / exception) بتتبعت داخل `blocks`.
   مهم: المفتاح اللي مالوش عناصر بيتشال من blocks خالص — الواجهة
   بتفحص وجود المفتاح مش قيمته (s.keywords && s.keywords.length).
   ================================================================ */
import { useState } from 'react';
import { ErrorBox, Modal } from './ui.jsx';

const THEMES = [
  { value: 'sc-theme-blue', label: 'أزرق' },
  { value: 'sc-theme-green', label: 'أخضر' },
  { value: 'sc-theme-red', label: 'أحمر' },
  { value: 'sc-theme-purple', label: 'بنفسجي' },
  { value: 'sc-theme-orange', label: 'برتقالي' },
  { value: 'sc-theme-teal', label: 'فيروزي' },
];

/** معاينة حيّة للـ HTML المسموح — الأدمن يشوف النتيجة قبل الحفظ. */
function Preview({ html }) {
  if (!html) return null;
  return (
    <div className="preview-box" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function RichField({ label, hint, value, onChange, rows = 2, preview = true }) {
  return (
    <div className="field">
      <label>{label}</label>
      {hint && <span className="hint">{hint}</span>}
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} />
      {preview && <Preview html={value} />}
    </div>
  );
}

/** محرّر مصفوفة كائنات — لكل صف نفس الحقول. */
function ObjectListEditor({ label, hint, items, fields, onChange, emptyItem }) {
  const update = (i, key, val) =>
    onChange(items.map((it, j) => (j === i ? { ...it, [key]: val } : it)));

  return (
    <div className="subsection">
      <h4>
        <span>{label} <span className="muted">({items.length})</span></span>
        <button
          className="btn btn-sm"
          type="button"
          onClick={() => onChange([...items, { ...emptyItem }])}
        >
          + إضافة
        </button>
      </h4>
      {hint && <div className="hint" style={{ marginBottom: '0.5rem' }}>{hint}</div>}

      {items.length === 0 ? (
        <div className="small muted">مفيش عناصر — المفتاح ده مش هيظهر في الموقع.</div>
      ) : (
        <div className="repeat-list">
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.6rem 0.7rem',
                background: 'var(--surface)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span className="small muted num">#{i + 1}</span>
                <button
                  className="btn btn-sm btn-icon"
                  type="button"
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                  title="حذف"
                >
                  ✕
                </button>
              </div>
              {fields.map(f => (
                <div className="field" key={f.key} style={{ marginBottom: '0.5rem' }}>
                  <label>{f.label}</label>
                  {f.multiline ? (
                    <textarea
                      value={item[f.key] || ''}
                      onChange={e => update(i, f.key, e.target.value)}
                      rows={2}
                      className={f.ltr ? 'ltr' : undefined}
                    />
                  ) : (
                    <input
                      type="text"
                      value={item[f.key] || ''}
                      onChange={e => update(i, f.key, e.target.value)}
                      className={f.ltr ? 'ltr' : undefined}
                      placeholder={f.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function strategyToForm(s) {
  const blocks = s?.blocks || {};
  return {
    theme: s?.theme || 'sc-theme-blue',
    icon: s?.icon || '',
    title: s?.title || '',
    subtitle: s?.subtitle || '',
    badge: s?.badge || '',
    usage: s?.usage || '',
    videoUrl: s?.videoUrl || '',
    tip: s?.tip || '',
    keywords: Array.isArray(blocks.keywords) ? blocks.keywords : [],
    formulas: Array.isArray(blocks.formulas) ? blocks.formulas : [],
    // exception كائن واحد مش مصفوفة
    hasException: !!(blocks.exception && (blocks.exception.title || blocks.exception.body)),
    exceptionTitle: blocks.exception?.title || '',
    exceptionBody: blocks.exception?.body || '',
    // البلوكات اللي مالهاش محرّر بتتحفظ زي ما هي
    passthrough: Object.fromEntries(
      Object.entries(blocks).filter(([k]) => !['keywords', 'formulas', 'exception'].includes(k))
    ),
  };
}

function formToPayload(form) {
  const blocks = { ...form.passthrough };

  // المفتاح بيتحط بس لو فيه محتوى فعلي — الفاضي بيتشال عشان
  // الواجهة ما ترسمش قسماً فاضياً
  const keywords = form.keywords.filter(k => (k.f || '').trim() || (k.b || '').trim());
  if (keywords.length) blocks.keywords = keywords;

  const formulas = form.formulas.filter(f => (f.subj || '').trim() || (f.form || '').trim());
  if (formulas.length) blocks.formulas = formulas.map(f => ({ ...f, note: f.note || '' }));

  if (form.hasException && (form.exceptionTitle.trim() || form.exceptionBody.trim())) {
    blocks.exception = { title: form.exceptionTitle, body: form.exceptionBody };
  }

  return {
    theme: form.theme || null,
    icon: form.icon || null,
    title: form.title,
    subtitle: form.subtitle || null,
    badge: form.badge || null,
    usage: form.usage || null,
    videoUrl: form.videoUrl || null,
    tip: form.tip || null,
    blocks,
  };
}

export default function StrategyEditor({ initial, onSave, onClose, saving, error }) {
  const [form, setForm] = useState(() => strategyToForm(initial));
  const [tab, setTab] = useState('basic');

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  return (
    <Modal
      title={initial ? `تحرير: ${initial.title}` : 'استراتيجية جديدة'}
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose} type="button">إلغاء</button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={saving || !form.title.trim()}
            onClick={() => onSave(formToPayload(form))}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </>
      }
    >
      <ErrorBox error={error} />

      <div className="tabs">
        <button className={`tab${tab === 'basic' ? ' active' : ''}`} onClick={() => setTab('basic')} type="button">
          الأساسيات
        </button>
        <button className={`tab${tab === 'keywords' ? ' active' : ''}`} onClick={() => setTab('keywords')} type="button">
          الكلمات الدالة <span className="count">{form.keywords.length}</span>
        </button>
        <button className={`tab${tab === 'formulas' ? ' active' : ''}`} onClick={() => setTab('formulas')} type="button">
          الصيغ <span className="count">{form.formulas.length}</span>
        </button>
        <button className={`tab${tab === 'extra' ? ' active' : ''}`} onClick={() => setTab('extra')} type="button">
          الاستثناء والفيديو
        </button>
      </div>

      {tab === 'basic' && (
        <>
          <div className="field-row">
            <div className="field" style={{ flex: '0 0 80px' }}>
              <label>الأيقونة</label>
              <input type="text" value={form.icon} onChange={e => set('icon', e.target.value)} maxLength={4} />
            </div>
            <div className="field">
              <label>العنوان *</label>
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>العنوان الفرعي</label>
              <input type="text" className="ltr" value={form.subtitle} onChange={e => set('subtitle', e.target.value)} />
            </div>
            <div className="field">
              <label>الشارة</label>
              <input type="text" value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="Tense 1/6" />
            </div>
          </div>

          <div className="field">
            <label>لون البطاقة</label>
            <select value={form.theme} onChange={e => set('theme', e.target.value)}>
              {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <RichField
            label="الاستخدام / الشرح"
            hint="مسموح بـ <strong> و <em> و <br> و <span dir=&quot;ltr&quot;>"
            value={form.usage}
            onChange={v => set('usage', v)}
            rows={3}
          />
        </>
      )}

      {tab === 'keywords' && (
        <ObjectListEditor
          label="الكلمات الدالة"
          hint="بتظهر كبطاقات صغيرة — الوجه بالإنجليزي والظهر بالعربي"
          items={form.keywords}
          onChange={v => set('keywords', v)}
          emptyItem={{ f: '', b: '' }}
          fields={[
            { key: 'f', label: 'الكلمة (الوجه)', ltr: true, placeholder: 'Always' },
            { key: 'b', label: 'المعنى (الظهر)', placeholder: 'دائماً — 100%' },
          ]}
        />
      )}

      {tab === 'formulas' && (
        <ObjectListEditor
          label="الصيغ"
          hint="جدول الفاعل / التركيب / المثال"
          items={form.formulas}
          onChange={v => set('formulas', v)}
          emptyItem={{ subj: '', form: '', ex: '', note: '' }}
          fields={[
            { key: 'subj', label: 'الفاعل / الحالة', placeholder: 'He / She / It' },
            { key: 'form', label: 'التركيب', placeholder: 'verb + s/es' },
            { key: 'ex', label: 'المثال', multiline: true, ltr: true },
            { key: 'note', label: 'ملاحظة (اختياري)' },
          ]}
        />
      )}

      {tab === 'extra' && (
        <>
          <div className="subsection">
            <h4>
              <span>صندوق الاستثناء / القاعدة</span>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.hasException}
                  onChange={e => set('hasException', e.target.checked)}
                />
                مفعّل
              </label>
            </h4>

            {form.hasException && (
              <>
                <div className="field">
                  <label>العنوان</label>
                  <input
                    type="text"
                    value={form.exceptionTitle}
                    onChange={e => set('exceptionTitle', e.target.value)}
                    placeholder="⚠️ كيف تضيف (s/es) للمفرد؟"
                  />
                </div>
                <RichField
                  label="المحتوى"
                  hint="كل سطر يتفصل بـ <br> — أول <strong> في السطر بيبقى شارة"
                  value={form.exceptionBody}
                  onChange={v => set('exceptionBody', v)}
                  rows={5}
                />
              </>
            )}
          </div>

          <div className="field">
            <label>رابط فيديو الشرح</label>
            <span className="hint">يوتيوب أو رابط mp4 مباشر</span>
            <input
              type="text"
              className="ltr"
              value={form.videoUrl}
              onChange={e => set('videoUrl', e.target.value)}
            />
          </div>

          <RichField
            label="نصيحة"
            value={form.tip}
            onChange={v => set('tip', v)}
            rows={2}
          />

          {Object.keys(form.passthrough).length > 0 && (
            <div className="alert alert-info">
              ℹ️ الاستراتيجية دي فيها بلوكات مالهاش محرّر هنا
              (<code>{Object.keys(form.passthrough).join(', ')}</code>) — هتتحفظ زي ما هي من غير تغيير.
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
