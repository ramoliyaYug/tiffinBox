"use client"

import { useState, useEffect, useRef, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { AuthContext } from "../../context/AuthContext"
import { detectTabSwitching, detectAppSwitching } from "../../utils/monitoring"
import "../../styles/Exam.css"

function ExamView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [warnings, setWarnings] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [examCompleted, setExamCompleted] = useState(false)

  const timerRef = useRef(null)
  const warningTimeoutRef = useRef(null)
  const monitoringIntervalRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const examRes = await axios.get(`/api/exams/${id}`)
        setExam(examRes.data)

        const initialTimeInSeconds = examRes.data.duration * 60
        setTimeLeft(initialTimeInSeconds)

        startTimeRef.current = Date.now()

        const questionsRes = await axios.get(`/api/exams/${id}/questions`)
        setQuestions(questionsRes.data)

        await axios.post(`/api/monitoring/start`, { examId: id })

        setLoading(false)
      } catch (err) {
        if (err.response?.status === 403 && err.response?.data?.message === "You have already completed this exam") {
          setError("You have already completed this exam. You cannot take it again.")
          setExamCompleted(true)
        } else {
          setError("Failed to load exam: " + (err.response?.data?.message || err.message))
        }
        setLoading(false)
      }
    }

    fetchExam()

    const handleVisibilityChange = () => {
      if (detectTabSwitching()) {
        handleSuspiciousActivity("Tab switching detected!")
      }
    }

    const handleAppSwitch = () => {
      if (detectAppSwitching()) {
        handleSuspiciousActivity("Application switching detected!")
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleAppSwitch)

    monitoringIntervalRef.current = setInterval(async () => {
      if (!loading && !examCompleted && exam) {
        try {
          await axios.post(`/api/monitoring/update`, {
            examId: id,
            timeLeft: Math.floor(timeLeft),
            warnings: warnings,
            currentQuestion: currentQuestion,
          })
        } catch (err) {
          console.error("Failed to update monitoring status:", err)
        }
      }
    }, 10000) 

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleAppSwitch)
      clearInterval(timerRef.current)
      clearTimeout(warningTimeoutRef.current)
      clearInterval(monitoringIntervalRef.current)

      if (!examCompleted && exam) {
        axios
            .post(`/api/monitoring/end`, { examId: id })
            .catch((err) => console.error("Failed to end monitoring session:", err))
      }
    }
  }, [id])

  useEffect(() => {
    if (!loading && !examCompleted && exam && timeLeft > 0) {
      console.log("Starting timer with", timeLeft, "seconds remaining")

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current)
            handleSubmitExam(false)
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [loading, examCompleted, exam]) 

  const handleSuspiciousActivity = async (message) => {
    if (examCompleted) return

    setWarnings((prev) => {
      const newWarnings = prev + 1

      setWarningMessage(message)
      setShowWarning(true)

      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(false)
      }, 3000)

      axios
          .post(`/api/monitoring/warning`, {
            examId: id,
            message: message,
          })
          .catch((err) => console.error("Failed to record warning:", err))

      if (newWarnings >= 3) {
        handleSubmitExam(true)
      }

      return newWarnings
    })
  }

  const handleAnswerSelect = (questionId, option) => {
    if (examCompleted) return

    setAnswers((prev) => {
      const updatedAnswers = {
        ...prev,
        [questionId]: option,
      }

      axios
          .post(`/api/exams/${id}/answer`, {
            questionId,
            answer: option,
          })
          .catch((err) => console.error("Failed to save answer:", err))

      return updatedAnswers
    })
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleSubmitExam = async (forced = false) => {
    if (examCompleted) return

    try {
      if (timerRef.current) clearInterval(timerRef.current)
      if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)

      setExamCompleted(true)

      const response = await axios.post(`/api/exams/${id}/submit`, {
        answers,
        forced,
        warnings,
      })

      alert(`Exam ${forced ? "forcefully " : ""}submitted! Your score: ${response.data.score}%`)
      navigate("/student")
    } catch (err) {
      setError("Failed to submit exam: " + (err.response?.data?.message || err.message))
      console.error("Failed to submit exam:", err)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return <div className="loading">Loading exam...</div>
  }

  if (examCompleted) {
    return (
        <div className="exam-completed">
          <h2>Exam Completed</h2>
          <p>You have already completed this exam.</p>
          <button onClick={() => navigate("/student")} className="return-button">
            Return to Dashboard
          </button>
        </div>
    )
  }

  if (error) {
    return (
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={() => navigate("/student")} className="return-button">
            Return to Dashboard
          </button>
        </div>
    )
  }

  if (!exam || questions.length === 0) {
    return <div className="error-message">Exam not found or no questions available.</div>
  }

  const question = questions[currentQuestion]

  return (
      <div className="exam-view">
        <header className="exam-header">
          <h1>{exam.name}</h1>
          <div className="exam-info">
            <div className="timer" data-testid="exam-timer">
              Time Left: {formatTime(timeLeft)}
            </div>
            <div className="warnings">Warnings: {warnings}/3</div>
          </div>
        </header>

        {showWarning && (
            <div className="warning-popup">
              <div className="warning-content">
                <h3>Warning!</h3>
                <p>{warningMessage}</p>
                <p>Warning {warnings}/3</p>
              </div>
            </div>
        )}

        <div className="question-container">
          <div className="question-number">
            Question {currentQuestion + 1} of {questions.length}
          </div>

          <div className="question">
            <h3>{question.text}</h3>
            <div className="options">
              {question.options.map((option, index) => (
                  <div
                      key={index}
                      className={`option ${answers[question._id] === index ? "selected" : ""}`}
                      onClick={() => handleAnswerSelect(question._id, index)}
                  >
                    <span className="option-label">{String.fromCharCode(65 + index)}</span>
                    <span className="option-text">{option}</span>
                  </div>
              ))}
            </div>
          </div>

          <div className="navigation">
            <button onClick={handlePrevQuestion} disabled={currentQuestion === 0} className="nav-button">
              Previous
            </button>

            {currentQuestion < questions.length - 1 ? (
                <button onClick={handleNextQuestion} className="nav-button">
                  Next
                </button>
            ) : (
                <button onClick={() => handleSubmitExam(false)} className="submit-button">
                  Submit Exam
                </button>
            )}
          </div>
        </div>
      </div>
  )
}

export default ExamView
