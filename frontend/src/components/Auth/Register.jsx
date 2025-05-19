"use client"

import { useState, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthContext } from "../../context/AuthContext"
import "../../styles/Auth.css"
import axios from "axios"

function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("student")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { register, user } = useContext(AuthContext)
  const navigate = useNavigate()

  if (user) {
    navigate(user.role === "admin" ? "/admin" : "/student")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      console.log("Sending registration data:", { name, email, password, role })

      const response = await axios.post("/api/auth/register", {
        name,
        email,
        password,
        role,
      })

      console.log("Registration response:", response.data)
      navigate("/") 
    } catch (err) {
      console.error("Registration error:", err)
      setError(err.response?.data?.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <div className="login-container">
        <div className="login-form register-form">
          <h2>Register Account</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} disabled={isLoading}>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register"}
            </button>
          </form>
          <div className="auth-links">
            <p>
              Already have an account? <Link to="/">Login</Link>
            </p>
          </div>
        </div>
      </div>
  )
}

export default Register
