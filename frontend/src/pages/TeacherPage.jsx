import React, { useState, useEffect, useCallback } from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useRole } from '../contexts/RoleContext';
import { useWallet } from '../contexts/WalletContext';
import WalletDisconnectButton from '../components/WalletDisconnectButton';
import {
  createCourse as apiCreateCourse,
  getAllCourses,
  createExam as apiCreateExam,
  startExamBackend,
  getSubmissions,
  getResults,
  getExamQuestions,
} from '../services/api';
import { PACKAGE_ID, PLATFORM_OBJECT_ID, COURSE_STATUSES, STATUS_LABELS, SUI_TO_MIST, MIST_TO_SUI, MIN_STUDENTS, MAX_STUDENTS } from '../config/constants';
import { keccak256 } from 'js-sha3';

const STATUS = COURSE_STATUSES;

function CreateCourseForm({ onSuccess }) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  const { address } = useWallet();
  const [form, setForm] = useState({ name: '', description: '', tuition: '', maxStudents: 5, minStudents: 2 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
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

      const result = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest: result.digest });

      const txDetails = await client.getTransactionBlock({
        digest: result.digest,
        options: { showEvents: true, showObjectChanges: true },
      });

      let onChainId = null;
      const createdObjects = txDetails.objectChanges?.filter(c => c.type === 'created') || [];
      for (const obj of createdObjects) {
        if (obj.objectType?.includes('Course')) {
          onChainId = obj.objectId;
          break;
        }
      }

      if (!onChainId) {
        const event = txDetails.events?.find(e => e.type?.includes('CourseCreated'));
        if (event?.parsedJson?.course_id) {
          onChainId = event.parsedJson.course_id;
        }
      }

      await apiCreateCourse({
        on_chain_id: onChainId || result.digest,
        teacher_address: address,
        name: form.name,
        description: form.description,
        tuition_amount: String(Math.floor(parseFloat(form.tuition) * SUI_TO_MIST)),
        max_students: form.maxStudents,
        min_students: form.minStudents,
        status: 0,
      });

      setForm({ name: '', description: '', tuition: '', maxStudents: 5, minStudents: 2 });
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="course-form" onSubmit={handleSubmit}>
      <h3>Create New Course</h3>
      {error && <p className="error-text">{error}</p>}
      <div className="form-group">
        <label>Course Name *</label>
        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Tuition (SUI) *</label>
          <input type="number" step="0.01" min="0.01" value={form.tuition} onChange={e => setForm(f => ({ ...f, tuition: e.target.value }))} required />
        </div>
        <div className="form-group">
          <label>Max Students</label>
          <select value={form.maxStudents} onChange={e => setForm(f => ({ ...f, maxStudents: parseInt(e.target.value) }))}>
            {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Min Students</label>
          <select value={form.minStudents} onChange={e => setForm(f => ({ ...f, minStudents: parseInt(e.target.value) }))}>
            {[2, 3, 4, 5].filter(n => n <= form.maxStudents).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Course'}
      </button>
    </form>
  );
}

function CreateExamForm({ course, onSuccess }) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  const [questions, setQuestions] = useState([
    { question_text: '', options: ['', '', '', ''], correct_answer_idx: 0 },
    { question_text: '', options: ['', '', '', ''], correct_answer_idx: 0 },
    { question_text: '', options: ['', '', '', ''], correct_answer_idx: 0 },
    { question_text: '', options: ['', '', '', ''], correct_answer_idx: 0 },
    { question_text: '', options: ['', '', '', ''], correct_answer_idx: 0 },
  ]);
  const [durationMin, setDurationMin] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateQuestion = (i, field, value) => {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  };

  const updateOption = (qi, oi, value) => {
    setQuestions(qs => qs.map((q, idx) => {
      if (idx !== qi) return q;
      const newOptions = [...q.options];
      newOptions[oi] = value;
      return { ...q, options: newOptions };
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      for (const q of questions) {
        if (!q.question_text.trim() || q.options.some(o => !o.trim())) {
          throw new Error('All questions and options must be filled');
        }
      }

      const answerKey = questions.map(q => q.correct_answer_idx);

      const answerKeyBytes = new Uint8Array(answerKey);
      const hashHex = keccak256(answerKeyBytes);
      const answerHash = Array.from(new Uint8Array(
        hashHex.match(/.{2}/g).map(byte => parseInt(byte, 16))
      ));

      const durationMs = BigInt(durationMin * 60 * 1000);

      const courseObjId = course.on_chain_id;

      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::course::create_exam`,
        arguments: [
          tx.object(courseObjId),
          tx.pure.vector('u8', answerHash),
          tx.pure.u64(durationMs.toString()),
        ],
      });

      const result = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest: result.digest });

      const questionsData = questions.map((q, i) => ({
        question_number: i + 1,
        question_text: q.question_text,
        options: q.options,
        correct_answer_idx: q.correct_answer_idx,
      }));

      await apiCreateExam(course.id, { questions: questionsData });

      await startExamBackend(course.id, {
        exam_start_time: Date.now().toString(),
        exam_deadline: (Date.now() + durationMin * 60 * 1000).toString(),
      });

      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="exam-form" onSubmit={handleSubmit}>
      <h3>Create Exam for: {course.name}</h3>
      <p className="hint">Create 5 multiple-choice questions. Students will have {durationMin} minutes.</p>
      {error && <p className="error-text">{error}</p>}

      <div className="form-group">
        <label>Duration (minutes)</label>
        <input type="number" min="1" max="60" value={durationMin} onChange={e => setDurationMin(parseInt(e.target.value) || 10)} />
      </div>

      {questions.map((q, i) => (
        <div key={i} className="question-block">
          <h4>Question {i + 1}</h4>
          <input type="text" placeholder="Question text" value={q.question_text}
            onChange={e => updateQuestion(i, 'question_text', e.target.value)} required />
          {q.options.map((opt, oi) => (
            <div key={oi} className="option-row">
              <input type="radio" name={`correct-${i}`} checked={q.correct_answer_idx === oi}
                onChange={() => updateQuestion(i, 'correct_answer_idx', oi)} />
              <input type="text" placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt}
                onChange={e => updateOption(i, oi, e.target.value)} required />
            </div>
          ))}
        </div>
      ))}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Creating Exam...' : 'Create & Start Exam'}
      </button>
    </form>
  );
}

function CourseCard({ course, onAction }) {
  const status = course.status ?? 0;
  const statusLabel = STATUS_LABELS[status] || 'Unknown';

  return (
    <div className="course-card">
      <div className="course-header">
        <h3>{course.name}</h3>
        <span className={`badge badge-status-${status}`}>{statusLabel}</span>
      </div>
      {course.description && <p className="course-description">{course.description}</p>}
      <div className="course-stats">
        <span>{course.enrolled_count || 0}/{course.max_students} students</span>
        <span className="course-price">{MIST_TO_SUI(course.tuition_amount)} SUI</span>
      </div>
      <div className="course-actions">
        {status === STATUS.READY_FOR_EXAM && (
          <button className="btn btn-primary btn-sm" onClick={() => onAction('createExam', course)}>
            Create Exam
          </button>
        )}
        {status === STATUS.EXAM_ACTIVE && (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => onAction('viewSubmissions', course)}>
              View Submissions
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => onAction('scoreExam', course)}>
              Score & Reveal
            </button>
          </>
        )}
        {status >= STATUS.SCORED && (
          <button className="btn btn-secondary btn-sm" onClick={() => onAction('viewResults', course)}>
            View Results
          </button>
        )}
      </div>
    </div>
  );
}

const TeacherPage = () => {
  const { address, isConnected } = useWallet();
  const { role, isTeacher, hasRole } = useRole();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [results, setResults] = useState([]);

  const loadCourses = useCallback(async () => {
    try {
      const data = await getAllCourses({ teacher: address });
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) loadCourses();
  }, [address, loadCourses]);

  const handleAction = async (action, course) => {
    setSelectedCourse(course);
    if (action === 'createExam') {
      setActiveView('createExam');
    } else if (action === 'viewSubmissions') {
      try {
        const data = await getSubmissions(course.id);
        setSubmissions(data);
        setActiveView('submissions');
      } catch (err) {
        console.error('Failed to load submissions:', err);
      }
    } else if (action === 'scoreExam') {
      setActiveView('scoreExam');
    } else if (action === 'viewResults') {
      try {
        const data = await getResults(course.id);
        setResults(data);
        setActiveView('results');
      } catch (err) {
        console.error('Failed to load results:', err);
      }
    }
  };

  const handleScoreExam = async () => {
    if (!selectedCourse) return;
    setActiveView('dashboard');
    loadCourses();
  };

  if (!isConnected) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Teacher Dashboard</h1>
          <p>Please connect your wallet.</p>
          <ConnectButton connectText="Connect Wallet" />
        </div>
      </div>
    );
  }

  if (hasRole && !isTeacher) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Access Denied</h1>
          <p>You are registered as a <strong>student</strong>. Go to the <a href="/student">Student Dashboard</a>.</p>
        </div>
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Teacher Dashboard</h1>
          <p>Please select your role first. <a href="/">Choose Role</a></p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <nav className="navbar">
        <h1>Teacher Dashboard</h1>
        <WalletDisconnectButton />
      </nav>

      {activeView === 'dashboard' && (
        <div className="dashboard">
          <div className="section-header">
            <h2>Your Courses</h2>
            <button className="btn btn-primary" onClick={() => setActiveView('createCourse')}>
              + Create Course
            </button>
          </div>

          {loading ? (
            <p>Loading courses...</p>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <p>You haven't created any courses yet.</p>
              <button className="btn btn-primary" onClick={() => setActiveView('createCourse')}>
                Create Your First Course
              </button>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map(course => (
                <CourseCard key={course.id} course={course} onAction={handleAction} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'createCourse' && (
        <div className="dashboard">
          <button className="btn btn-back" onClick={() => setActiveView('dashboard')}>← Back</button>
          <CreateCourseForm onSuccess={() => { setActiveView('dashboard'); loadCourses(); }} />
        </div>
      )}

      {activeView === 'createExam' && selectedCourse && (
        <div className="dashboard">
          <button className="btn btn-back" onClick={() => setActiveView('dashboard')}>← Back</button>
          <CreateExamForm course={selectedCourse} onSuccess={() => { setActiveView('dashboard'); loadCourses(); }} />
        </div>
      )}

      {activeView === 'submissions' && selectedCourse && (
        <div className="dashboard">
          <button className="btn btn-back" onClick={() => setActiveView('dashboard')}>← Back</button>
          <h2>Submissions for {selectedCourse.name}</h2>
          {submissions.length === 0 ? (
            <p>No submissions yet.</p>
          ) : (
            <div className="submissions-list">
              {submissions.map((s, i) => (
                <div key={i} className="submission-card">
                  <span>{s.student_address?.slice(0, 8)}...{s.student_address?.slice(-4)}</span>
                  <span>{s.is_auto_submit ? 'Auto-submitted' : 'Submitted'}</span>
                  <span>{new Date(s.submitted_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'results' && selectedCourse && (
        <div className="dashboard">
          <button className="btn btn-back" onClick={() => setActiveView('dashboard')}>← Back</button>
          <h2>Results for {selectedCourse.name}</h2>
          {results.length === 0 ? (
            <p>No results available yet.</p>
          ) : (
            <div className="results-list">
              {results.map((r, i) => (
                <div key={i} className="result-card">
                  <span>#{r.rank}</span>
                  <span>{r.student_address?.slice(0, 8)}...{r.student_address?.slice(-4)}</span>
                  <span>Score: {r.percentage}%</span>
                  <span>Reward: {MIST_TO_SUI(r.reward_amount || 0).toFixed(4)} SUI</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherPage;