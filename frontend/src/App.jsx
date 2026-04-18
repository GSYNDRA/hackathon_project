import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider } from './contexts/RoleContext';
import RoleSelector from './components/RoleSelector';
import TeacherPage from './pages/TeacherPage';
import StudentPage from './pages/StudentPage';
import './index.css';

function App() {
  return (
    <RoleProvider>
      <Router>
        <Routes>
          <Route path="/" element={<RoleSelector />} />
          <Route path="/teacher" element={<TeacherPage />} />
          <Route path="/student" element={<StudentPage />} />
        </Routes>
      </Router>
    </RoleProvider>
  );
}

export default App;