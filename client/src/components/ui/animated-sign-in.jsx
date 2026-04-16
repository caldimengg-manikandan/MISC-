"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Github, Twitter, Linkedin, Sun, Moon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  // Check if we started in signup mode
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("mode") === "signup") {
      // If we had an isSignUp state, we'd set it here.
      // For now, let's just update the toast to be more welcoming.
      const timer = setTimeout(() => {
        toast("Initiating ‘Join the Forge’ request. Please enter your email to proceed.", {
          icon: '⚙️',
          duration: 3000
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.search]);

  // Email validation
  const validateEmail = (email) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  // Handle email change
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (e.target.value) {
      setIsEmailValid(validateEmail(e.target.value));
    } else {
      setIsEmailValid(true);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsFormSubmitted(true);

    if (email && password && validateEmail(email)) {
      try {
        await login(email, password, false, from);
      } catch (error) {
        toast.error(error.message || "Authentication failed");
      }
    } else if (!validateEmail(email)) {
      setIsEmailValid(false);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("asl-dark-mode");
  };

  // Initialize theme based on user preference
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add("asl-dark-mode");
    } else {
      document.documentElement.classList.remove("asl-dark-mode");
    }
    return () => {
      // cleanup: remove class when leaving
      document.documentElement.classList.remove("asl-dark-mode");
    };
  }, []);

  // Create particles
  useEffect(() => {
    const canvas = document.getElementById("asl-particles");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.color = isDarkMode
          ? `rgba(255, 255, 255, ${Math.random() * 0.2})`
          : `rgba(0, 0, 100, ${Math.random() * 0.2})`;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }
      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles = [];
    const particleCount = Math.min(100, Math.floor((canvas.width * canvas.height) / 15000));
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animationId;
    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const particle of particles) {
        particle.update();
        particle.draw();
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, [isDarkMode]);

  return (
    <div className={`asl-login-container ${isDarkMode ? "asl-dark" : "asl-light"}`}>
      <canvas id="asl-particles" className="asl-particles-canvas"></canvas>

      <div className="asl-theme-toggle" onClick={toggleDarkMode}>
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </div>

      <div className="asl-login-card">
        <div className="asl-login-card-inner">
          {/* Header */}
          <div className="asl-login-header">
            <div className="asl-brand-badge">
              <span className="asl-brand-icon">⚙</span>
              <span className="asl-brand-name">MISCStairPro</span>
            </div>
            <h1>{location.search.includes('mode=signup') ? 'Join the Forge' : 'Welcome Back'}</h1>
            <p>{location.search.includes('mode=signup') ? 'Create your professional account' : 'Sign in to your professional account'}</p>
          </div>

          {/* Form */}
          <form className="asl-login-form" onSubmit={handleSubmit}>
            <div
              className={`asl-form-field ${isEmailFocused || email ? "asl-active" : ""} ${
                !isEmailValid && email ? "asl-invalid" : ""
              }`}
            >
              <input
                type="email"
                id="asl-email"
                value={email}
                onChange={handleEmailChange}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                required
                autoComplete="email"
                placeholder=" "
              />
              <label htmlFor="asl-email">Email Address</label>
              {!isEmailValid && email && (
                <span className="asl-error-message">Please enter a valid email</span>
              )}
            </div>

            <div
              className={`asl-form-field ${isPasswordFocused || password ? "asl-active" : ""}`}
            >
              <input
                type={showPassword ? "text" : "password"}
                id="asl-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                required
                autoComplete="current-password"
                placeholder=" "
              />
              <label htmlFor="asl-password">Password</label>
              <button
                type="button"
                className="asl-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="asl-form-options">
              <label className="asl-remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <span className="asl-checkmark"></span>
                Remember me
              </label>
              <a href="#" className="asl-forgot-password">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="asl-login-button"
              disabled={loading || (isFormSubmitted && (!email || !password || !isEmailValid))}
            >
              {loading ? (
                <span className="asl-spinner"></span>
              ) : (
                location.search.includes('mode=signup') ? "Join the Forge" : "Sign In"
              )}
            </button>
          </form>



          <p className="asl-signup-prompt">
            Don&apos;t have an account?{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); toast("Contact your administrator to create an account."); }}>
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
