import React from 'react'

const TeacherPage = () => {
  return (
    <div className="page">
      <div className="page-header">
        <h1>👨‍🏫 Teacher Dashboard</h1>
        <p>Manage your courses and exams</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">3</div>
          <div className="stat-label">Total Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">1</div>
          <div className="stat-label">Enrolling</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">2</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Your Courses</h2>
          <button className="btn btn-primary">+ Create New Course</button>
        </div>

        <div className="courses-grid">
          <div className="course-card">
            <div className="course-header">
              <h3>Introduction to Blockchain</h3>
              <span className="badge badge-enrolling">Enrolling</span>
            </div>
            <p className="course-description">Learn the basics of blockchain technology</p>
            <div className="course-stats">
              <span>3/5 students</span>
              <span className="course-price">100 SUI</span>
            </div>
            <div className="course-actions">
              <button className="btn btn-secondary">View Details</button>
            </div>
          </div>

          <div className="course-card">
            <div className="course-header">
              <h3>Move Programming</h3>
              <span className="badge badge-ready">Ready for Exam</span>
            </div>
            <p className="course-description">Master the Move programming language</p>
            <div className="course-stats">
              <span>5/5 students</span>
              <span className="course-price">150 SUI</span>
            </div>
            <div className="course-actions">
              <button className="btn btn-secondary">View Details</button>
              <button className="btn btn-primary">Create Exam</button>
            </div>
          </div>

          <div className="course-card">
            <div className="course-header">
              <h3>Smart Contract Security</h3>
              <span className="badge badge-completed">Completed</span>
            </div>
            <p className="course-description">Learn best practices for secure smart contracts</p>
            <div className="course-stats">
              <span>4/5 students</span>
              <span className="course-price">200 SUI</span>
            </div>
            <div className="course-actions">
              <button className="btn btn-secondary">View Results</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherPage
