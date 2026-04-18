import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RoleProvider } from './contexts/RoleContext';
import TeacherSetup from './components/TeacherSetup';
import TeacherPage from './pages/TeacherPage';
import StudentPage from './pages/StudentPage';
import './index.css';

function App() {
  return (
    <RoleProvider>
      <Router>
        <div className="app">
          <nav className="navbar" style={{ padding: '1rem 2rem', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
            <h1 style={{ margin: 0, color: '#4f46e5' }}>📚 Sui Teaching Platform</h1>
          </nav>
          
          <main style={{ padding: '2rem' }}>
            <Routes>
              <Route path="/" element={<TeacherSetup />} />
              <Route path="/teacher" element={<TeacherPage />} />
              <Route path="/student" element={<StudentPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </RoleProvider>
  );
}

export default App;
