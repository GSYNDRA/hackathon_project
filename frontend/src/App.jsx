import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';
import { useRole } from './contexts/RoleContext';
import { useWallet } from './contexts/WalletContext';

function Protected({ role, children }) {
  const { address } = useWallet();
  const { role: myRole } = useRole();
  if (!address) return <Navigate to="/" replace />;
  if (myRole !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/teacher"
          element={
            <Protected role="teacher">
              <TeacherPage />
            </Protected>
          }
        />
        <Route
          path="/student"
          element={
            <Protected role="student">
              <StudentPage />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
