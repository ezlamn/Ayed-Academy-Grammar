import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../lib/api';
import SortableList from '../components/SortableList.jsx';
import StrategyEditor from '../components/StrategyEditor.jsx';
import QuestionEditor from '../components/QuestionEditor.jsx';
import {
  ConfirmButton, Empty, ErrorBox, KIND_LABELS, Loading,
  TRACK_LABELS, stripHtml,
} from '../components/ui.jsx';

/* ── تبويب: معلومات الوحدة ───────────────────────────────── */

function InfoTab({ unit, onSave, saving }) {
  const [form, setForm] = useState({
    emoji: unit.emoji || '',
    nameAr: unit.nameAr || '',
    nameEn: unit.nameEn || '',
    title: unit.title || '',
    type: unit.type || '',
    tag: unit.tag || '',
    mascot: unit.mascot || '',
    published: unit.published,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isReading = unit.track === 'reading';

  return (
    <div className="card card-pad" style={{ maxWidth: 700 }}>
      <div className="field-row">
        <div className="field" style={{ flex: '0 0 90px' }}>
          <label>الأيقونة</label>
          <input type="text" value={form.emoji} onChange={e => set('emoji', e.target.value)} maxLength={4} />
        </div>
        <div className="field">
          <label>الاسم بالعربي</label>
          <input type="text" value={form.nameAr} onChange={e => set('nameAr', e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>الاسم بالإنجليزي</label>
        <input type="text" className="ltr" value={form.nameEn} onChange={e => set('nameEn', e.target.value)} />
      </div>

      {isReading && (
        <div className="field">
          <label>العنوان الكامل</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)} />
        </div>
      )}

      <div className="field-row">
        {!isReading && (
          <>
            <div className="field">
              <label>وسم الوحدة</label>
              <input type="text" value={form.tag} onChange={e => set('tag', e.target.value)} placeholder="الوحدة الأولى" />
            </div>
            <div className="field" style={{ flex: '0 0 90px' }}>
              <label>التميمة</label>
              <input type="text" value={form.mascot} onChange={e => set('mascot', e.target.value)} maxLength={4} />
            </div>
          </>
        )}
        <div className="field">
          <label>النوع</label>
          <span className="hint">
            {unit.track === 'listening'
              ? '«vocabulary» يخلّيها وحدة بطاقات مفردات'
              : '«vocab» أو «reading_strategy»'}
          </span>
          <input type="text" className="ltr" value={form.type} onChange={e => set('type', e.target.value)} />
        </div>
      </div>

      <label className="checkbox" style={{ marginBottom: '1rem' }}>
        <input type="checkbox" checked={form.published} onChange={e => set('published', e.target.checked)} />
        منشورة على الموقع
      </label>

      <button className="btn btn-primary" type="button" disabled={saving} onClick={() => onSave(form)}>
        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
      </button>
    </div>
  );
}

/* ── تبويب: الاستراتيجيات ────────────────────────────────── */

function StrategiesTab({ unit, refetch, setError }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // {strategy} | 'new'
  const [questionFor, setQuestionFor] = useState(null); // {strategy, question}
  const [expanded, setExpanded] = useState(() => new Set());
  const [mutationError, setMutationError] = useState(null);

  const done = () => {
    setEditing(null);
    setQuestionFor(null);
    setMutationError(null);
    refetch();
    qc.invalidateQueries({ queryKey: ['units', unit.track] });
  };

  const saveStrategy = useMutation({
    mutationFn: body =>
      editing === 'new'
        ? api.post('/admin/strategies', { unitId: unit.id, ...body })
        : api.patch(`/admin/strategies/${editing.id}`, body),
    onSuccess: done,
    onError: setMutationError,
  });

  const removeStrategy = useMutation({
    mutationFn: id => api.delete(`/admin/strategies/${id}`),
    onSuccess: done,
    onError: setError,
  });

  const reorderStrategies = useMutation({
    mutationFn: ids => api.patch(`/admin/strategies/reorder/${unit.id}`, { ids }),
    onSuccess: done,
    onError: setError,
  });

  const saveQuestion = useMutation({
    mutationFn: body =>
      questionFor.question
        ? api.patch(`/admin/questions/${questionFor.question.id}`, body)
        : api.post('/admin/questions', {
          unitId: unit.id,
          strategyId: questionFor.strategy.id,
          ...body,
        }),
    onSuccess: done,
    onError: setMutationError,
  });

  const removeQuestion = useMutation({
    mutationFn: id => api.delete(`/admin/questions/${id}`),
    onSuccess: done,
    onError: setError,
  });

  const reorderQuestions = useMutation({
    mutationFn: ({ strategyId, ids }) => api.patch('/admin/questions/reorder', { strategyId, ids }),
    onSuccess: done,
    onError: setError,
  });

  const toggle = id => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <>
      <div className="toolbar">
        <span className="muted small">{unit.strategies.length} استراتيجية — اسحب من ⋮⋮ لإعادة الترتيب</span>
        <div className="spacer" />
        <button className="btn btn-primary btn-sm" type="button" onClick={() => setEditing('new')}>
          + استراتيجية جديدة
        </button>
      </div>

      <div className="card">
        {unit.strategies.length === 0 ? (
          <Empty icon="🧩" title="مفيش استراتيجيات">أضف أول استراتيجية للوحدة.</Empty>
        ) : (
          <SortableList
            items={unit.strategies}
            onReorder={ids => reorderStrategies.mutate(ids)}
            renderItem={s => (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <span style={{ fontSize: '1.15rem' }}>{s.icon || '🧩'}</span>
                  <div className="item-main">
                    <div className="item-title">{stripHtml(s.title)}</div>
                    <div className="item-sub ltr">{s.subtitle}</div>
                  </div>

                  <div className="btn-row" style={{ gap: '0.3rem' }}>
                    <span className="badge">{s.questions.length} تمرين</span>
                    <button className="btn btn-sm" type="button" onClick={() => toggle(s.id)}>
                      {expanded.has(s.id) ? '▲ إخفاء' : '▼ التمارين'}
                    </button>
                    <button className="btn btn-sm" type="button" onClick={() => setEditing(s)}>تحرير</button>
                    <ConfirmButton
                      message="مع كل تمارينها"
                      onConfirm={() => removeStrategy.mutate(s.id)}
                    >
                      حذف
                    </ConfirmButton>
                  </div>
                </div>

                {expanded.has(s.id) && (
                  <div style={{
                    marginTop: '0.7rem',
                    paddingTop: '0.7rem',
                    borderTop: '1px dashed var(--border)',
                  }}>
                    {s.questions.length === 0 ? (
                      <div className="small muted" style={{ marginBottom: '0.5rem' }}>مفيش تمارين.</div>
                    ) : (
                      <SortableList
                        items={s.questions}
                        onReorder={ids => reorderQuestions.mutate({ strategyId: s.id, ids })}
                        renderItem={(q, i) => (
                          <>
                            <span className="num small muted" style={{ width: '1.5rem' }}>{i + 1}</span>
                            <div className="item-main">
                              <div className="item-title" style={{ fontWeight: 600 }}>{stripHtml(q.text)}</div>
                              <div className="item-sub">
                                <span className="badge">{KIND_LABELS[q.kind]}</span>
                                {q.kind === 'mcq' && (
                                  <span style={{ marginInlineStart: '0.4rem' }}>
                                    ✓ {stripHtml(q.opts?.[q.correctIndex] ?? '')}
                                  </span>
                                )}
                                {q.audioAsset && <span className="badge" style={{ marginInlineStart: '0.4rem' }}>🔊</span>}
                              </div>
                            </div>
                            <div className="btn-row" style={{ gap: '0.3rem' }}>
                              <button
                                className="btn btn-sm"
                                type="button"
                                onClick={() => setQuestionFor({ strategy: s, question: q })}
                              >
                                تحرير
                              </button>
                              <ConfirmButton onConfirm={() => removeQuestion.mutate(q.id)}>حذف</ConfirmButton>
                            </div>
                          </>
                        )}
                      />
                    )}
                    <button
                      className="btn btn-sm"
                      type="button"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => setQuestionFor({ strategy: s, question: null })}
                    >
                      + تمرين جديد
                    </button>
                  </div>
                )}
              </div>
            )}
          />
        )}
      </div>

      {editing && (
        <StrategyEditor
          initial={editing === 'new' ? null : editing}
          onSave={body => saveStrategy.mutate(body)}
          onClose={() => { setEditing(null); setMutationError(null); }}
          saving={saveStrategy.isPending}
          error={mutationError}
        />
      )}

      {questionFor && (
        <QuestionEditor
          title={questionFor.question ? 'تحرير التمرين' : 'تمرين جديد'}
          initial={questionFor.question}
          showPassage={unit.track === 'reading'}
          onSave={body => saveQuestion.mutate(body)}
          onClose={() => { setQuestionFor(null); setMutationError(null); }}
          saving={saveQuestion.isPending}
          error={mutationError}
        />
      )}
    </>
  );
}

/* ── تبويب: كويزات الوحدة ────────────────────────────────── */

function QuizzesTab({ unit, refetch, setError }) {
  const [editing, setEditing] = useState(null); // question | 'new'
  const [mutationError, setMutationError] = useState(null);

  // كويزات الوحدة = الأسئلة اللي مش تابعة لاستراتيجية
  const quizzes = unit.questions.filter(q => q.strategyId === null);

  const done = () => { setEditing(null); setMutationError(null); refetch(); };

  const save = useMutation({
    mutationFn: body =>
      editing === 'new'
        ? api.post('/admin/questions', { unitId: unit.id, strategyId: null, ...body })
        : api.patch(`/admin/questions/${editing.id}`, body),
    onSuccess: done,
    onError: setMutationError,
  });

  const remove = useMutation({
    mutationFn: id => api.delete(`/admin/questions/${id}`),
    onSuccess: done,
    onError: setError,
  });

  const reorder = useMutation({
    mutationFn: ids => api.patch('/admin/questions/reorder', { unitId: unit.id, ids }),
    onSuccess: done,
    onError: setError,
  });

  return (
    <>
      <div className="toolbar">
        <span className="muted small">
          {quizzes.length} سؤال في الاختبار الشامل للوحدة
        </span>
        <div className="spacer" />
        <button className="btn btn-primary btn-sm" type="button" onClick={() => setEditing('new')}>
          + سؤال جديد
        </button>
      </div>

      <div className="card">
        {quizzes.length === 0 ? (
          <Empty icon="🎯" title="مفيش أسئلة">
            الاختبار الشامل مش هيظهر للطالب لحد ما تضيف أسئلة.
          </Empty>
        ) : (
          <SortableList
            items={quizzes}
            onReorder={ids => reorder.mutate(ids)}
            renderItem={(q, i) => (
              <>
                <span className="num small muted" style={{ width: '1.5rem' }}>{i + 1}</span>
                <div className="item-main">
                  <div className="item-title" style={{ fontWeight: 600 }}>{stripHtml(q.text)}</div>
                  <div className="item-sub">
                    <span className="badge">{KIND_LABELS[q.kind]}</span>
                    {q.kind === 'mcq' && (
                      <span style={{ marginInlineStart: '0.4rem' }}>
                        ✓ {stripHtml(q.opts?.[q.correctIndex] ?? '')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="btn-row" style={{ gap: '0.3rem' }}>
                  <button className="btn btn-sm" type="button" onClick={() => setEditing(q)}>تحرير</button>
                  <ConfirmButton onConfirm={() => remove.mutate(q.id)}>حذف</ConfirmButton>
                </div>
              </>
            )}
          />
        )}
      </div>

      {editing && (
        <QuestionEditor
          title={editing === 'new' ? 'سؤال جديد' : 'تحرير السؤال'}
          initial={editing === 'new' ? null : editing}
          showPassage={unit.track === 'reading'}
          onSave={body => save.mutate(body)}
          onClose={() => { setEditing(null); setMutationError(null); }}
          saving={save.isPending}
          error={mutationError}
        />
      )}
    </>
  );
}

/* ── تبويب: الفيديوهات ───────────────────────────────────── */

function VideosTab({ unit, refetch, setError }) {
  const [form, setForm] = useState({ title: '', url: '' });

  const add = useMutation({
    mutationFn: body => api.post('/admin/videos', { unitId: unit.id, ...body }),
    onSuccess: () => { setForm({ title: '', url: '' }); refetch(); },
    onError: setError,
  });

  const remove = useMutation({
    mutationFn: id => api.delete(`/admin/videos/${id}`),
    onSuccess: refetch,
    onError: setError,
  });

  const reorder = useMutation({
    mutationFn: ids => api.patch(`/admin/videos/reorder/${unit.id}`, { ids }),
    onSuccess: refetch,
    onError: setError,
  });

  return (
    <>
      <div className="card card-pad" style={{ marginBottom: '1rem', maxWidth: 700 }}>
        <div className="field-row" style={{ alignItems: 'flex-end' }}>
          <div className="field">
            <label>العنوان</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="فيديو تعريفي بالوحدة"
            />
          </div>
          <div className="field" style={{ flex: '2 1 260px' }}>
            <label>الرابط *</label>
            <input
              type="text"
              className="ltr"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div className="field" style={{ flex: '0 0 auto' }}>
            <button
              className="btn btn-primary"
              type="button"
              disabled={!form.url.trim() || add.isPending}
              onClick={() => add.mutate(form)}
            >
              + إضافة
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        {unit.videos.length === 0 ? (
          <Empty icon="🎥" title="مفيش فيديوهات">أضف رابط يوتيوب أو mp4 من فوق.</Empty>
        ) : (
          <SortableList
            items={unit.videos}
            onReorder={ids => reorder.mutate(ids)}
            renderItem={v => (
              <>
                <span style={{ fontSize: '1.1rem' }}>🎥</span>
                <div className="item-main">
                  <div className="item-title">{v.title || 'بدون عنوان'}</div>
                  <div className="item-sub ltr">{v.url}</div>
                </div>
                <ConfirmButton onConfirm={() => remove.mutate(v.id)}>حذف</ConfirmButton>
              </>
            )}
          />
        )}
      </div>
    </>
  );
}

/* ── تبويب: المفردات ─────────────────────────────────────── */

function VocabTab({ unit, refetch, setError }) {
  const [newCat, setNewCat] = useState({ title: '', color: '#0891b2' });
  const [bulkFor, setBulkFor] = useState(null);
  const [bulkText, setBulkText] = useState('');

  const addCat = useMutation({
    mutationFn: body => api.post('/admin/vocab/categories', { unitId: unit.id, ...body }),
    onSuccess: () => { setNewCat({ title: '', color: '#0891b2' }); refetch(); },
    onError: setError,
  });

  const removeCat = useMutation({
    mutationFn: id => api.delete(`/admin/vocab/categories/${id}`),
    onSuccess: refetch,
    onError: setError,
  });

  const removeWord = useMutation({
    mutationFn: id => api.delete(`/admin/vocab/words/${id}`),
    onSuccess: refetch,
    onError: setError,
  });

  const addBulk = useMutation({
    mutationFn: ({ categoryId, words }) => api.post('/admin/vocab/words/bulk', { categoryId, words }),
    onSuccess: () => { setBulkFor(null); setBulkText(''); refetch(); },
    onError: setError,
  });

  /** كل سطر: «english = عربي» أو «english - عربي» أو مفصول بتاب. */
  function parseBulk(text) {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split(/\t|\s+[=|]\s+|\s+-\s+/);
        return { en: (parts[0] || '').trim(), ar: (parts.slice(1).join(' ') || '').trim() };
      })
      .filter(w => w.en && w.ar);
  }

  const parsed = parseBulk(bulkText);

  return (
    <>
      <div className="card card-pad" style={{ marginBottom: '1rem', maxWidth: 700 }}>
        <div className="field-row" style={{ alignItems: 'flex-end' }}>
          <div className="field">
            <label>تصنيف جديد</label>
            <input
              type="text"
              value={newCat.title}
              onChange={e => setNewCat(c => ({ ...c, title: e.target.value }))}
              placeholder="Model 5"
            />
          </div>
          <div className="field" style={{ flex: '0 0 90px' }}>
            <label>اللون</label>
            <input
              type="color"
              value={newCat.color}
              onChange={e => setNewCat(c => ({ ...c, color: e.target.value }))}
              style={{ height: '2.3rem', padding: '0.2rem' }}
            />
          </div>
          <div className="field" style={{ flex: '0 0 auto' }}>
            <button
              className="btn btn-primary"
              type="button"
              disabled={!newCat.title.trim() || addCat.isPending}
              onClick={() => addCat.mutate(newCat)}
            >
              + إضافة
            </button>
          </div>
        </div>
      </div>

      {unit.vocabCategories.length === 0 ? (
        <div className="card"><Empty icon="🗂️" title="مفيش تصنيفات مفردات" /></div>
      ) : (
        <div className="grid grid-2">
          {unit.vocabCategories.map(cat => (
            <div className="card" key={cat.id}>
              <div className="card-head">
                <span style={{ color: cat.color }}>
                  {cat.title} <span className="muted small">({cat.words.length})</span>
                </span>
                <div className="btn-row" style={{ gap: '0.3rem' }}>
                  <button
                    className="btn btn-sm"
                    type="button"
                    onClick={() => { setBulkFor(cat.id); setBulkText(''); }}
                  >
                    + كلمات
                  </button>
                  <ConfirmButton onConfirm={() => removeCat.mutate(cat.id)}>حذف</ConfirmButton>
                </div>
              </div>

              {bulkFor === cat.id && (
                <div className="card-pad" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="field">
                    <label>الصق الكلمات — سطر لكل كلمة</label>
                    <span className="hint">الصيغة: <code className="ltr">english = عربي</code> (أو مفصولة بتاب)</span>
                    <textarea
                      value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
                      rows={6}
                      placeholder={'Cartographer = صانع الخرائط\nExpedition = رحلة شاقة'}
                    />
                  </div>
                  <div className="btn-row">
                    <button
                      className="btn btn-primary btn-sm"
                      type="button"
                      disabled={!parsed.length || addBulk.isPending}
                      onClick={() => addBulk.mutate({ categoryId: cat.id, words: parsed })}
                    >
                      إضافة {parsed.length} كلمة
                    </button>
                    <button className="btn btn-sm" type="button" onClick={() => setBulkFor(null)}>إلغاء</button>
                  </div>
                </div>
              )}

              <div className="table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table>
                  <tbody>
                    {cat.words.map(w => (
                      <tr key={w.id}>
                        <td className="ltr" style={{ fontWeight: 600 }}>{w.en}</td>
                        <td>{w.ar}</td>
                        <td style={{ width: '1%' }}>
                          <ConfirmButton onConfirm={() => removeWord.mutate(w.id)}>✕</ConfirmButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── الصفحة ──────────────────────────────────────────────── */

export default function UnitEditor() {
  const { track, unitId } = useParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState('info');
  const [error, setError] = useState(null);

  const { data: unit, isLoading, error: loadError, refetch } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: () => api.get(`/admin/units/${unitId}`),
  });

  const saveInfo = useMutation({
    mutationFn: body => api.patch(`/admin/units/${unitId}`, body),
    onSuccess: () => {
      refetch();
      qc.invalidateQueries({ queryKey: ['units', track] });
    },
    onError: setError,
  });

  if (isLoading) return <Loading />;
  if (loadError) return <ErrorBox error={loadError} />;

  const quizCount = unit.questions.filter(q => q.strategyId === null).length;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="small muted">
            <Link to={`/content/${track}`}>{TRACK_LABELS[track]}</Link> ‹ {unit.tag || `وحدة ${unit.legacyId}`}
          </div>
          <h1>{unit.emoji} {unit.nameAr}</h1>
          <div className="sub ltr">{unit.nameEn}</div>
        </div>
        <div className="btn-row">
          {!unit.published && <span className="badge badge-red">مخفية عن الموقع</span>}
          <Link className="btn" to={`/content/${track}`}>‹ رجوع</Link>
        </div>
      </div>

      <ErrorBox error={error} onDismiss={() => setError(null)} />

      <div className="tabs">
        <button className={`tab${tab === 'info' ? ' active' : ''}`} onClick={() => setTab('info')} type="button">
          معلومات
        </button>
        <button className={`tab${tab === 'strategies' ? ' active' : ''}`} onClick={() => setTab('strategies')} type="button">
          الاستراتيجيات <span className="count">{unit.strategies.length}</span>
        </button>
        <button className={`tab${tab === 'quizzes' ? ' active' : ''}`} onClick={() => setTab('quizzes')} type="button">
          الاختبار الشامل <span className="count">{quizCount}</span>
        </button>
        <button className={`tab${tab === 'videos' ? ' active' : ''}`} onClick={() => setTab('videos')} type="button">
          الفيديوهات <span className="count">{unit.videos.length}</span>
        </button>
        <button className={`tab${tab === 'vocab' ? ' active' : ''}`} onClick={() => setTab('vocab')} type="button">
          المفردات <span className="count">{unit.vocabCategories.length}</span>
        </button>
      </div>

      {tab === 'info' && (
        <InfoTab
          key={unit.updatedAt}
          unit={unit}
          onSave={body => saveInfo.mutate(body)}
          saving={saveInfo.isPending}
        />
      )}
      {tab === 'strategies' && <StrategiesTab unit={unit} refetch={refetch} setError={setError} />}
      {tab === 'quizzes' && <QuizzesTab unit={unit} refetch={refetch} setError={setError} />}
      {tab === 'videos' && <VideosTab unit={unit} refetch={refetch} setError={setError} />}
      {tab === 'vocab' && <VocabTab unit={unit} refetch={refetch} setError={setError} />}
    </>
  );
}
