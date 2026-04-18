import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useRole } from '../contexts/RoleContext';
import { useWallet } from '../contexts/WalletContext';
import WalletDisconnectButton from '../components/WalletDisconnectButton';
import {
  getAllCourses,
  getCourseById,
  checkEnrollment,
  getExamQuestions,
  getExamStatus,
  enrollInCourse,
  submitAnswers,
  checkSubmission,
  getMyRank,
  getResults,
} from '../services/api';
import { PACKAGE_ID, PLATFORM_OBJECT_ID, COURSE_STATUSES, STATUS_LABELS, SUI_TO_MIST, MIST_TO_SUI } from '../config/constants';

const STATUS = COURSE_STATUSES;

function EnrollButton({ course, address, onEnrolled }) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEnroll = async () => {
    if (!address) return setError('Wallet not connected');
    setLoading(true);
    setError(null);

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
        ],
      });

      const result = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest: result.digest });

      await enrollInCourse(course.id, {
        student_address: address,
        amount_paid: course.tuition_amount,
        tx_digest: result.digest,
      });

      onEnrolled?.();
    } catch (err) {
      setError(err.message || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button className="btn btn-primary btn-sm" onClick={handleEnroll} disabled={loading}>
        {loading ? 'Enrolling...' : `Enroll & Pay ${MIST_TO_SUI(course.tuition_amount)} SUI`}
      </button>
      {error && <p className="error-text-sm">{error}</p>}
    </div>
  );
}

function ExamView({ course, address, onComplete }) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const answersRef = useRef({});

  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await getExamQuestions(course.id);
        setQuestions(data);
        const initial = {};
        data.forEach((_, i) => { initial[i] = null; });
        setAnswers(initial);
      } catch (err) {
        setError('Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    const loadTiming = async () => {
      try {
        const status = await getExamStatus(course.id);
        if (status.exam_deadline) {
          const deadline = parseInt(status.exam_deadline);
          const remaining = Math.max(0, deadline - Date.now());
          setTimeLeft(remaining);
        }
      } catch {
        // fallback: no timing from backend
      }
    };

    loadQuestions();
    loadTiming();
  }, [course.id]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft !== null && timeLeft > 0]);

  const handleAutoSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const currentAnswers = answersRef.current;
    const answerArray = questions.map((_, i) => currentAnswers[i] !== null && currentAnswers[i] !== undefined ? currentAnswers[i] : 255);

    try {
      await submitAnswers(course.id, {
        student_address: address,
        answers: answerArray,
        is_auto_submit: true,
      });
      setSubmitted(true);
      onComplete?.();
    } catch (err) {
      console.error('Auto-submit failed:', err);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const answerArray = questions.map((_, i) => {
        const a = answers[i];
        return a !== null && a !== undefined ? a : 255;
      });

      await submitAnswers(course.id, {
        student_address: address,
        answers: answerArray,
        submitted_at: new Date().toISOString(),
      });

      setSubmitted(true);
      if (timerRef.current) clearInterval(timerRef.current);
      onComplete?.();
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ms) => {
    if (ms <= 0) return '00:00';
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) return <p>Loading exam...</p>;

  if (submitted) {
    return (
      <div className="exam-submitted">
        <h3>Answers Submitted!</h3>
        <p>Wait for the teacher to score the exam.</p>
        <button className="btn btn-secondary" onClick={onComplete}>Back to Dashboard</button>
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter(a => a !== null && a !== undefined).length;

  return (
    <div className="exam-view">
      <div className="exam-header">
        <h2>{course.name} - Exam</h2>
        {timeLeft !== null && (
          <div className={`timer ${timeLeft < 60000 ? 'timer-urgent' : ''}`}>
            Time: {formatTime(timeLeft)}
          </div>
        )}
        <p>{answeredCount}/{questions.length} answered</p>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="questions-list">
        {questions.map((q, i) => (
          <div key={i} className={`question-item ${answers[i] !== null && answers[i] !== undefined ? 'answered' : 'unanswered'}`}>
            <h4>Q{i + 1}: {q.question_text}</h4>
            <div className="options-list">
              {Array.isArray(q.options) && q.options.map((opt, oi) => (
                <label key={oi} className="option-label">
                  <input type="radio" name={`q-${i}`}
                    checked={answers[i] === oi}
                    onChange={() => setAnswers(prev => ({ ...prev, [i]: oi }))}
                  />
                  <span>{String.fromCharCode(65 + oi)}. {opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting...' : `Submit Answers (${answeredCount}/${questions.length})`}
      </button>
    </div>
  );
}

function ResultsView({ course }) {
  const [results, setResults] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const { address } = useWallet();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getResults(course.id);
        setResults(data);
      } catch (err) {
        console.error('Failed to load results:', err);
      }
    };
    load();
  }, [course.id]);

  useEffect(() => {
    if (address) {
      getMyRank(course.id, address).then(setMyRank).catch(() => {});
    }
  }, [course.id, address]);

  return (
    <div className="results-view">
      <h2>Results: {course.name}</h2>
      {myRank && (
        <div className="my-rank-card">
          <h3>Your Result</h3>
          <p>Rank: #{myRank.rank}</p>
          <p>Score: {myRank.percentage}%</p>
          {myRank.reward_amount > 0 && <p className="reward-text">Reward: {(myRank.reward_amount / 1e9).toFixed(4)} SUI</p>}
        </div>
      )}
      <div className="results-list">
        {results.map((r, i) => (
          <div key={i} className="result-card">
            <span>#{r.rank}</span>
            <span>{r.student_address?.slice(0, 8)}...{r.student_address?.slice(-4)}</span>
            <span>Score: {r.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const StudentPage = () => {
  const { address, isConnected } = useWallet();
  const { role, isStudent, hasRole } = useRole();
  const [courses, setCourses] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState(null);

  const loadData = useCallback(async () => {
    if (!address) return;
    try {
      setLoading(true);
      const data = await getAllCourses({});
      setCourses(data);

      const enrollChecks = {};
      const subChecks = {};
      for (const c of data) {
        try {
          const enrollRes = await checkEnrollment(c.id, address);
          enrollChecks[c.id] = enrollRes.isEnrolled;
        } catch { enrollChecks[c.id] = false; }

        if (enrollChecks[c.id] && c.status >= STATUS.EXAM_ACTIVE) {
          try {
            const subRes = await checkSubmission(c.id, address);
            subChecks[c.id] = subRes.hasSubmitted;
          } catch { subChecks[c.id] = false; }
        }
      }
      setEnrollmentStatus(enrollChecks);
      setSubmissionStatus(subChecks);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) loadData();
  }, [address, loadData]);

  const handleCourseAction = (course, action) => {
    setSelectedCourse(course);
    setActiveView(action);
  };

  const refreshData = () => {
    setActiveView('dashboard');
    setSelectedCourse(null);
    loadData();
  };

  if (!isConnected) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Student Dashboard</h1>
          <p>Please connect your wallet.</p>
          <ConnectButton connectText="Connect Wallet" />
        </div>
      </div>
    );
  }

  if (hasRole && !isStudent) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Access Denied</h1>
          <p>You are registered as a <strong>teacher</strong>. Go to the <a href="/teacher">Teacher Dashboard</a>.</p>
        </div>
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Student Dashboard</h1>
          <p>Please select your role first. <a href="/">Choose Role</a></p>
        </div>
      </div>
    );
  }

  const myCourses = courses.filter(c => enrollmentStatus[c.id]);
  const availableCourses = courses.filter(c => !enrollmentStatus[c.id] && c.status === STATUS.ENROLLING);

  return (
    <div className="page">
      <nav className="navbar">
        <h1>Student Dashboard</h1>
        <WalletDisconnectButton />
      </nav>

      {activeView === 'dashboard' && (
        <div className="dashboard">
          {myCourses.length > 0 && (
            <div className="section">
              <h2>My Courses</h2>
              <div className="courses-grid">
                {myCourses.map(course => {
                  const status = course.status ?? 0;
                  const hasSubmitted = submissionStatus[course.id];
                  return (
                    <div key={course.id} className="course-card">
                      <div className="course-header">
                        <h3>{course.name}</h3>
                        <span className={`badge badge-status-${status}`}>{STATUS_LABELS[status]}</span>
                      </div>
                      {course.description && <p className="course-description">{course.description}</p>}
                      <div className="course-stats">
                        <span>{course.enrolled_count || 0}/{course.max_students} students</span>
                        <span className="course-price">{MIST_TO_SUI(course.tuition_amount)} SUI</span>
                      </div>
                      <div className="course-actions">
                        {status === STATUS.EXAM_ACTIVE && !hasSubmitted && (
                          <button className="btn btn-primary btn-sm"
                            onClick={() => handleCourseAction(course, 'exam')}>
                            Enter Exam
                          </button>
                        )}
                        {status === STATUS.EXAM_ACTIVE && hasSubmitted && (
                          <span className="badge badge-submitted">Answers Submitted - Waiting for Results</span>
                        )}
                        {status >= STATUS.SCORED && (
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => handleCourseAction(course, 'results')}>
                            View Results
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="section">
            <h2>Available Courses</h2>
            {loading ? (
              <p>Loading...</p>
            ) : availableCourses.length === 0 ? (
              <div className="empty-state">
                <p>No courses available for enrollment right now.</p>
              </div>
            ) : (
              <div className="courses-grid">
                {availableCourses.map(course => (
                  <div key={course.id} className="course-card">
                    <div className="course-header">
                      <h3>{course.name}</h3>
                      <span className={`badge badge-status-${course.status}`}>{STATUS_LABELS[course.status]}</span>
                    </div>
                    {course.description && <p className="course-description">{course.description}</p>}
                    <div className="course-stats">
                      <span>{course.enrolled_count || 0}/{course.max_students} students</span>
                      <span className="course-price">{MIST_TO_SUI(course.tuition_amount)} SUI</span>
                    </div>
                    <div className="course-actions">
                      <EnrollButton course={course} address={address} onEnrolled={refreshData} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'exam' && selectedCourse && (
        <div className="dashboard">
          <button className="btn btn-back" onClick={refreshData}>← Back to Dashboard</button>
          <ExamView course={selectedCourse} address={address} onComplete={refreshData} />
        </div>
      )}

      {activeView === 'results' && selectedCourse && (
        <div className="dashboard">
          <button className="btn btn-back" onClick={refreshData}>← Back to Dashboard</button>
          <ResultsView course={selectedCourse} />
        </div>
      )}
    </div>
  );
};

export default StudentPage;