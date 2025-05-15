"use client"

import { createContext, useState, useEffect } from "react"
import axios from "axios"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if a user is logged in on a page load
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem("token")

        if (token) {
          // Configure axios to use token in headers
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

          // Verify token with backend
          const res = await axios.get("/api/auth/verify")
          setUser(res.data.user)
        }
      } catch (err) {
        // If a token is invalid, clear it
        localStorage.removeItem("token")
        delete axios.defaults.headers.common["Authorization"]
      } finally {
        setLoading(false)
      }
    }

    checkLoggedIn()
  }, [])

  const login = async (credentials) => {
    try {
      const res = await axios.post("/api/auth/login", credentials)
      const { token, user } = res.data

      // Save token to localStorage
      localStorage.setItem("token", token)

      // Set default headers for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

      setUser(user)
      return user
    } catch (err) {
      throw err.response?.data?.message || "Login failed"
    }
  }

  const register = async (userData) => {
    try {
      const res = await axios.post("/api/auth/register", userData)
      return res.data
    } catch (err) {
      throw err.response?.data?.message || "Registration failed"
    }
  }

  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem("token")

    // Remove authorization header
    delete axios.defaults.headers.common["Authorization"]

    // Clear user from state
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}
