/* ================================================================
   QUESTION-EDITOR.JSX — محرّر سؤال بأنواعه التلاتة
   ----------------------------------------------------------------
   mcq   → اختيارات + تحديد الصحيح
   fill  → إجابات مقبولة
   order → كلمات بترتيبها الصحيح
   الحقول بتتبدّل حسب النوع لأن السيرفر بيتحقق بـ discriminated union.
   ================================================================ */
import { useState } from 'react';
import { Modal, ErrorBox, KIND_LABELS } from './ui.jsx';
import MediaPicker from './MediaPicker.jsx';

const EMPTY = {
  kind: 'mcq',
  text: '',
  opts: ['', ''],
  correctIndex: 0,
  answers: [''],
  tokens: ['', ''],
  explanation: '',
  audioAssetId: null,
  // نحتفظ بالسجل كامل عشان نقدر نشغّل الصوت في المحرّر
  audioAsset: null,
  audioUrl: '',
  imgUrl: '',
  passageId: '',
  passageText: '',
};

/** يحوّل سجل السيرفر لحالة النموذج، بقيم افتراضية للحقول الفاضية. */
export function questionToForm(q) {
  if (!q) return { ...EMPTY };
  return {
    kind: q.kind || 'mcq',
    text: q.text || '',
    opts: Array.isArray(q.opts) && q.opts.length ? q.opts : ['', ''],
    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
    answers: Array.isArray(q.answers) && q.answers.length ? q.answers : [''],
    tokens: Array.isArray(q.tokens) && q.tokens.length ? q.tokens : ['', ''],
    explanation: q.explanation || '',
    audioAssetId: q.audioAssetId ?? null,
    audioAsset: q.audioAsset ?? null,
    audioUrl: q.audioUrl || '',
    imgUrl: q.imgUrl || '',
    passageId: q.passageId || '',
    passageText: q.passageText || '',
  };
}

/** يبني جسم الطلب — بيبعت حقول الإجابة الخاصة بالنوع الحالي بس. */
export function formToPayload(form) {
  const common = {
    kind: form.kind,
    text: form.text,
    explanation: form.explanation || null,
    audioAssetId: form.audioAssetId || null,
    audioUrl: form.audioAssetId ? null : (form.audioUrl || null),
    imgUrl: form.imgUrl || null,
    passageId: form.passageId || null,
    passageText: form.passageText || null,
  };

  if (form.kind === 'fill') {
    return { ...common, answers: form.answers.map(a => a.trim()).filter(Boolean) };
  }
  if (form.kind === 'order') {
    return { ...common, tokens: form.tokens.map(t => t.trim()).filter(Boolean) };
  }
  return {
    ...common,
    opts: form.opts.map(o => o.trim()).filter(Boolean),
    correctIndex: form.correctIndex,
  };
}

function ListEditor({ label, hint, values, onChange, min = 1, max = 40, placeholder }) {
  const update = (i, v) => onChange(values.map((x, j) => (j === i ? v : x)));
  const add = () => onChange([...values, '']);
  const removeAt = i => onChange(values.filter((_, j) => j !== i));

  return (
    <div className="field">
      <label>{label}</label>
      {hint && <span className="hint">{hint}</span>}
      <div className="repeat-list">
        {values.map((v, i) => (
          <div className="repeat-row" key={i}>
            <input
              type="text"
              value={v}
              placeholder={placeholder}
              onChange={e => update(i, e.target.value)}
            />
            <button
              className="btn btn-sm btn-icon"
              type="button"
              onClick={() => removeAt(i)}
              disabled={values.length <= min}
              title="حذف"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        className="btn btn-sm"
        type="button"
        onClick={add}
        disabled={values.length >= max}
        style={{ alignSelf: 'flex-start', marginTop: '0.4rem' }}
      >
        + إضافة
      </button>
    </div>
  );
}

export default function QuestionEditor({
  title = 'سؤال',
  initial,
  onSave,
  onClose,
  saving,
  error,
  showPassage = false,
  allowKindChange = true,
}) {
  const [form, setForm] = useState(() => questionToForm(initial));
  const [pickingMedia, setPickingMedia] = useState(false);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const setOpt = (i, v) => set('opts', form.opts.map((o, j) => (j === i ? v : o)));

  const addOpt = () => {
    if (form.opts.length >= 6) return;
    set('opts', [...form.opts, '']);
  };

  const removeOpt = i => {
    if (form.opts.length <= 2) return;
    const opts = form.opts.filter((_, j) => j !== i);
    // لو اتحذف الاختيار الصحيح أو واحد قبله، لازم نضبط المؤشر
    let correctIndex = form.correctIndex;
    if (i === form.correctIndex) correctIndex = 0;
    else if (i < form.correctIndex) correctIndex -= 1;
    setForm(f => ({ ...f, opts, correctIndex }));
  };

  const canSave = form.text.trim() && (
    form.kind === 'mcq' ? form.opts.filter(o => o.trim()).length >= 2
      : form.kind === 'fill' ? form.answers.some(a => a.trim())
        : form.tokens.filter(t => t.trim()).length >= 2
  );

  return (
    <Modal
      title={title}
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose} type="button">إلغاء</button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={saving || !canSave}
            onClick={() => onSave(formToPayload(form))}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </>
      }
    >
      <ErrorBox error={error} />

      {allowKindChange && (
        <div className="field">
          <label>نوع السؤال</label>
          <select value={form.kind} onChange={e => set('kind', e.target.value)}>
            {Object.entries(KIND_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label>نص السؤال *</label>
        <span className="hint">مسموح بوسوم بسيطة: &lt;strong&gt; &lt;em&gt; &lt;br&gt;</span>
        <textarea value={form.text} onChange={e => set('text', e.target.value)} rows={2} />
      </div>

      {form.kind === 'mcq' && (
        <div className="field">
          <label>الاختيارات — حدّد الإجابة الصحيحة</label>
          {form.opts.map((opt, i) => (
            <div className={`opt-row${i === form.correctIndex ? ' correct' : ''}`} key={i}>
              <input
                type="radio"
                name="correct"
                checked={i === form.correctIndex}
                onChange={() => set('correctIndex', i)}
                title="الإجابة الصحيحة"
              />
              <input
                type="text"
                value={opt}
                onChange={e => setOpt(i, e.target.value)}
                placeholder={`الاختيار ${i + 1}`}
              />
              <button
                className="btn btn-sm btn-icon"
                type="button"
                onClick={() => removeOpt(i)}
                disabled={form.opts.length <= 2}
                title="حذف"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="btn btn-sm"
            type="button"
            onClick={addOpt}
            disabled={form.opts.length >= 6}
            style={{ alignSelf: 'flex-start', marginTop: '0.3rem' }}
          >
            + اختيار
          </button>
        </div>
      )}

      {form.kind === 'fill' && (
        <ListEditor
          label="الإجابات المقبولة"
          hint="أي إجابة من دول تُحتسب صحيحة"
          values={form.answers}
          onChange={v => set('answers', v)}
          placeholder="goes"
        />
      )}

      {form.kind === 'order' && (
        <ListEditor
          label="الكلمات بالترتيب الصحيح"
          hint="الطالب هيشوفها مخلوطة ويرتّبها"
          values={form.tokens}
          onChange={v => set('tokens', v)}
          min={2}
          placeholder="She"
        />
      )}

      <div className="field">
        <label>الشرح</label>
        <textarea value={form.explanation} onChange={e => set('explanation', e.target.value)} rows={2} />
      </div>

      <div className="subsection">
        <h4>وسائط (اختياري)</h4>

        <div className="field">
          <label>مقطع صوتي</label>
          {form.audioAssetId ? (
            <div>
              {form.audioAsset?.publicPath && (
                <audio controls src={form.audioAsset.publicPath} style={{ width: '100%', marginBottom: '0.4rem' }} />
              )}
              <div className="btn-row">
                <span className="badge badge-green">
                  {form.audioAsset?.originalName || `ملف #${form.audioAssetId}`}
                </span>
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => setForm(f => ({ ...f, audioAssetId: null, audioAsset: null }))}
                >
                  إزالة
                </button>
              </div>
            </div>
          ) : (
            <div className="btn-row">
              <input
                type="text"
                className="ltr"
                value={form.audioUrl}
                onChange={e => set('audioUrl', e.target.value)}
                placeholder="رابط خارجي أو اختر من المكتبة"
              />
              <button className="btn btn-sm" type="button" onClick={() => setPickingMedia(true)}>
                من المكتبة
              </button>
            </div>
          )}
        </div>

        <div className="field mb0">
          <label>رابط صورة</label>
          <input
            type="text"
            className="ltr"
            value={form.imgUrl}
            onChange={e => set('imgUrl', e.target.value)}
            placeholder="/uploads/images/..."
          />
        </div>
      </div>

      {showPassage && (
        <div className="subsection">
          <h4>القطعة (للريدينج)</h4>
          <div className="field">
            <label>معرّف القطعة</label>
            <span className="hint">الأسئلة اللي ليها نفس المعرّف بتتجمّع مع بعض في الامتحان</span>
            <input
              type="text"
              className="ltr"
              value={form.passageId}
              onChange={e => set('passageId', e.target.value)}
              placeholder="r2-p1-q1"
            />
          </div>
          <div className="field mb0">
            <label>نص القطعة</label>
            <textarea
              value={form.passageText}
              onChange={e => set('passageText', e.target.value)}
              rows={5}
              className="ltr"
            />
          </div>
        </div>
      )}

      {pickingMedia && (
        <MediaPicker
          kind="audio"
          onPick={asset => {
            setForm(f => ({ ...f, audioAssetId: asset.id, audioAsset: asset, audioUrl: '' }));
            setPickingMedia(false);
          }}
          onClose={() => setPickingMedia(false)}
        />
      )}
    </Modal>
  );
}
