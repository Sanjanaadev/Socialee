import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Save, Lock, Trash2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const EditProfile = () => {
  const { user, updateProfile, updateProfilePicture, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Profile form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    profilePic: user?.profilePic || ''
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Profile picture must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
        setFormData(prev => ({ ...prev, profilePic: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let updatedData = { ...formData };

      // Upload profile picture if a new one was selected
      if (selectedFile) {
        const profilePicUrl = await updateProfilePicture(selectedFile);
        updatedData.profilePic = profilePicUrl;
      }

      await updateProfile(updatedData);
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      await updatePassword(passwordData.oldPassword, passwordData.newPassword);
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // In a real app, this would call an API
      localStorage.clear();
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      <form onSubmit={handleProfileUpdate} className="space-y-6">
        {/* Profile Picture */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-32 w-32 rounded-full overflow-hidden bg-background-light flex items-center justify-center">
              {previewUrl || formData.profilePic ? (
                <img 
                  src={previewUrl || formData.profilePic} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={48} className="text-text-secondary" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-accent-pink h-8 w-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-opacity-90 transition-colors">
              <Camera size={16} className="text-white" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleProfilePicChange}
              />
            </label>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Name
            </label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Username
            </label>
            <input
              type="text"
              className="input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email
            </label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Bio
            </label>
            <textarea
              className="input h-24 resize-none"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              maxLength={150}
            />
            <p className="text-xs text-text-secondary mt-1">
              {formData.bio.length}/150 characters
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <button
            type="submit"
            className="btn-primary flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <Save size={18} />
            <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
          </button>

          <button
            type="button"
            className="btn-outline flex items-center justify-center gap-2"
            onClick={() => setShowPasswordModal(true)}
          >
            <Lock size={18} />
            <span>Change Password</span>
          </button>

          <button
            type="button"
            className="btn bg-error hover:bg-opacity-90 text-white flex items-center justify-center gap-2"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 size={18} />
            <span>Delete Account</span>
          </button>
        </div>
      </form>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background-card rounded-lg p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  className="input"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  className="input"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="input"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Change Password
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background-card rounded-lg p-6 max-w-md w-full"
          >
            <>
              <h2 className="text-xl font-bold mb-4">Delete Account</h2>
              <p className="text-text-secondary mb-6">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  className="btn-outline"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn bg-error hover:bg-opacity-90 text-white"
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </button>
              </div>
            </>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EditProfile;