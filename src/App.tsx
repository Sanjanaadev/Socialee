import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

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
import EditProfile from './pages/EditProfile';
import NotFound from './pages/NotFound';
import CreatePost from './pages/CreatePost';

// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<Login />} />
            <Route path="signup" element={<Signup />} />
          </Route>

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="home" element={<Home />} />
            <Route path="snaps" element={<Snaps />} />
            <Route path="moods" element={<Moods />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:userId" element={<Conversation />} />
            <Route path="profile/:userId" element={<Profile />} />
            <Route path="profile" element={<Profile />} />
            <Route path="edit-profile" element={<EditProfile />} />
            <Route path="create" element={<CreatePost />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster position="top-center" />
      </Router>
    </AuthProvider>
  );
}

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('socialee_token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default App;