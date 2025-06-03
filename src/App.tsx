import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Home from './pages/Home';
import Snaps from './pages/Snaps';
import Moods from './pages/Moods';
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is authenticated (in a real app, this would validate the token)
    const checkAuth = () => {
      const token = localStorage.getItem('socialee_token');
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };

    // Simulate a network request
    setTimeout(checkAuth, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-dark">
        <div className="animate-pulse-slow text-accent-pink text-2xl font-bold">
          Socialee
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={
            isAuthenticated ? 
              <Navigate to="/home\" replace /> : 
              <AuthLayout />
          }>
            <Route index element={<Login />} />
            <Route path="signup" element={<Signup />} />
          </Route>

          {/* Protected Routes */}
          <Route path="/" element={
            isAuthenticated ? 
              <MainLayout /> : 
              <Navigate to="/\" replace />
          }>
            <Route path="home" element={<Home />} />
            <Route path="snaps" element={<Snaps />} />
            <Route path="moods" element={<Moods />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:conversationId" element={<Conversation />} />
            <Route path="profile/:userId" element={<Profile />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;