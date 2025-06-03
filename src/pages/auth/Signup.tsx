import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';

const Signup = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePic(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);

    try {
      await signup(name, username, email, password, profilePic || undefined);
      navigate('/'); // Redirect to login after successful signup
    } catch (err) {
      setError('Failed to create an account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text-primary">Create Account</h2>
        <p className="text-text-secondary mt-2">Join Socialee today</p>
      </div>

      {error && (
        <div className="bg-error bg-opacity-10 text-error px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profile Picture Upload */}
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

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            placeholder="johndoe"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-text-secondary mb-1">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading}
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
    </motion.div>
  );
};

export default Signup;