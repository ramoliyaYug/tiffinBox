"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "../../styles/Admin.css"

function CreateExam() {
    const navigate = useNavigate()
    const [examData, setExamData] = useState({
        name: "",
        description: "",
        duration: 60,
    })
    const [questions, setQuestions] = useState([
        {
            text: "",
            options: ["", "", "", ""],
            correctAnswer: 0,
        },
    ])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const handleExamChange = (e) => {
        const { name, value } = e.target
        setExamData({
            ...examData,
            [name]: name === "duration" ? Number.parseInt(value) : value,
        })
    }

    const handleQuestionChange = (index, field, value) => {
        const updatedQuestions = [...questions]
        updatedQuestions[index][field] = value
        setQuestions(updatedQuestions)
    }

    const handleOptionChange = (questionIndex, optionIndex, value) => {
        const updatedQuestions = [...questions]
        updatedQuestions[questionIndex].options[optionIndex] = value
        setQuestions(updatedQuestions)
    }

    const handleCorrectAnswerChange = (questionIndex, value) => {
        const updatedQuestions = [...questions]
        updatedQuestions[questionIndex].correctAnswer = Number.parseInt(value)
        setQuestions(updatedQuestions)
    }

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                text: "",
                options: ["", "", "", ""],
                correctAnswer: 0,
            },
        ])
    }

    const removeQuestion = (index) => {
        if (questions.length > 1) {
            const updatedQuestions = [...questions]
            updatedQuestions.splice(index, 1)
            setQuestions(updatedQuestions)
        }
    }

    const validateForm = () => {
        if (!examData.name || !examData.description || !examData.duration) {
            setError("Please fill in all exam details")
            return false
        }
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i]
            if (!q.text) {
                setError(`Question ${i + 1} is missing text`)
                return false
            }

            for (let j = 0; j < q.options.length; j++) {
                if (!q.options[j]) {
                    setError(`Question ${i + 1}, Option ${j + 1} is empty`)
                    return false
                }
            }
        }
        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSuccess("")

        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            const response = await axios.post("/api/exams", {
                ...examData,
                questions,
            })

            setSuccess("Exam created successfully!")
            setTimeout(() => {
                navigate("/admin")
            }, 2000)
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create exam")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="create-exam-container">
            <h2>Create New Exam</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit}>
                <div className="exam-details">
                    <h3>Exam Details</h3>
                    <div className="form-group">
                        <label>Exam Name</label>
                        <input
                            type="text"
                            name="name"
                            value={examData.name}
                            onChange={handleExamChange}
                            placeholder="Enter exam name"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={examData.description}
                            onChange={handleExamChange}
                            placeholder="Enter exam description"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Duration (minutes)</label>
                        <input
                            type="number"
                            name="duration"
                            value={examData.duration}
                            onChange={handleExamChange}
                            min="1"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="questions-section">
                    <h3>Questions</h3>
                    {questions.map((question, qIndex) => (
                        <div key={qIndex} className="question-card">
                            <div className="question-header">
                                <h4>Question {qIndex + 1}</h4>
                                <button
                                    type="button"
                                    className="remove-question-btn"
                                    onClick={() => removeQuestion(qIndex)}
                                    disabled={questions.length === 1 || isLoading}
                                >
                                    Remove
                                </button>
                            </div>

                            <div className="form-group">
                                <label>Question Text</label>
                                <textarea
                                    value={question.text}
                                    onChange={(e) => handleQuestionChange(qIndex, "text", e.target.value)}
                                    placeholder="Enter question text"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="options-container">
                                <label>Options</label>
                                {question.options.map((option, oIndex) => (
                                    <div key={oIndex} className="option-row">
                                        <input
                                            type="radio"
                                            name={`correct-${qIndex}`}
                                            checked={question.correctAnswer === oIndex}
                                            onChange={() => handleCorrectAnswerChange(qIndex, oIndex)}
                                            disabled={isLoading}
                                        />
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                            placeholder={`Option ${oIndex + 1}`}
                                            disabled={isLoading}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button type="button" className="add-question-btn" onClick={addQuestion} disabled={isLoading}>
                        Add Question
                    </button>
                </div>

                <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => navigate("/admin")} disabled={isLoading}>
                        Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create Exam"}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default CreateExam
