import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { keccak256 } from 'js-sha3';
import {
  BookOpen, Coins, Users, Timer, Trophy, CheckCircle2, X, AlertCircle, Play, Flag,
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import wsService from '../services/websocket';
import {
  getAllCourses, checkEnrollment, enrollInCourse, getCourseById,
  getExamQuestions, getExamStatus, submitAnswers, checkSubmission,
  getMyRank, getResults,
} from '../services/api';
import {
  PACKAGE_ID, PLATFORM_OBJECT_ID, SUI_CLOCK_OBJECT_ID,
  COURSE_STATUSES, STATUS_LABELS, STATUS_TONE, MIST_TO_SUI,
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

/* ---------- Enroll ---------- */
function EnrollButton({ course, onEnrolled }) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    if (!address) return setError('Wallet not connected');
    setLoading(true); setError(null);
    try {
      const tuitionMist = BigInt(course.tuition_amount);
      const tx = new Transaction();
      const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(tuitionMist.toString())]);
      tx.moveCall({
        target: `${PACKAGE_ID}::course::enroll_and_pay`,
        arguments: [
          tx.object(PLATFORM_OBJECT_ID),
          tx.object(course.on_chain_id),
          paymentCoin,
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });
      const { digest } = await execOrThrow(client, signAndExecute, tx, 'enroll_and_pay');
      await enrollInCourse(course.id, {
        student_address: address,
        amount_paid: course.tuition_amount,
        tx_digest: digest,
      });
      onEnrolled?.();
    } catch (e) {
      setError(e.message || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button size="sm" onClick={run} loading={loading}>
        <Coins className="h-4 w-4" /> Enroll · {MIST_TO_SUI(course.tuition_amount)} SUI
      </Button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </div>
  );
}

/* ---------- Exam view ---------- */
function ExamView({ course, onClose, onComplete }) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  const { address } = useWallet();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [deadline, setDeadline] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const answersRef = useRef({});
  const autoRef = useRef(false);

  useEffect(() => { answersRef.current = answers; }, [answers]);

  // Load questions + status
  useEffect(() => {
    (async () => {
      try {
        const qs = await getExamQuestions(course.id);
        setQuestions(qs);
        const init = {}; qs.forEach((_, i) => { init[i] = null; });
        setAnswers(init);

        const st = await getExamStatus(course.id);
        if (st.exam_deadline) setDeadline(new Date(st.exam_deadline).getTime());

        const sub = await checkSubmission(course.id, address);
        if (sub.hasSubmitted) setSubmitted(true);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [course.id, address]);

  // Tick
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const buildAnswerArray = useCallback(() => {
    return questions.map((_, i) => {
      const a = answersRef.current[i];
      return a !== null && a !== undefined ? a : 255;
    });
  }, [questions]);

  const submit = useCallback(async (isAuto = false) => {
    if (submitted || autoRef.current) return;
    autoRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const answerArray = buildAnswerArray();
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::course::submit_answers`,
        arguments: [
          tx.object(course.on_chain_id),
          tx.pure.vector('u8', answerArray),
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });
      const { digest } = await execOrThrow(client, signAndExecute, tx, 'submit_answers');
      await submitAnswers(course.id, {
        student_address: address,
        answers: answerArray,
        answers_hash: '0x' + keccak256(new Uint8Array(answerArray)),
        submitted_at: new Date().toISOString(),
        is_auto_submit: isAuto,
        tx_digest: digest,
      });
      setSubmitted(true);
      onComplete?.();
    } catch (e) {
      setError(e.message || 'Submission failed');
      autoRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [address, buildAnswerArray, client, course.id, course.on_chain_id, onComplete, signAndExecute, submitted]);

  // Auto-submit on deadline
  useEffect(() => {
    if (!deadline || submitted || autoRef.current) return;
    if (now >= deadline) submit(true);
  }, [now, deadline, submitted, submit]);

  const timeLeft = deadline ? Math.max(0, deadline - now) : null;
  const mm = timeLeft != null ? String(Math.floor(timeLeft / 60000)).padStart(2, '0') : '--';
  const ss = timeLeft != null ? String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, '0') : '--';

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">{course.name}</h2>
            <p className="text-sm text-ink-200">Answer all questions before the timer ends.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
              <Timer className="h-4 w-4 text-sui-300" />
              <span className="font-mono text-lg tabular-nums">{mm}:{ss}</span>
            </div>
            <button onClick={onClose} className="h-10 w-10 grid place-items-center rounded-xl glass hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <Card className="mb-4 border-red-400/30 bg-red-400/10">
            <div className="flex items-start gap-2 text-red-300 text-sm"><AlertCircle className="h-4 w-4 mt-0.5" /> {error}</div>
          </Card>
        )}

        {submitted ? (
          <Card className="text-center py-10">
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400 mb-3" />
            <h3 className="font-semibold mb-1">Submission received</h3>
            <p className="text-sm text-ink-200">Wait for the teacher to reveal answers.</p>
            <div className="mt-4"><Button onClick={onClose} variant="secondary">Back</Button></div>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <Card key={i}>
                <div className="text-xs uppercase tracking-wider text-sui-300 mb-2">Question {i + 1}</div>
                <div className="font-medium mb-3">{q.question_text}</div>
                <div className="grid md:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => {
                    const active = answers[i] === oi;
                    return (
                      <button
                        key={oi} type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors ${active ? 'border-sui-400/60 bg-sui-400/15' : 'border-white/10 hover:border-white/25'}`}
                      >
                        <span className={`h-6 w-6 grid place-items-center rounded-full text-xs font-semibold ${active ? 'bg-sui-400 text-ink-900' : 'bg-white/10 text-ink-100'}`}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="text-sm">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
            <div className="flex justify-end sticky bottom-4">
              <Button size="lg" onClick={() => submit(false)} loading={submitting}>
                <Flag className="h-4 w-4" /> Submit answers
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Results panel ---------- */
function MyResult({ course }) {
  const { address } = useWallet();
  const [rank, setRank] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'not_ranked' | 'error'
  const [err, setErr] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getMyRank(course.id, address)
      .then((r) => { if (!cancelled) { setRank(r); setStatus('ok'); } })
      .catch((e) => {
        if (cancelled) return;
        const msg = String(e.message || '');
        if (msg.toLowerCase().includes('not found')) {
          setStatus('not_ranked');
        } else {
          setErr(msg);
          setStatus('error');
        }
      });
    return () => { cancelled = true; };
  }, [course.id, address]);

  if (status === 'loading') return <p className="text-xs text-ink-200">Computing…</p>;
  if (status === 'not_ranked') {
    return (
      <Badge tone="gray">
        {course.status === STATUS.SCORED || course.status === STATUS.REWARDS_DISTRIBUTED
          ? 'No submission'
          : 'Not scored yet'}
      </Badge>
    );
  }
  if (status === 'error') return <p className="text-xs text-red-300">{err}</p>;

  // Student was auto-submitted as no-show — they can't be rewarded on chain.
  if (rank.auto_submitted) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Badge tone="gray">No submission</Badge>
        <span className="text-xs text-ink-200">Tuition forfeited</span>
      </div>
    );
  }

  const hasReward = Number(rank.reward_amount) > 0;
  return (
    <div className="flex items-center gap-3 text-sm flex-wrap">
      <Badge tone={rank.rank_position === 1 ? 'amber' : 'blue'}>
        <Trophy className="h-3 w-3" /> Rank {rank.rank_position}
      </Badge>
      <span className="text-ink-100">{rank.percentage}%</span>
      {hasReward ? (
        <Badge tone="green">+{MIST_TO_SUI(rank.reward_amount).toFixed(4)} SUI</Badge>
      ) : course.status === STATUS.REWARDS_DISTRIBUTED ? (
        <Badge tone="gray">Not in top 20%</Badge>
      ) : null}
    </div>
  );
}

/* ---------- Course card ---------- */
function CourseCard({ course, enrolled, onEnrolled, onOpenExam }) {
  const status = course.status ?? 0;
  return (
    <Card className="flex flex-col gap-3" hoverable>
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
        {!enrolled && (status === STATUS.ENROLLING || status === STATUS.READY_FOR_EXAM) && (
          <EnrollButton course={course} onEnrolled={onEnrolled} />
        )}
        {enrolled && status === STATUS.EXAM_ACTIVE && (
          <Button size="sm" onClick={() => onOpenExam(course)}>
            <Play className="h-4 w-4" /> Take exam
          </Button>
        )}
        {enrolled && status === STATUS.SCORED && <MyResult course={course} />}
        {enrolled && status === STATUS.REWARDS_DISTRIBUTED && <MyResult course={course} />}
        {enrolled && (status === STATUS.ENROLLING || status === STATUS.READY_FOR_EXAM) && (
          <Badge tone="teal"><CheckCircle2 className="h-3 w-3" /> Enrolled</Badge>
        )}
      </div>
    </Card>
  );
}

/* ---------- Page ---------- */
export default function StudentPage() {
  const { address } = useWallet();
  const [courses, setCourses] = useState([]);
  const [enrolledMap, setEnrolledMap] = useState({}); // course.id -> bool
  const [activeExam, setActiveExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true); setFetchError(null);
    try {
      const all = await getAllCourses();
      setCourses(all);
      const map = {};
      await Promise.all(
        all.map(async (c) => {
          try {
            const { isEnrolled } = await checkEnrollment(c.id, address);
            map[c.id] = isEnrolled;
          } catch {
            map[c.id] = false;
          }
        })
      );
      setEnrolledMap(map);
    } catch (e) {
      setFetchError(e.message);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (!address) return;
    refresh();
    // Safety-net poll (every 30 s). WS + focus refetch handle the live path.
    const poll = setInterval(refresh, 30000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    // Any course-wide change triggers a refresh (new course, status change).
    const unsubGlobal = wsService.subscribeGlobal((msg) => {
      if (msg.type === 'COURSE_CREATED' || msg.type === 'COURSE_UPDATED') refresh();
    });
    return () => {
      clearInterval(poll);
      window.removeEventListener('focus', onFocus);
      unsubGlobal?.();
    };
  }, [address, refresh]);

  // Subscribe to WS per-course events for courses relevant to the student.
  useEffect(() => {
    const unsubs = courses.map((c) =>
      wsService.subscribe(c.id, (msg) => {
        if (
          msg.type === 'EXAM_STARTED' ||
          msg.type === 'EXAM_SCORED' ||
          msg.type === 'REWARDS_DISTRIBUTED' ||
          msg.type === 'STUDENT_ENROLLED'
        ) {
          refresh();
        }
      })
    );
    return () => unsubs.forEach((u) => u?.());
  }, [courses.map((c) => c.id).join(','), refresh]);

  const myCourses = courses.filter((c) => enrolledMap[c.id]);
  const availableCourses = courses.filter(
    (c) => !enrolledMap[c.id] && (c.status === 0 || c.status === 1)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-sui-300" /> Student dashboard
        </h1>
        <p className="text-sm text-ink-200">Enroll in a course, compete, and win rewards.</p>
      </div>

      {fetchError && (
        <Card className="mb-4 border-red-400/30 bg-red-400/10">
          <div className="flex items-center gap-2 text-red-300 text-sm">
            <AlertCircle className="h-4 w-4" /> {fetchError}
          </div>
        </Card>
      )}

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-ink-200 mb-3">My courses</h2>
        {loading ? (
          <p className="text-ink-200">Loading…</p>
        ) : myCourses.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-ink-200 text-sm">You haven't enrolled in any course yet.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {myCourses.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                enrolled
                onEnrolled={refresh}
                onOpenExam={setActiveExam}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-ink-200 mb-3">Available courses</h2>
        {loading ? null : availableCourses.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-ink-200 text-sm">No open courses right now — check back later.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {availableCourses.map((c) => (
              <CourseCard key={c.id} course={c} onEnrolled={refresh} onOpenExam={setActiveExam} />
            ))}
          </div>
        )}
      </section>

      {activeExam && (
        <ExamView
          course={activeExam}
          onClose={() => { setActiveExam(null); refresh(); }}
          onComplete={refresh}
        />
      )}
    </div>
  );
}
