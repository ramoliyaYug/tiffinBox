"use client"

import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaGraduationCap, FaEye, FaEyeSlash } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const user = await login({
        email: formData.email,
        password: formData.password,
        role: selectedRole
      });

      // Validate that the user's role matches the selected role
      if (user.role !== selectedRole) {
        throw new Error(`Invalid credentials for ${selectedRole} login. Please use the correct login section.`);
      }

      // Navigate based on the validated role
      navigate(selectedRole === 'admin' ? '/admin' : '/student');
    } catch (error) {
      setErrors({ submit: error.message || 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!selectedRole) {
    return (
      <div className="login-container">
        <div className="role-selection">
          <div className="role-card" onClick={() => handleRoleSelect('admin')}>
            <FaShieldAlt />
            <h3>Admin Login</h3>
          </div>
          <div className="role-card" onClick={() => handleRoleSelect('student')}>
            <FaGraduationCap />
            <h3>Student Login</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2 style={{ color: 'white', marginBottom: '2rem', textAlign: 'center' }}>
          {selectedRole === 'admin' ? 'Admin Login' : 'Student Login'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className={`form-group ${errors.email ? 'error' : ''}`}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>
          <div className={`form-group ${errors.password ? 'error' : ''}`}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
            />
            <div
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>
          {errors.submit && <div className="error-message">{errors.submit}</div>}
          <button
            type="submit"
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Logging in...' : 'Login'}</span>
            <div className="spinner" />
          </button>
        </form>
        <div className="forgot-password">
          <a href="#" onClick={(e) => { e.preventDefault(); /* Add forgot password logic */ }}>
            Forgot Password?
          </a>
        </div>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setSelectedRole(null);
              setFormData({ email: '', password: '' });
              setErrors({});
            }}
            style={{ color: 'white', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            ← Back to role selection
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
