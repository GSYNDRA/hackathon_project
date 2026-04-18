import React from 'react'

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to Sui Teaching Platform</h1>
        <p className="hero-description">
          A decentralized learning platform where teachers create courses and students 
          compete for rewards. Top performers win back their tuition!
        </p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Create Courses</h3>
            <p>Teachers can create courses with custom tuition and student limits</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Take Exams</h3>
            <p>Synchronized exams with countdown timers for fair competition</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Win Rewards</h3>
            <p>Top 20% of students win back their tuition automatically</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Trustless</h3>
            <p>All payments and rewards handled by smart contracts on Sui</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
