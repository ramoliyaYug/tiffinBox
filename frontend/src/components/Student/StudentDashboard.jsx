"use client"

import { useState, useEffect, useContext } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { AuthContext } from "../../context/AuthContext"
import "../../styles/Student.css"

function StudentDashboard() {
  const { user, logout } = useContext(AuthContext)
  const [availableExams, setAvailableExams] = useState([])
  const [completedExams, setCompletedExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const availableRes = await axios.get("/api/exams/available")
        setAvailableExams(availableRes.data)

        const completedRes = await axios.get("/api/exams/completed")
        setCompletedExams(completedRes.data)

        setLoading(false)
      } catch (err) {
        setError("Failed to fetch exams")
        setLoading(false)
      }
    }

    fetchExams()
  }, [])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
      <div className="student-dashboard">
        <header className="student-header">
          <h1>Student Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <div className="dashboard-content">
          <div className="exams-section">
            <h2>Available Exams</h2>
            {availableExams.length === 0 ? (
                <p className="no-exams">No exams available at the moment.</p>
            ) : (
                <ul className="exams-list">
                  {availableExams.map((exam) => (
                      <li key={exam._id} className="exam-card">
                        <div className="exam-details">
                          <h3>{exam.name}</h3>
                          <p>{exam.description}</p>
                          <p>Duration: {exam.duration} minutes</p>
                          <p>Questions: {exam.questionCount}</p>
                        </div>
                        <Link to={`/exam/${exam._id}`} className="start-exam-button">
                          Start Exam
                        </Link>
                      </li>
                  ))}
                </ul>
            )}
          </div>

          <div className="exams-section">
            <h2>Completed Exams</h2>
            {completedExams.length === 0 ? (
                <p className="no-exams">No completed exams.</p>
            ) : (
                <ul className="exams-list">
                  {completedExams.map((exam) => (
                      <li key={exam._id} className="exam-card completed">
                        <div className="exam-details">
                          <h3>{exam.examName}</h3>
                          <p>Score: {exam.score}%</p>
                          <p>Completed on: {new Date(exam.completedAt).toLocaleDateString()}</p>
                          {exam.forcedSubmission && <p className="forced-submission">Forced submission due to violations</p>}
                        </div>
                      </li>
                  ))}
                </ul>
            )}
          </div>
        </div>
      </div>
  )
}

export default StudentDashboard
