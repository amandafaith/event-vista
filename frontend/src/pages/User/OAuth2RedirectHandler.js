import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../services/api";

const OAuth2RedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleOAuthRedirect = async () => {
      // Parse the URL query parameters
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error) {
        console.error("OAuth error:", error);
        navigate("/login", { state: { error } });
        return;
      }

      if (code) {
        try {
          // Exchange the authorization code for tokens
          const response = await authApi.exchangeCodeForToken(code);

          if (response.data && response.data.user) {
            setUser(response.data.user);
            // Get the return URL from localStorage or default to dashboard
            const returnUrl = localStorage.getItem("returnUrl") || "/dashboard";
            localStorage.removeItem("returnUrl"); // Clean up
            navigate(returnUrl);
          } else {
            throw new Error("No user data received");
          }
        } catch (error) {
          console.error("Error exchanging code for token:", error);
          navigate("/login", {
            state: {
              error: "Failed to complete authentication. Please try again.",
            },
          });
        }
      } else {
        navigate("/login", {
          state: { error: "Authentication failed. Please try again." },
        });
      }
    };

    handleOAuthRedirect();
  }, [location, navigate, setUser]);

  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Completing authentication...</p>
    </div>
  );
};

export default OAuth2RedirectHandler;
