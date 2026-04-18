import React from 'react'

const StudentPage = () => {
  return (
    <div className="page">
      <div className="page-header">
        <h1>👨‍🎓 Student Dashboard</h1>
        <p>Browse courses and track your progress</p>
      </div>

      <div className="section">
        <h2>My Courses</h2>
        <div className="courses-grid">
          <div className="course-card">
            <div className="course-header">
              <h3>Introduction to Blockchain</h3>
              <span className="badge badge-active">Exam Active</span>
            </div>
            <p className="course-description">Learn the basics of blockchain technology</p>
            <div className="course-stats">
              <span>Enrolled: Jan 15, 2024</span>
            </div>
            <div className="course-actions">
              <button className="btn btn-primary">Enter Exam</button>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Available Courses</h2>
        <div className="courses-grid">
          <div className="course-card">
            <div className="course-header">
              <h3>Move Programming</h3>
              <span className="badge badge-enrolling">Enrolling</span>
            </div>
            <p className="course-description">Master the Move programming language</p>
            <div className="course-stats">
              <span>3/5 students enrolled</span>
              <span className="course-price">150 SUI</span>
            </div>
            <div className="course-actions">
              <button className="btn btn-primary">Enroll & Pay</button>
            </div>
          </div>

          <div className="course-card">
            <div className="course-header">
              <h3>Smart Contract Security</h3>
              <span className="badge badge-enrolling">Enrolling</span>
            </div>
            <p className="course-description">Learn best practices for secure smart contracts</p>
            <div className="course-stats">
              <span>2/5 students enrolled</span>
              <span className="course-price">200 SUI</span>
            </div>
            <div className="course-actions">
              <button className="btn btn-primary">Enroll & Pay</button>
            </div>
          </div>

          <div className="course-card">
            <div className="course-header">
              <h3>DeFi Fundamentals</h3>
              <span className="badge badge-enrolling">Enrolling</span>
            </div>
            <p className="course-description">Understanding decentralized finance</p>
            <div className="course-stats">
              <span>1/5 students enrolled</span>
              <span className="course-price">120 SUI</span>
            </div>
            <div className="course-actions">
              <button className="btn btn-primary">Enroll & Pay</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentPage
