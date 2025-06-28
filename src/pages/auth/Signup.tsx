import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Signup = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const { signup, isBackendConnected } = useAuth();
  const navigate = useNavigate();

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profilePic: 'Profile picture must be less than 5MB' }));
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profilePic: 'Please select a valid image file' }));
        return;
      }
      
      setProfilePic(file);
      setErrors(prev => ({ ...prev, profilePic: '' }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    } else if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      newErrors.name = 'Name can only contain letters and spaces';
    }

    // Username validation
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (username.length > 20) {
      newErrors.username = 'Username must be less than 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    } else if (username.startsWith('_') || username.endsWith('_')) {
      newErrors.username = 'Username cannot start or end with underscore';
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isBackendConnected) {
      setErrors({ general: 'Backend server is not connected. Please make sure the backend is running.' });
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('🔄 Attempting to create account...');
      await signup(name.trim(), username.trim(), email.trim(), password);
      console.log('✅ Account created successfully');
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('❌ Signup failed:', err);
      setErrors({ general: err.message || 'Failed to create account' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  return (
    <>
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
            Join Socialee
          </motion.h2>
          <p className="text-text-secondary mt-2">Time to make your mark.</p>
        </div>

        {/* Backend Connection Status */}
        {!isBackendConnected && (
          <div className="bg-error bg-opacity-10 text-error px-4 py-3 rounded-md mb-4 flex items-center">
            <AlertCircle size={20} className="mr-2" />
            <div>
              <p className="font-medium">Backend Disconnected</p>
              <p className="text-sm">Please make sure the backend server is running on port 5000.</p>
            </div>
          </div>
        )}

        {errors.general && (
          <div className="bg-error bg-opacity-10 text-error px-4 py-3 rounded-md mb-4">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-background-light flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile Preview" className="h-full w-full object-cover" />
                ) : (
                  <User size={40} className="text-text-secondary" />
                )}
              </div>
              <label htmlFor="profile-pic" className="absolute bottom-0 right-0 bg-accent-pink h-8 w-8 rounded-full flex items-center justify-center cursor-pointer">
                <UploadCloud size={16} className="text-white" />
                <input
                  id="profile-pic"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                />
              </label>
            </div>
          </div>
          {errors.profilePic && (
            <p className="text-error text-sm text-center">{errors.profilePic}</p>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              className={`input ${errors.name ? 'border-error' : ''}`}
              placeholder="John Doe"
              required
            />
            {errors.name && <p className="text-error text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">
              Username *
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase());
                if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
              }}
              className={`input ${errors.username ? 'border-error' : ''}`}
              placeholder="johndoe"
              required
            />
            {errors.username && <p className="text-error text-sm mt-1">{errors.username}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value.toLowerCase());
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
              className={`input ${errors.email ? 'border-error' : ''}`}
              placeholder="your@email.com"
              required
            />
            {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
              Password *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
              }}
              className={`input ${errors.password ? 'border-error' : ''}`}
              placeholder="••••••••"
              required
            />
            {errors.password && <p className="text-error text-sm mt-1">{errors.password}</p>}
            <p className="text-xs text-text-secondary mt-1">
              Must contain at least 8 characters with uppercase, lowercase, and number
            </p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-text-secondary mb-1">
              Confirm Password *
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
              }}
              className={`input ${errors.confirmPassword ? 'border-error' : ''}`}
              placeholder="••••••••"
              required
            />
            {errors.confirmPassword && <p className="text-error text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          <div>
            <button
              type="submit"
              className={`btn-primary w-full ${!isBackendConnected || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!isBackendConnected || isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-text-secondary">
            Already have an account?{' '}
            <Link to="/" className="text-accent-pink hover:underline">
              Sign in
            </Link>
          </p>
        </div>