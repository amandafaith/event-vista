import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../services/api";
import "./Login.css";

const Login = () => {
  const [credentials, setCredentials] = useState({
    emailAddress: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get return URL from query params
  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  // Check for verification message from registration
  useEffect(() => {
    if (location.state?.message) {
      setInfo(location.state.message);
    }
  }, [location]);

  // Redirect if already logged in
  useEffect(() => {
    console.log("Login component - Auth state:", { user, loading });
    if (!loading && user) {
      console.log("User is authenticated, redirecting to:", returnUrl);
      navigate(returnUrl, { replace: true });
    }
  }, [user, loading, navigate, returnUrl]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    console.log("Login form submitted");

    try {
      console.log("Attempting login...");
      await login(credentials);
      console.log("Login successful, redirecting to:", returnUrl);
      navigate(returnUrl, { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = (e) => {
    e.preventDefault();
    // Store the return URL in localStorage before redirecting
    localStorage.setItem("returnUrl", returnUrl);
    // Redirect to Google OAuth endpoint
    window.location.href = authApi.getOAuthUrl();
  };

  return (
    <div className="login-container flex-center">
      <div className="login-box">
        <div className="login-content">
          <div className="login-header">
            <h2 className="login-title">Sign in to your account</h2>
            <p className="login-subtitle">
              Or{" "}
              <Link to="/register" className="login-link">
                create a new account
              </Link>
            </p>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="emailAddress" className="sr-only">
                Email address
              </label>
              <input
                id="emailAddress"
                name="emailAddress"
                type="email"
                required
                className="form-input input"
                placeholder="Email address"
                value={credentials.emailAddress}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="form-input input"
                placeholder="Password"
                value={credentials.password}
                onChange={handleChange}
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {info && <div className="info-message">{info}</div>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="submit-button button button-primary"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>

            <div className="forgot-password">
              <Link to="/reset-password" className="login-link">
                Forgot your password?
              </Link>
            </div>
          </form>

          <div className="divider">
            <span className="divider-text">Or continue with</span>
          </div>

          <div className="google-container">
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="google-button"
            >
              <img
                className="google-icon"
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google logo"
              />
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
