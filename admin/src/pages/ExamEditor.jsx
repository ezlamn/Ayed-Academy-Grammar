import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';

import { api, qs } from '../lib/api';
import SortableList from '../components/SortableList.jsx';
import QuestionEditor from '../components/QuestionEditor.jsx';
import {
  ConfirmButton, Empty, ErrorBox, Loading, Modal,
  SECTION_LABELS, TRACK_LABELS, stripHtml,
} from '../components/ui.jsx';

const SECTIONS = ['listening', 'reading', 'grammar', 'writing'];

/* ── استيراد من بنك أسئلة الوحدات ────────────────────────── */

function ImportModal({ examId, onClose, onDone }) {
  const [filters, setFilters] = useState({ track: '', unitId: '', q: '' });
  const [selected, setSelected] = useState(() => new Set());
  const [section, setSection] = useState('');
  const [error, setError] = useState(null);

  const { data: units } = useQuery({
    queryKey: ['units', filters.track || 'all'],
    queryFn: () => api.get('/admin/units' + qs({ track: filters.track })),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['question-bank', filters],
    queryFn: () => api.get('/admin/questions' + qs({ ...filters, kind: 'mcq', take: 100 })),
  });

  const doImport = useMutation({
    mutationFn: () => api.post('/admin/exams/questions/import', {
      examId,
      questionIds: [...selected],
      ...(section ? { section } : {}),
    }),
    onSuccess: () => { onDone(); onClose(); },
    onError: setError,
  });

  const toggle = id => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <Modal
      title="استيراد أسئلة من الوحدات"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose} type="button">إلغاء</button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={!selected.size || doImport.isPending}
            onClick={() => doImport.mutate()}
          >
            {doImport.isPending ? 'جاري الاستيراد...' : `استيراد ${selected.size} سؤال`}
          </button>
        </>
      }
    >
      <ErrorBox error={error} onDismiss={() => setError(null)} />

      <div className="alert alert-info">
        ℹ️ الأسئلة بتتنسخ نسخ — تعديل الوحدة بعد كده مش هيغيّر النموذج.
        بيتم استيراد أسئلة الاختيار من متعدد بس.
      </div>

      <div className="toolbar">
        <select
          value={filters.track}
          onChange={e => setFilters(f => ({ ...f, track: e.target.value, unitId: '' }))}
        >
          <option value="">كل المسارات</option>
          {Object.entries(TRACK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <select value={filters.unitId} onChange={e => setFilters(f => ({ ...f, unitId: e.target.value }))}>
          <option value="">كل الوحدات</option>
          {(units || []).map(u => <option key={u.id} value={u.id}>{u.nameAr}</option>)}
        </select>

        <input
          type="text"
          placeholder="بحث في نص السؤال..."
          value={filters.q}
          onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
        />

        <div className="spacer" />

        <select value={section} onChange={e => setSection(e.target.value)}>
          <option value="">القسم: تلقائي حسب المسار</option>
          {SECTIONS.map(s => <option key={s} value={s}>{SECTION_LABELS[s]}</option>)}
        </select>
      </div>

      {isLoading ? (
        <Loading />
      ) : !data?.items.length ? (
        <Empty icon="🔍" title="مفيش نتائج" />
      ) : (
        <>
          <div className="btn-row" style={{ marginBottom: '0.6rem' }}>
            <button
              className="btn btn-sm"
              type="button"
              onClick={() => setSelected(new Set(data.items.map(q => q.id)))}
            >
              تحديد الكل ({data.items.length})
            </button>
            <button className="btn btn-sm" type="button" onClick={() => setSelected(new Set())}>
              مسح التحديد
            </button>
            <span className="muted small">من إجمالي {data.total}</span>
          </div>

          <div className="table-wrap" style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table>
              <tbody>
                {data.items.map(q => (
                  <tr
                    key={q.id}
                    onClick={() => toggle(q.id)}
                    style={{
                      cursor: 'pointer',
                      background: selected.has(q.id) ? 'var(--brand-soft)' : undefined,
                    }}
                  >
                    <td style={{ width: '1%' }}>
                      <input type="checkbox" checked={selected.has(q.id)} readOnly />
                    </td>
                    <td>
                      <div className="truncate-2" style={{ fontWeight: 600 }}>{stripHtml(q.text)}</div>
                      <div className="small muted">
                        {q.unit.nameAr} {q.strategy ? `· ${stripHtml(q.strategy.title)}` : ''}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ── الصفحة ──────────────────────────────────────────────── */

export default function ExamEditor() {
  const { examId } = useParams();
  const [editing, setEditing] = useState(null); // {question, section} | {section}
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);

  const { data: exam, isLoading, error: loadError, refetch } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => api.get(`/admin/exams/${examId}`),
  });

  const done = () => { setEditing(null); setMutationError(null); refetch(); };

  const saveQuestion = useMutation({
    mutationFn: body =>
      editing.question
        ? api.patch(`/admin/exams/questions/${editing.question.id}`, body)
        : api.post('/admin/exams/questions', { examId: Number(examId), section: editing.section, ...body }),
    onSuccess: done,
    onError: setMutationError,
  });

  const removeQuestion = useMutation({
    mutationFn: id => api.delete(`/admin/exams/questions/${id}`),
    onSuccess: done,
    onError: setError,
  });

  const reorder = useMutation({
    mutationFn: ({ section, ids }) =>
      api.patch('/admin/exams/questions/reorder', { examId: Number(examId), section, ids }),
    onSuccess: refetch,
    onError: setError,
  });

  const saveMeta = useMutation({
    mutationFn: body => api.patch(`/admin/exams/${examId}`, body),
    onSuccess: refetch,
    onError: setError,
  });

  if (isLoading) return <Loading />;
  if (loadError) return <ErrorBox error={loadError} />;

  const bySection = Object.fromEntries(
    SECTIONS.map(s => [s, exam.questions.filter(q => q.section === s)])
  );

  return (
    <>
      <div className="page-head">
        <div>
          <div className="small muted"><Link to="/exams">نماذج الاختبارات</Link> ‹</div>
          <h1>📄 {exam.title}</h1>
          <div className="sub">
            {exam.questions.length} سؤال · {exam.durationMin} دقيقة
            {exam.published
              ? <span className="badge badge-green" style={{ marginInlineStart: '0.5rem' }}>منشور</span>
              : <span className="badge badge-red" style={{ marginInlineStart: '0.5rem' }}>مسودّة</span>}
          </div>
        </div>
        <div className="btn-row">
          <button className="btn" type="button" onClick={() => setImporting(true)}>
            ⬇ استيراد من الوحدات
          </button>
          <button
            className="btn"
            type="button"
            disabled={!exam.questions.length && !exam.published}
            onClick={() => saveMeta.mutate({ published: !exam.published })}
          >
            {exam.published ? 'إلغاء النشر' : 'نشر'}
          </button>
          <Link className="btn" to="/exams">‹ رجوع</Link>
        </div>
      </div>

      <ErrorBox error={error} onDismiss={() => setError(null)} />

      {exam.questions.length === 0 && (
        <div className="alert alert-info">
          النموذج فاضي. استورد أسئلة من الوحدات، أو أضف أسئلة يدوياً لكل قسم.
        </div>
      )}

      <div className="grid grid-2">
        {SECTIONS.map(section => (
          <div className="card" key={section}>
            <div className="card-head">
              <span>{SECTION_LABELS[section]} <span className="muted small">({bySection[section].length})</span></span>
              <button
                className="btn btn-sm"
                type="button"
                onClick={() => setEditing({ section, question: null })}
              >
                + سؤال
              </button>
            </div>

            {bySection[section].length === 0 ? (
              <Empty icon="—" title="" >مفيش أسئلة في القسم ده.</Empty>
            ) : (
              <SortableList
                items={bySection[section]}
                onReorder={ids => reorder.mutate({ section, ids })}
                renderItem={(q, i) => (
                  <>
                    <span className="num small muted" style={{ width: '1.5rem' }}>{i + 1}</span>
                    <div className="item-main">
                      <div className="item-title" style={{ fontWeight: 600 }}>{stripHtml(q.text)}</div>
                      <div className="item-sub">
                        ✓ {stripHtml(q.opts?.[q.correctIndex] ?? '')}
                        {q.audioAsset && <span className="badge" style={{ marginInlineStart: '0.4rem' }}>🔊</span>}
                        {q.passageText && <span className="badge" style={{ marginInlineStart: '0.3rem' }}>📄</span>}
                      </div>
                    </div>
                    <div className="btn-row" style={{ gap: '0.3rem' }}>
                      <button
                        className="btn btn-sm"
                        type="button"
                        onClick={() => setEditing({ section, question: q })}
                      >
                        تحرير
                      </button>
                      <ConfirmButton onConfirm={() => removeQuestion.mutate(q.id)}>حذف</ConfirmButton>
                    </div>
                  </>
                )}
              />
            )}
          </div>
        ))}
      </div>

      {editing && (
        <QuestionEditor
          title={editing.question ? 'تحرير سؤال الامتحان' : `سؤال جديد — ${SECTION_LABELS[editing.section]}`}
          initial={editing.question}
          showPassage={editing.section === 'reading'}
          // أسئلة الامتحان اختيار من متعدد بس — mock_exam.js بيفلتر الباقي
          allowKindChange={false}
          onSave={body => saveQuestion.mutate(body)}
          onClose={() => { setEditing(null); setMutationError(null); }}
          saving={saveQuestion.isPending}
          error={mutationError}
        />
      )}

      {importing && (
        <ImportModal
          examId={Number(examId)}
          onClose={() => setImporting(false)}
          onDone={refetch}
        />
      )}
    </>
  );
}
