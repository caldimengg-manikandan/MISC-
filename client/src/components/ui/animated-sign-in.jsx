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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  const { login, register, forgotPassword, verifyOTP, resetPassword, sendSignupOTP, verifySignupOTP, signup, loading } = useAuth();
  
  // Signup State
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [signupStep, setSignupStep] = useState(1); // 1: Info, 2: Verification
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [signupOtp, setSignupOtp] = useState("");
  const [signupResendTimer, setSignupResendTimer] = useState(0);

  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: Reset
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    let interval;
    if (signupResendTimer > 0) {
      interval = setInterval(() => {
        setSignupResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [signupResendTimer]);

  const handleSendSignupOTP = async () => {
    if (!email || !isEmailValid) return toast.error("Please enter a valid email");
    const result = await sendSignupOTP(email);
    if (result.success) {
      setSignupStep(2);
      setSignupResendTimer(30);
    }
  };

  const handleVerifySignupOTP = async () => {
    const result = await verifySignupOTP(email, signupOtp);
    if (result.success) {
      setIsEmailVerified(true);
      setSignupStep(1); // Go back to main form to finish password
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!isEmailVerified) return toast.error("Please verify your email first");
    const result = await signup({ fullName, email, organization, password });
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const result = await forgotPassword(email);
    if (result.success) {
      setForgotStep(2);
      setResendTimer(300); // 5 minutes resend timer
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const result = await verifyOTP(email, otp);
    if (result.success) {
      setForgotStep(3);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    const result = await resetPassword(email, otp, newPassword);
    if (result.success) {
      setIsForgotPassword(false);
      setForgotStep(1);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setIsResending(true);
    const result = await forgotPassword(email);
    if (result.success) {
      setResendTimer(300);
      toast.success("New code sent!");
    }
    setIsResending(false);
  };

  const isSignUpMode = location.search.includes('mode=signup');

  // Check if we started in signup mode
  useEffect(() => {
    if (isSignUpMode) {
      const timer = setTimeout(() => {
        toast("Initiating ‘Join the Forge’ request. Please enter details to proceed.", {
          icon: '⚙️',
          duration: 3000
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSignUpMode]);

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
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsFormSubmitted(true);

    if (!email || !isEmailValid || !password) {
      return;
    }

    if (isSignUpMode) {
      handleSignupSubmit(e);
    } else {
      login(email, password, rememberMe)
        .then((result) => {
          if (result.success) {
            navigate(from, { replace: true });
          }
        });
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
          {isForgotPassword ? (
            <div className="asl-forgot-flow">
              <div 
                className="asl-back-link"
                onClick={() => { setIsForgotPassword(false); setForgotStep(1); }}
              >
                <span>←</span> Back to Login
              </div>

              {forgotStep === 1 && (
                <form className="asl-login-form" onSubmit={handleForgotPassword}>

                  <div className={`asl-form-field ${isEmailFocused || email ? "asl-active" : ""}`}>
                    <input
                      type="email"
                      id="asl-forgot-email"
                      value={email}
                      onChange={handleEmailChange}
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                      required
                      placeholder=" "
                    />
                    <label htmlFor="asl-forgot-email">Email Address</label>
                  </div>
                  <button type="submit" className="asl-login-button" disabled={loading}>
                    {loading ? <span className="asl-spinner"></span> : "Send Reset Code"}
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form className="asl-login-form" onSubmit={handleVerifyOTP}>
                  <div className="asl-form-field asl-active">
                    <input
                      type="text"
                      className="asl-otp-input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                      maxLength="6"
                      required
                      onFocus={() => {}}
                      placeholder=" "
                    />
                    <label>Verification Code</label>
                  </div>
                  <button type="submit" className="asl-login-button" disabled={loading || otp.length !== 6}>
                    {loading ? <span className="asl-spinner"></span> : "Verify Code"}
                  </button>
                  <div className="asl-resend-container">
                    {resendTimer > 0 ? (
                      <span>Resend code in {Math.floor(resendTimer / 60)}:{String(resendTimer % 60).padStart(2, '0')}</span>
                    ) : (
                      <button 
                        type="button" 
                        className="asl-resend-btn" 
                        onClick={handleResendOTP}
                        disabled={isResending}
                      >
                        {isResending ? "Sending..." : "Resend Code"}
                      </button>
                    )}
                  </div>
                </form>
              )}

              {forgotStep === 3 && (
                <form className="asl-login-form" onSubmit={handleResetPassword}>
                  <div className={`asl-form-field ${password ? "asl-active" : ""}`}>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder=" "
                    />
                    <label>New Password</label>
                  </div>
                  <div className={`asl-form-field ${confirmPassword ? "asl-active" : ""}`}>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder=" "
                    />
                    <label>Confirm Password</label>
                  </div>
                  <button type="submit" className="asl-login-button" disabled={loading}>
                    {loading ? <span className="asl-spinner"></span> : "Update Password"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form className="asl-login-form" onSubmit={handleSubmit}>
              {isSignUpMode && (
                <>
                  <div className={`asl-form-field ${fullName ? "asl-active" : ""}`}>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder=" "
                    />
                    <label>Full Name</label>
                  </div>
                  <div className={`asl-form-field ${organization ? "asl-active" : ""}`}>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder=" "
                    />
                    <label>Organization</label>
                  </div>
                </>
              )}

              <div
                className={`asl-form-field ${isEmailFocused || email ? "asl-active" : ""} ${
                  !isEmailValid && email ? "asl-invalid" : ""
                } ${isSignUpMode ? "asl-with-button" : ""}`}
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
                  disabled={isSignUpMode && isEmailVerified}
                />
                <label htmlFor="asl-email">Email Address</label>
                {isSignUpMode && !isEmailVerified && (
                  <button 
                    type="button" 
                    className="asl-field-action-btn"
                    onClick={handleSendSignupOTP}
                    disabled={loading || !email || !isEmailValid}
                  >
                    {loading ? "..." : "Send OTP"}
                  </button>
                )}
                {isSignUpMode && isEmailVerified && (
                  <span className="asl-verified-badge">✓ Verified</span>
                )}
                {!isEmailValid && email && (
                  <span className="asl-error-message">Please enter a valid email</span>
                )}
              </div>

              {isSignUpMode && signupStep === 2 && (
                <div className="asl-form-field asl-active asl-with-button">
                  <input
                    type="text"
                    className="asl-otp-input-small"
                    value={signupOtp}
                    onChange={(e) => setSignupOtp(e.target.value.replace(/[^0-9]/g, ""))}
                    maxLength="6"
                    required
                    placeholder=" "
                  />
                  <label>Verification Code</label>
                  <button 
                    type="button" 
                    className="asl-field-action-btn"
                    onClick={handleVerifySignupOTP}
                    disabled={loading || signupOtp.length !== 6}
                  >
                    {loading ? "..." : "Verify"}
                  </button>
                </div>
              )}

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

              {!isSignUpMode && (
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
                  <button 
                    type="button" 
                    className="asl-forgot-password-btn" 
                    onClick={() => setIsForgotPassword(true)}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="asl-login-button"
                disabled={loading || (isFormSubmitted && (!email || !password || !isEmailValid)) || (isSignUpMode && !isEmailVerified)}
              >
                {loading ? (
                  <span className="asl-spinner"></span>
                ) : (
                  isSignUpMode ? "Create Account" : "Sign In"
                )}
              </button>
            </form>
          )}



          <p className="asl-signup-prompt">
            {isSignUpMode ? "Already have an account? " : "Don't have an account? "}
            <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                navigate(isSignUpMode ? "/login" : "/login?mode=signup");
            }}>
              {isSignUpMode ? "Sign In" : "Sign Up"}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
