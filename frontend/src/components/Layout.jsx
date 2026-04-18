import React from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="logo">📚 Sui Teaching</Link>
      </div>
      <div className="navbar-menu">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/teacher" className="nav-link">Teacher</Link>
        <Link to="/student" className="nav-link">Student</Link>
      </div>
      <div className="navbar-end">
        <button className="btn btn-primary">Connect Wallet</button>
      </div>
    </nav>
  )
}

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <p>Sui Teaching Platform - Hackathon Demo</p>
      </footer>
    </div>
  )
}

export default Layout
