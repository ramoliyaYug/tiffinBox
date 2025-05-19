"use client"

import { useState, useEffect, useContext } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { AuthContext } from "../../context/AuthContext"
import "../../styles/Admin.css"

function AdminDashboard() {
  const { user, logout } = useContext(AuthContext)
  const [activeExams, setActiveExams] = useState([])
  const [activeStudents, setActiveStudents] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get("/api/exams")
        setActiveExams(res.data)
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch exams")
        setLoading(false)
      }
    }

    fetchExams()
  }, [])

  const handleExamSelect = async (exam) => {
    setSelectedExam(exam)
    try {
      const res = await axios.get(`/api/monitoring/${exam._id}`)
      setActiveStudents(res.data)
    } catch (err) {
      setError("Failed to fetch student data")
    }
  }

  const toggleExamStatus = async (examId, currentStatus) => {
    try {
      await axios.put(`/api/exams/${examId}`, {
        active: !currentStatus,
      })

      setActiveExams(
          activeExams.map((exam) => {
            if (exam._id === examId) {
              return { ...exam, active: !exam.active }
            }
            return exam
          }),
      )

      if (selectedExam && selectedExam._id === examId) {
        setSelectedExam({ ...selectedExam, active: !selectedExam.active })
      }
    } catch (err) {
      setError("Failed to update exam status")
    }
  }

  useEffect(() => {
    if (!selectedExam) return

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/monitoring/${selectedExam._id}`)
        setActiveStudents(res.data)
      } catch (err) {
        console.error("Failed to update student data:", err)
      }
    }, 5000) 

    return () => clearInterval(interval)
  }, [selectedExam])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
      <div className="admin-dashboard">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <div className="admin-actions">
          <Link to="/admin/create-exam" className="create-exam-btn">
            Create New Exam
          </Link>
        </div>

        <div className="dashboard-content">
          <div className="exams-list">
            <h2>Exams</h2>
            {activeExams.length === 0 ? (
                <p className="no-exams">No exams available. Create your first exam!</p>
            ) : (
                <ul>
                  {activeExams.map((exam) => (
                      <li
                          key={exam._id}
                          className={`${selectedExam && selectedExam._id === exam._id ? "selected" : ""} ${
                              exam.active ? "active-exam" : "inactive-exam"
                          }`}
                      >
                        <div className="exam-item" onClick={() => handleExamSelect(exam)}>
                          <span className="exam-name">{exam.name}</span>
                          <span className="exam-time">{exam.duration} mins</span>
                        </div>
                        <div className="exam-actions">
                          <button
                              className={`status-toggle ${exam.active ? "active" : "inactive"}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleExamStatus(exam._id, exam.active)
                              }}
                          >
                            {exam.active ? "Active" : "Inactive"}
                          </button>
                        </div>
                      </li>
                  ))}
                </ul>
            )}
          </div>

          <div className="monitoring-panel">
            <h2>{selectedExam ? `Monitoring: ${selectedExam.name}` : "Select an exam to monitor"}</h2>

            {selectedExam && (
                <div className="students-list">
                  <div className="student-row header">
                    <span>Student</span>
                    <span>Status</span>
                    <span>Warnings</span>
                    <span>Time Left</span>
                  </div>

                  {activeStudents.length === 0 ? (
                      <p className="no-students">No students taking this exam yet.</p>
                  ) : (
                      activeStudents.map((student) => (
                          <div key={student._id} className={`student-row ${student.status}`}>
                            <span>{student.name}</span>
                            <span className="status">{student.status}</span>
                            <span>{student.warnings}</span>
                            <span>{student.timeLeft} mins</span>
                          </div>
                      ))
                  )}
                </div>
            )}
          </div>
        </div>
      </div>
  )
}

export default AdminDashboard
