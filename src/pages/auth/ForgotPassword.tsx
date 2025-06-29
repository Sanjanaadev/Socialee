import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, User, CheckCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
  const [step, setStep] = useState<'username' | 'email' | 'success'>('username');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetInfo, setResetInfo] = useState<any>(null);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setStep('email');
      setError('');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authAPI.forgotPassword(username.trim(), email.trim());
      console.log('Password reset response:', response);
      
      setResetInfo(response);
      setStep('success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to send password reset email';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToUsername = () => {
    setStep('username');
    setError('');
  };

  const handleBackToEmail = () => {
    setStep('email');
    setError('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  const openPreviewLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
          {step === 'username' && 'Forgot Password?'}
          {step === 'email' && 'Verify Your Email'}
          {step === 'success' && 'Reset Link Ready!'}
        </motion.h2>
        <p className="text-text-secondary mt-2">
          {step === 'username' && "No worries, we'll help you reset it."}
          {step === 'email' && 'Enter the email associated with your account.'}
          {step === 'success' && "Your password reset is ready to use."}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Username Input */}
        {step === 'username' && (
          <motion.div
            key="username"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {error && (
              <div className="bg-error bg-opacity-10 text-error px-4 py-3 rounded-md mb-4 flex items-center">
                <AlertCircle size={20} className="mr-2" />
                {error}
              </div>
            )}

            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-text-secondary" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input pl-10"
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Enter the username you use to log into Socialee
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={!username.trim()}
                >
                  Continue
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 2: Email Input */}
        {step === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4 p-4 bg-background-light rounded-lg">
              <p className="text-sm text-text-secondary">
                <span className="font-medium">Username:</span> @{username}
              </p>
            </div>

            {error && (
              <div className="bg-error bg-opacity-10 text-error px-4 py-3 rounded-md mb-4 flex items-center">
                <AlertCircle size={20} className="mr-2" />
                {error}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-text-secondary" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">
                  This must match the email address registered with your account
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBackToUsername}
                  className="btn-outline flex-1"
                  disabled={isLoading}
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={!email.trim() || isLoading}
                >
                  {isLoading ? 'Processing...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 3: Success Message */}
        {step === 'success' && resetInfo && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="mb-6">
              <CheckCircle size={64} className="text-success mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Password Reset Ready!</h3>
              <p className="text-text-secondary">
                Your password reset has been processed for <span className="font-medium text-text-primary">{email}</span>
              </p>
            </div>

            {/* Preview Link for Test Emails */}
            {resetInfo.previewUrl && (
              <div className="bg-accent-blue bg-opacity-10 border border-accent-blue p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-2 text-accent-blue">📧 Test Email Preview</h4>
                <p className="text-sm text-text-secondary mb-3">
                  Since this is development mode, you can preview the email here:
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openPreviewLink(resetInfo.previewUrl)}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={16} />
                    View Email Preview
                  </button>
                  <button
                    onClick={() => copyToClipboard(resetInfo.previewUrl)}
                    className="btn-outline px-3"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Direct Reset Link for Fallback */}
            {resetInfo.resetUrl && (
              <div className="bg-success bg-opacity-10 border border-success p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-2 text-success">🔗 Direct Reset Link</h4>
                <p className="text-sm text-text-secondary mb-3">
                  You can use this link directly to reset your password:
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(resetInfo.resetUrl, '_self')}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Reset Password Now
                  </button>
                  <button
                    onClick={() => copyToClipboard(resetInfo.resetUrl)}
                    className="btn-outline px-3"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            )}

            <div className="bg-background-light p-4 rounded-lg mb-6 text-left">
              <h4 className="font-medium mb-2">✅ What's Working:</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Password reset token has been created</li>
                <li>• Reset link is fully functional</li>
                <li>• Link expires in 15 minutes for security</li>
                <li>• All users can reset their passwords</li>
                {resetInfo.emailType && (
                  <li>• Email type: {resetInfo.emailType}</li>
                )}
              </ul>
            </div>

            {resetInfo.note && (
              <div className="bg-warning bg-opacity-10 border border-warning p-4 rounded-lg mb-6">
                <p className="text-sm text-warning font-medium">
                  💡 {resetInfo.note}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBackToEmail}
                className="btn-outline flex-1"
              >
                Try Different Email
              </button>
              <Link to="/" className="btn-primary flex-1 text-center">
                Back to Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

export default ForgotPassword;