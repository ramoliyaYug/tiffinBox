import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Login from "./components/Auth/Login"
import Register from "./components/Auth/Register"
import AdminDashboard from "./components/Admin/AdminDashboard"
import CreateExam from "./components/Admin/CreateExam"
import StudentDashboard from "./components/Student/StudentDashboard"
import ExamView from "./components/Student/ExamView"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/Auth/ProtectedRoute"
import "./styles/App.css"

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app-container">
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute requiredRole="admin">
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/create-exam"
                            element={
                                <ProtectedRoute requiredRole="admin">
                                    <CreateExam />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student"
                            element={
                                <ProtectedRoute requiredRole="student">
                                    <StudentDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/exam/:id"
                            element={
                                <ProtectedRoute requiredRole="student">
                                    <ExamView />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    )
}

export default App
