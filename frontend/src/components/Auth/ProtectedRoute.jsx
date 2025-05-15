"use client"

import { useContext } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../../context/AuthContext"

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useContext(AuthContext)

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/" />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/student"} />
  }

  return children
}

export default ProtectedRoute
