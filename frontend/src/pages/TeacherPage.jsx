import React, { useEffect, useState } from 'react';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { keccak256 } from 'js-sha3';
import {
  Plus, BookOpenCheck, Users, Timer, Trophy, FileEdit, CheckCircle2, Coins, X, Play, AlertCircle, Sparkles,
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import {
  createCourse as apiCreateCourse,
  getAllCourses,
  createExam as apiCreateExam,
  startExamBackend,
  getSubmissions,
  getResults,
  getExamQuestions,
  scoreExamPrepare as apiScorePrepare,
  scoreExamCommit as apiScoreCommit,
  updateRewards as apiUpdateRewards,
  generateQuestions as apiGenerateQuestions,
} from '../services/api';
import wsService from '../services/websocket';
import {
  PACKAGE_ID, PLATFORM_OBJECT_ID, SUI_CLOCK_OBJECT_ID,
  COURSE_STATUSES, STATUS_LABELS, STATUS_TONE, SUI_TO_MIST, MIST_TO_SUI,
  MIN_STUDENTS, MAX_STUDENTS,
} from '../config/constants';

const STATUS = COURSE_STATUSES;

async function execOrThrow(client, signAndExecute, tx, label) {
  const res = await signAndExecute({ transaction: tx, options: { showEffects: true } });
  const resp = await client.waitForTransaction({ digest: res.digest, options: { showEffects: true } });
  if (resp.effects?.status?.status !== 'success') {
    throw new Error(`On-chain ${label} failed: ${resp.effects?.status?.error || 'unknown'}`);
  }
  return { digest: res.digest, resp };
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Create course form ---------- */
function CreateCourseForm({ onSuccess, onClose }) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  const { address } = useWallet();
  const [form, setForm] = useState({ name: '', description: '', tuition: '0.05', maxStudents: 5, minStudents: 2 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!address) return setError('Wallet not connected');
    setLoading(true);
    setError(null);
    try {
      const tuitionMist = BigInt(Math.floor(parseFloat(form.tuition) * SUI_TO_MIST));
      const nameBytes = Array.from(new TextEncoder().encode(form.name));
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::course::create_course`,
        arguments: [
          tx.object(PLATFORM_OBJECT_ID),
          tx.pure.vector('u8', nameBytes),
          tx.pure.u64(tuitionMist.toString()),
          tx.pure.u8(form.maxStudents),
          tx.pure.u8(form.minStudents),
        ],
      });
      const { digest } = await execOrThrow(client, signAndExecute, tx, 'create_course');

      const details = await client.getTransactionBlock({
        digest,
        options: { showEvents: true, showObjectChanges: true },
      });
      let onChainId = null;
      for (const c of details.objectChanges || []) {
        if (c.type === 'created' && c.objectType?.includes('::Course')) {
          onChainId = c.objectId;
          break;
        }
      }
      if (!onChainId) {
        const ev = details.events?.find((e) => e.type?.includes('CourseCreated'));
        onChainId = ev?.parsedJson?.course_id;
      }

      await apiCreateCourse({
        on_chain_id: onChainId,
        teacher_address: address,
        name: form.name,
        description: form.description,
        tuition_amount: String(tuitionMist),
        max_students: form.maxStudents,
        min_students: form.minStudents,
        status: 0,
      });

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="flex gap-2 p-3 rounded-xl border border-red-400/30 bg-red-400/10 text-red-300 text-sm">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
      </div>}
      <div>
        <label className="text-xs uppercase tracking-wider text-ink-200">Course name</label>
        <input
          required type="text" value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:border-sui-400/50 outline-none"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-ink-200">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:border-sui-400/50 outline-none"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs uppercase tracking-wider text-ink-200">Tuition (SUI)</label>
          <input
            required type="number" step="0.01" min="0.01" value={form.tuition}
            onChange={(e) => setForm((f) => ({ ...f, tuition: e.target.value }))}
            className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:border-sui-400/50 outline-none"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-ink-200">Min students</label>
          <input
            type="number" min={1} max={MAX_STUDENTS}
            value={form.minStudents}
            onChange={(e) => setForm((f) => ({ ...f, minStudents: parseInt(e.target.value) || 1 }))}
            className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:border-sui-400/50 outline-none"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-ink-200">Max students</label>
          <input
            type="number" min={MIN_STUDENTS} max={MAX_STUDENTS}
            value={form.maxStudents}
            onChange={(e) => setForm((f) => ({ ...f, maxStudents: parseInt(e.target.value) || MAX_STUDENTS }))}
            className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:border-sui-400/50 outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>
          <Plus className="h-4 w-4" /> Create course
        </Button>
      </div>
    </form>
  );
}

/* ---------- AI panel ---------- */
function AiGeneratorPanel({ onGenerated }) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    if (!topic.trim()) {
      setError('Enter a topic first');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiGenerateQuestions({ topic: topic.trim(), count, difficulty });
      if (!data?.questions?.length) throw new Error('No questions returned');
      onGenerated(data.questions);
    } catch (e) {
      setError(e.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-sui-400/20 bg-gradient-to-br from-sui-400/5 to-transparent">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-lg bg-sui-400/15 grid place-items-center text-sui-300">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">Generate with AI</div>
          <div className="text-xs text-ink-200">Describe the topic and let GLM draft questions for you.</div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-ink-200">Topic</label>
          <input
            type="text" value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Fundamentals of data security"
            className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-sui-400/50 outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-ink-200">Count</label>
          <input
            type="number" min={1} max={10} value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            className="w-20 mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-sui-400/50 outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-ink-200">Level</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-sui-400/50 outline-none"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <Button type="button" onClick={generate} loading={loading}>
          <Sparkles className="h-4 w-4" /> Generate
        </Button>
      </div>

      {error && (
        <div className="mt-3 flex gap-2 p-2 rounded-lg border border-red-400/30 bg-red-400/10 text-red-300 text-xs">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {error}
        </div>
      )}
    </Card>
  );
}

/* ---------- Exam form ---------- */
function ExamForm({ course, onSuccess, onClose }) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  const [durationMin, setDurationMin] = useState(5);
  const [questions, setQuestions] = useState([
    { question_text: '', options: ['', '', '', ''], correct_answer_idx: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const applyAiQuestions = (aiQs) => {
    const hasUserContent = questions.some(
      (q) => q.question_text.trim() || q.options.some((o) => o.trim())
    );
    if (hasUserContent) {
      const ok = window.confirm(
        'This will replace the current questions with the AI-generated ones. Continue?'
      );
      if (!ok) return;
    }
    setQuestions(aiQs);
  };

  const addQuestion = () =>
    setQuestions((qs) => [...qs, { question_text: '', options: ['', '', '', ''], correct_answer_idx: 0 }]);
  const removeQuestion = (i) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  const updateQ = (i, k, v) => setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, [k]: v } : q)));
  const updateOpt = (i, oi, v) =>
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx === i ? { ...q, options: q.options.map((o, oidx) => (oidx === oi ? v : o)) } : q
      )
    );

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      for (const q of questions) {
        if (!q.question_text.trim() || q.options.some((o) => !o.trim()))
          throw new Error('All questions and options must be filled');
      }
      const answerKey = questions.map((q) => q.correct_answer_idx);
      const hashHex = keccak256(new Uint8Array(answerKey));
      const answerHash = Array.from(
        new Uint8Array(hashHex.match(/.{2}/g).map((b) => parseInt(b, 16)))
      );
      const durationMs = BigInt(durationMin * 60 * 1000);

      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::course::create_exam`,
        arguments: [
          tx.object(course.on_chain_id),
          tx.pure.vector('u8', answerHash),
          tx.pure.u64(durationMs.toString()),
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });
      await execOrThrow(client, signAndExecute, tx, 'create_exam');

      await apiCreateExam(course.id, {
        questions: questions.map((q, i) => ({
          question_number: i + 1,
          question_text: q.question_text,
          options: q.options,
          correct_answer_idx: q.correct_answer_idx,
        })),
      });

      const startMs = Date.now();
      await startExamBackend(course.id, {
        exam_start_time: new Date(startMs).toISOString(),
        exam_deadline: new Date(startMs + durationMin * 60 * 1000).toISOString(),
      });

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="flex gap-2 p-3 rounded-xl border border-red-400/30 bg-red-400/10 text-red-300 text-sm">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
      </div>}

      <AiGeneratorPanel onGenerated={applyAiQuestions} />

      <div className="flex items-center gap-3">
        <label className="text-sm text-ink-100">Duration (minutes)</label>
        <input
          type="number" min={1} max={60} value={durationMin}
          onChange={(e) => setDurationMin(parseInt(e.target.value) || 5)}
          className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 focus:border-sui-400/50 outline-none"
        />
      </div>
      {questions.map((q, i) => (
        <Card key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-sui-300">Question {i + 1}</span>
            {questions.length > 1 && (
              <button type="button" onClick={() => removeQuestion(i)} className="text-xs text-red-300 hover:text-red-200">
                Remove
              </button>
            )}
          </div>
          <input
            required type="text" placeholder="Question text" value={q.question_text}
            onChange={(e) => updateQ(i, 'question_text', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:border-sui-400/50 outline-none"
          />
          <div className="grid md:grid-cols-2 gap-2">
            {q.options.map((opt, oi) => (
              <label key={oi} className={`flex items-center gap-2 p-2 rounded-lg border ${q.correct_answer_idx === oi ? 'border-sui-400/50 bg-sui-400/10' : 'border-white/10'}`}>
                <input
                  type="radio" name={`q${i}`} checked={q.correct_answer_idx === oi}
                  onChange={() => updateQ(i, 'correct_answer_idx', oi)}
                  className="accent-sui-400"
                />
                <input
                  required type="text" placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                  value={opt}
                  onChange={(e) => updateOpt(i, oi, e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </label>
            ))}
          </div>
        </Card>
      ))}
      <div className="flex justify-between items-center">
        <Button type="button" variant="secondary" onClick={addQuestion}>
          <Plus className="h-4 w-4" /> Add question
        </Button>
        <Button type="submit" loading={loading}>
          <Play className="h-4 w-4" /> Create & start
        </Button>
      </div>
    </form>
  );
}

/* ---------- Score exam ---------- */
function ScoreExamView({ course, onSuccess, onClose }) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Prepare: get the answer key (no DB mutation).
      const prep = await apiScorePrepare(course.id);
      const answerKey = prep.answer_key;

      // 2. On-chain reveal_and_score — must succeed before we touch the DB.
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::course::reveal_and_score`,
        arguments: [
          tx.object(course.on_chain_id),
          tx.pure.vector('u8', answerKey),
        ],
      });
      await execOrThrow(client, signAndExecute, tx, 'reveal_and_score');

      // 3. Commit: backend auto-submits no-shows, scores, ranks, flips status.
      const commit = await apiScoreCommit(course.id);

      setResult({
        total_submissions: commit.total_submissions ?? prep.submitted_count,
        no_show_count: commit.no_show_count ?? prep.no_show_count,
        scored_count: commit.scored_count ?? 0,
      });
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to score');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="flex gap-2 p-3 rounded-xl border border-red-400/30 bg-red-400/10 text-red-300 text-sm">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
      </div>}
      {!result ? (
        <>
          <p className="text-sm text-ink-100">
            This reveals answers on chain, auto-submits no-shows, and computes rankings.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={run} loading={loading}>
              <CheckCircle2 className="h-4 w-4" /> Reveal & Score
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <Card>
            <div className="text-sm text-ink-100">
              <div>Total submissions: <span className="text-sui-300 font-semibold">{result.total_submissions}</span></div>
              <div>No-show students auto-submitted: <span className="text-sui-300 font-semibold">{result.no_show_count}</span></div>
              <div>Scored: <span className="text-sui-300 font-semibold">{result.scored_count}</span></div>
            </div>
          </Card>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Reveal & Score gate ---------- */
function RevealScoreButton({ course, onClick }) {
  const [now, setNow] = useState(Date.now());
  const [submissionCount, setSubmissionCount] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const subs = await getSubmissions(course.id);
        if (!cancelled) setSubmissionCount(subs.length);
      } catch {}
    };
    fetchCount();
    // Update on WS submit events instead of polling.
    const unsub = wsService.subscribe(course.id, (msg) => {
      if (msg.type === 'EXAM_SUBMITTED' && typeof msg.submitted_count === 'number') {
        setSubmissionCount(msg.submitted_count);
      }
    });
    // 30-second safety net in case a WS event was missed.
    const poll = setInterval(fetchCount, 30000);
    return () => { cancelled = true; unsub?.(); clearInterval(poll); };
  }, [course.id]);

  const deadlineMs = course.exam_deadline ? new Date(course.exam_deadline).getTime() : null;
  const deadlinePassed = deadlineMs != null && now >= deadlineMs;
  const allSubmitted =
    submissionCount != null && submissionCount >= (course.enrolled_count || 0) && (course.enrolled_count || 0) > 0;
  const canReveal = deadlinePassed || allSubmitted;

  const remaining = deadlineMs ? Math.max(0, deadlineMs - now) : 0;
  const mm = String(Math.floor(remaining / 60000)).padStart(2, '0');
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');

  return (
    <div className="flex flex-col gap-1">
      <Button
        size="sm"
        variant={canReveal ? 'primary' : 'secondary'}
        onClick={onClick}
        disabled={!canReveal}
      >
        <Timer className="h-4 w-4" /> Reveal & Score
      </Button>
      {!canReveal && (
        <span className="text-[10px] text-ink-200">
          Wait {mm}:{ss} or until all {course.enrolled_count || 0} students submit
          {submissionCount != null && ` (${submissionCount} submitted)`}
        </span>
      )}
      {canReveal && allSubmitted && !deadlinePassed && (
        <span className="text-[10px] text-emerald-300">
          All students submitted — safe to score
        </span>
      )}
    </div>
  );
}

/* ---------- Distribute rewards ---------- */
function DistributeButton({ course, onDone }) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const run = async () => {
    setLoading(true);
    setErr(null);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::course::distribute_rewards`,
        arguments: [tx.object(course.on_chain_id)],
      });
      await execOrThrow(client, signAndExecute, tx, 'distribute_rewards');
      await apiUpdateRewards(course.id);
      onDone?.();
    } catch (e) {
      setErr(e.message || 'Distribute failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col gap-1">
      <Button size="sm" onClick={run} loading={loading}>
        <Coins className="h-4 w-4" /> Distribute
      </Button>
      {err && <span className="text-xs text-red-300">{err}</span>}
    </div>
  );
}

/* ---------- Results viewer ---------- */
function ResultsPanel({ course }) {
  const [results, setResults] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    getResults(course.id).then(setResults).catch((e) => setErr(e.message));
  }, [course.id]);
  if (err) return <p className="text-sm text-red-300">{err}</p>;
  if (!results) return <p className="text-sm text-ink-200">Loading…</p>;

  const distributed = course.status === STATUS.REWARDS_DISTRIBUTED;
  const onChainSubmitters = results.filter((r) => !r.auto_submitted).length;
  const anyRewarded = results.some((r) => Number(r.reward_amount) > 0);
  const tuitionMist = Number(course.tuition_amount);
  const totalEscrow = tuitionMist * (course.enrolled_count || results.length);
  const totalDistributed = results.reduce((s, r) => s + Number(r.reward_amount || 0), 0);
  const teacherTook = Math.max(0, totalEscrow - totalDistributed);

  return (
    <div className="space-y-2">
      {distributed && !anyRewarded && (
        <Card className="border-amber-400/30 bg-amber-400/10">
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-300 shrink-0" />
            <div>
              <div className="text-amber-200 font-medium">No students rewarded</div>
              <div className="text-xs text-ink-100 mt-0.5">
                {onChainSubmitters === 0
                  ? 'No one submitted on chain — the full escrow was paid to the teacher.'
                  : 'Submissions were made but none qualified for the top 20%.'}
                {' '}Teacher received ~{MIST_TO_SUI(teacherTook).toFixed(4)} SUI.
              </div>
            </div>
          </div>
        </Card>
      )}
      {distributed && anyRewarded && teacherTook > 0 && (
        <div className="text-xs text-ink-200 px-1">
          Teacher retained ~{MIST_TO_SUI(teacherTook).toFixed(4)} SUI of the escrow.
        </div>
      )}
      {results.map((r) => (
        <div key={r.id} className="flex items-center justify-between glass rounded-xl px-4 py-2">
          <div className="flex items-center gap-3">
            <span className={`h-7 w-7 grid place-items-center rounded-full text-xs font-bold ${r.rank_position === 1 && !r.auto_submitted ? 'bg-amber-400/20 text-amber-200' : 'bg-white/10 text-ink-100'}`}>
              {r.rank_position}
            </span>
            <span className="font-mono text-xs">{r.student_address.slice(0, 8)}…{r.student_address.slice(-4)}</span>
            {r.auto_submitted && <Badge tone="gray">No-show</Badge>}
          </div>
          <div className="text-sm flex items-center gap-3">
            <span className={r.auto_submitted ? 'text-ink-200' : ''}>{r.percentage}%</span>
            {Number(r.reward_amount) > 0 ? (
              <Badge tone="green">+{MIST_TO_SUI(r.reward_amount).toFixed(4)} SUI</Badge>
            ) : distributed ? (
              <Badge tone="gray">No reward</Badge>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Course card ---------- */
function CourseCard({ course, onAction, onRefresh }) {
  const status = course.status ?? 0;
  const [showResults, setShowResults] = useState(false);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{course.name}</h3>
          {course.description && (
            <p className="text-xs text-ink-200 mt-1 line-clamp-2">{course.description}</p>
          )}
        </div>
        <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>
      </div>

      <div className="flex items-center gap-4 text-xs text-ink-200">
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.enrolled_count || 0}/{course.max_students}</span>
        <span className="flex items-center gap-1 text-sui-300"><Coins className="h-3.5 w-3.5" /> {MIST_TO_SUI(course.tuition_amount)} SUI</span>
      </div>

      <div className="flex items-center gap-2 mt-1">
        {status === STATUS.ENROLLING && (
          <span className="text-xs text-ink-200">Waiting for students ({course.enrolled_count || 0}/{course.min_students})</span>
        )}
        {status === STATUS.READY_FOR_EXAM && (
          <Button size="sm" onClick={() => onAction('createExam', course)}>
            <FileEdit className="h-4 w-4" /> Create Exam
          </Button>
        )}
        {status === STATUS.EXAM_ACTIVE && (
          <RevealScoreButton course={course} onClick={() => onAction('scoreExam', course)} />
        )}
        {status === STATUS.SCORED && (
          <>
            <DistributeButton course={course} onDone={onRefresh} />
            <Button size="sm" variant="ghost" onClick={() => setShowResults((s) => !s)}>
              {showResults ? 'Hide' : 'View'} results
            </Button>
          </>
        )}
        {status === STATUS.REWARDS_DISTRIBUTED && (
          <Button size="sm" variant="ghost" onClick={() => setShowResults((s) => !s)}>
            <Trophy className="h-4 w-4" /> {showResults ? 'Hide' : 'View'} leaderboard
          </Button>
        )}
      </div>

      {showResults && (status === STATUS.SCORED || status === STATUS.REWARDS_DISTRIBUTED) && (
        <div className="pt-3 border-t border-white/5"><ResultsPanel course={course} /></div>
      )}
    </Card>
  );
}

/* ---------- Page ---------- */
export default function TeacherPage() {
  const { address } = useWallet();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { kind, course }
  const [fetchError, setFetchError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getAllCourses({ teacher: address });
      setCourses(data);
    } catch (e) {
      setFetchError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!address) return;
    refresh();
    // Safety-net poll. WS push handles the fast path; this catches missed events.
    const poll = setInterval(refresh, 30000);
    // Refetch when the tab regains focus (covers serial account switching).
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    // Global WS stream: any course-wide change (created/updated) triggers a refresh.
    const unsubGlobal = wsService.subscribeGlobal((msg) => {
      if (msg.type === 'COURSE_CREATED' || msg.type === 'COURSE_UPDATED') refresh();
    });
    return () => {
      clearInterval(poll);
      window.removeEventListener('focus', onFocus);
      unsubGlobal?.();
    };
  }, [address]);

  // Per-course subscriptions so the teacher's card updates on enroll / submit / score.
  useEffect(() => {
    const unsubs = courses.map((c) =>
      wsService.subscribe(c.id, (msg) => {
        if (
          msg.type === 'STUDENT_ENROLLED' ||
          msg.type === 'EXAM_SUBMITTED' ||
          msg.type === 'EXAM_SCORED' ||
          msg.type === 'REWARDS_DISTRIBUTED'
        ) {
          refresh();
        }
      })
    );
    return () => unsubs.forEach((u) => u?.());
  }, [courses.map((c) => c.id).join(',')]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpenCheck className="h-6 w-6 text-sui-300" /> Teacher dashboard
          </h1>
          <p className="text-sm text-ink-200">Create courses, write exams, pay winners.</p>
        </div>
        <Button onClick={() => setModal({ kind: 'createCourse' })}>
          <Plus className="h-4 w-4" /> New course
        </Button>
      </div>

      {fetchError && (
        <Card className="mb-4 border-red-400/30 bg-red-400/10">
          <div className="flex items-center gap-2 text-red-300 text-sm">
            <AlertCircle className="h-4 w-4" /> {fetchError}
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-ink-200">Loading your courses…</p>
      ) : courses.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-ink-200">No courses yet. Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} onAction={(kind, course) => setModal({ kind, course })} onRefresh={refresh} />
          ))}
        </div>
      )}

      <Modal open={modal?.kind === 'createCourse'} onClose={() => setModal(null)} title="Create a course">
        <CreateCourseForm onSuccess={refresh} onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal?.kind === 'createExam'} onClose={() => setModal(null)} title={`Create exam · ${modal?.course?.name || ''}`}>
        {modal?.course && <ExamForm course={modal.course} onSuccess={refresh} onClose={() => setModal(null)} />}
      </Modal>
      <Modal open={modal?.kind === 'scoreExam'} onClose={() => setModal(null)} title={`Score exam · ${modal?.course?.name || ''}`}>
        {modal?.course && <ScoreExamView course={modal.course} onSuccess={refresh} onClose={() => setModal(null)} />}
      </Modal>
    </div>
  );
}
