import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  // For demo purposes - quick login
  const handleDemoLogin = async () => {
    setEmail('alex@example.com');
    setPassword('password');
    setIsLoading(true);

    try {
      await login('alex@example.com', 'password');
      navigate('/home');
    } catch (err) {
      setError('Something went wrong with demo login');
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
        <h2 className="text-2xl font-bold text-text-primary">Welcome Back</h2>
        <p className="text-text-secondary mt-2">Sign in to continue to Socialee</p>
      </div>

      {error && (
        <div className="bg-error bg-opacity-10 text-error px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
              Password
            </label>
            <a href="#" className="text-xs text-accent-pink hover:underline">
              Forgot password?
            </a>
          </div>
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
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <button
          onClick={handleDemoLogin}
          className="btn-outline w-full"
          disabled={isLoading}
        >
          Demo Login
        </button>
      </div>

      <div className="text-center mt-6">
        <p className="text-text-secondary">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent-pink hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default Login;