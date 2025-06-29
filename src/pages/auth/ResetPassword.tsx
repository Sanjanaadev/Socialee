import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; username: string; email: string } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      setIsVerifying(false);
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await authAPI.verifyResetToken(token!);
      if (response.valid) {
        setTokenValid(true);
        setUserInfo(response.user);
      } else {
        setError(response.error || 'Invalid or expired reset token');
      }
    } catch (err: any) {
      setError('Invalid or expired reset token. Please request a new password reset.');
    } finally {
      setIsVerifying(false);
    }
  };

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.resetPassword(token!, newPassword);
      setIsSuccess(true);
      toast.success('Password reset successful!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to reset password';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++;
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return 'bg-error';
    if (strength <= 2) return 'bg-warning';
    if (strength <= 3) return 'bg-accent-blue';
    return 'bg-success';
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 1) return 'Weak';
    if (strength <= 2) return 'Fair';
    if (strength <= 3) return 'Good';
    return 'Strong';
  };

  if (isVerifying) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-background-card/50 to-background-dark/50 p-8 rounded-xl backdrop-blur-sm text-center"
      >
        <Loader size={48} className="animate-spin text-accent-pink mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Verifying Reset Link</h2>
        <p className="text-text-secondary">Please wait while we verify your password reset token...</p>
      </motion.div>
    );
  }

  if (!tokenValid) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-background-card/50 to-background-dark/50 p-8 rounded-xl backdrop-blur-sm text-center"
      >
        <AlertCircle size={64} className="text-error mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Invalid Reset Link</h2>
        <p className="text-text-secondary mb-6">{error}</p>
        <div className="flex gap-4">
          <Link to="/forgot-password" className="btn-primary flex-1">
            Request New Reset
          </Link>
          <Link to="/" className="btn-outline flex-1">
            Back to Login
          </Link>
        </div>
      </motion.div>
    );
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-background-card/50 to-background-dark/50 p-8 rounded-xl backdrop-blur-sm text-center"
      >
        <CheckCircle size={64} className="text-success mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Password Reset Successful!</h2>
        <p className="text-text-secondary mb-6">
          Your password has been successfully reset. You can now log in with your new password.
        </p>
        <p className="text-sm text-text-muted mb-4">
          Redirecting to login page in 3 seconds...
        </p>
        <Link to="/" className="btn-primary">
          Go to Login Now
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-background-card/50 to-background-dark/50 p-8 rounded-xl backdrop-blur-sm"
    >
      <div className="text-center mb-8">
        <motion.h2 
          className="text-3xl font-bold text-text-primary font-['Dancing_Script']"
          animate={{ 
            scale: [1, 1.02, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1
          }}
        >
          Reset Your Password
        </motion.h2>
        <p className="text-text-secondary mt-2">Create a new secure password for your account</p>
      </div>

      {userInfo && (
        <div className="mb-6 p-4 bg-background-light rounded-lg">
          <p className="text-sm text-text-secondary">
            <span className="font-medium">Resetting password for:</span> {userInfo.name} (@{userInfo.username})
          </p>
        </div>
      )}

      {error && (
        <div className="bg-error bg-opacity-10 text-error px-4 py-3 rounded-md mb-4 flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-text-secondary mb-1">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-text-secondary" />
            </div>
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input pl-10 pr-10"
              placeholder="Enter your new password"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={18} className="text-text-secondary" />
              ) : (
                <Eye size={18} className="text-text-secondary" />
              )}
            </button>
          </div>
          
          {/* Password strength indicator */}
          {newPassword && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-secondary">Password strength:</span>
                <span className={`text-xs font-medium ${
                  getPasswordStrength(newPassword) <= 2 ? 'text-error' : 'text-success'
                }`}>
                  {getStrengthText(getPasswordStrength(newPassword))}
                </span>
              </div>
              <div className="w-full bg-background-light rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(getPasswordStrength(newPassword))}`}
                  style={{ width: `${(getPasswordStrength(newPassword) / 4) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <p className="text-xs text-text-muted mt-1">
            Must contain at least 6 characters with uppercase, lowercase, and number
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-text-secondary" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input pl-10 pr-10"
              placeholder="Confirm your new password"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff size={18} className="text-text-secondary" />
              ) : (
                <Eye size={18} className="text-text-secondary" />
              )}
            </button>
          </div>
          
          {/* Password match indicator */}
          {confirmPassword && (
            <div className="mt-1 flex items-center">
              {newPassword === confirmPassword ? (
                <div className="flex items-center text-success">
                  <CheckCircle size={14} className="mr-1" />
                  <span className="text-xs">Passwords match</span>
                </div>
              ) : (
                <div className="flex items-center text-error">
                  <AlertCircle size={14} className="mr-1" />
                  <span className="text-xs">Passwords do not match</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || isLoading}
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </div>
      </form>

      <div className="text-center mt-6">
        <p className="text-text-secondary">
          Remember your password?{' '}
          <Link to="/" className="text-accent-pink hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default ResetPassword;