import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const walletAddress = localStorage.getItem('wallet_address');
  if (walletAddress) config.headers['x-wallet-address'] = walletAddress;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

// Users
export const registerUser = (walletAddress, role, txDigest) =>
  api.post('/users/register', { wallet_address: walletAddress, role, tx_digest: txDigest }).then((r) => r.data);
export const getUserRole = (walletAddress) =>
  api.get(`/users/${walletAddress}/role`).then((r) => r.data);
export const getUserProfile = (walletAddress) =>
  api.get(`/users/${walletAddress}`).then((r) => r.data);
export const getOnChainRole = (walletAddress) =>
  api.get(`/users/${walletAddress}/on-chain-role`).then((r) => r.data);

// Courses
export const createCourse = (data) => api.post('/courses', data).then((r) => r.data);
export const getAllCourses = (params = {}) =>
  api.get('/courses', { params }).then((r) => r.data);
export const getCourseById = (id) => api.get(`/courses/${id}`).then((r) => r.data);
export const updateCourseStatus = (id, data) =>
  api.patch(`/courses/${id}/status`, data).then((r) => r.data);

// Exam
export const createExam = (courseId, data) =>
  api.post(`/courses/${courseId}/exam`, data).then((r) => r.data);
export const getExamQuestions = (courseId, params = {}) =>
  api.get(`/exams/${courseId}/questions`, { params }).then((r) => r.data);
export const getExamStatus = (courseId) =>
  api.get(`/exams/${courseId}/status`).then((r) => r.data);
export const startExamBackend = (courseId, data) =>
  api.post(`/courses/${courseId}/start`, data).then((r) => r.data);
export const scoreExam = (courseId) =>
  api.post(`/courses/${courseId}/score`).then((r) => r.data);
export const scoreExamPrepare = (courseId) =>
  api.post(`/courses/${courseId}/score/prepare`).then((r) => r.data);
export const scoreExamCommit = (courseId) =>
  api.post(`/courses/${courseId}/score/commit`).then((r) => r.data);

// Enrollment
export const enrollInCourse = (courseId, data) =>
  api.post(`/courses/${courseId}/enroll`, data).then((r) => r.data);
export const checkEnrollment = (courseId, studentAddress) =>
  api.get(`/courses/${courseId}/enrollment-check`, { params: { student_address: studentAddress } }).then((r) => r.data);

// Submissions
export const submitAnswers = (courseId, data) =>
  api.post(`/courses/${courseId}/submit`, data).then((r) => r.data);
export const autoSubmit = (courseId, data) =>
  api.post(`/courses/${courseId}/auto-submit`, data).then((r) => r.data);
export const getSubmissions = (courseId) =>
  api.get(`/courses/${courseId}/submissions`).then((r) => r.data);
export const getMySubmission = (courseId, studentAddress) =>
  api.get(`/courses/${courseId}/submission`, { params: { student_address: studentAddress } }).then((r) => r.data);
export const checkSubmission = (courseId, studentAddress) =>
  api.get(`/courses/${courseId}/submission-check`, { params: { student_address: studentAddress } }).then((r) => r.data);

// Results
export const getResults = (courseId) =>
  api.get(`/courses/${courseId}/results`).then((r) => r.data);
export const getMyRank = (courseId, studentAddress) =>
  api.get(`/courses/${courseId}/my-rank`, { params: { student_address: studentAddress } }).then((r) => r.data);
export const updateRewards = (courseId) =>
  api.patch(`/courses/${courseId}/rewards`).then((r) => r.data);

// AI
export const generateQuestions = ({ topic, count, difficulty }) =>
  api.post('/ai/generate-questions', { topic, count, difficulty }).then((r) => r.data);

export default api;
