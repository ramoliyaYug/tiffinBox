"use client"

import { createContext, useState, useEffect } from "react"
import axios from "axios"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem("token")

        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
          const res = await axios.get("/api/auth/verify")
          setUser(res.data.user)
        }
      } catch (err) {
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

      localStorage.setItem("token", token)

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
    localStorage.removeItem("token")

    delete axios.defaults.headers.common["Authorization"]

    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}
