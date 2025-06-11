import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const CreatePost = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage || !caption.trim() || !user) return;

    setIsLoading(true);
    try {
      await postsAPI.createPost({
        imageUrl: selectedImage,
        caption: caption.trim()
      });
      
      toast.success('Post created successfully!');
      navigate('/home');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create post';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto"
    >
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div className="card p-6">
          {selectedImage ? (
            <div className="relative">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full rounded-lg max-h-96 object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 p-2 bg-background-dark rounded-full hover:bg-background-light transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent-pink transition-colors">
              <Image size={48} className="text-text-secondary mb-4" />
              <span className="text-text-secondary">Click to upload an image</span>
              <span className="text-xs text-text-muted mt-2">Max 5MB</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          )}
        </div>

        {/* Caption */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Caption
          </label>
          <textarea
            className="input h-32 resize-none"
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={500}
          />
          <p className="text-xs text-text-secondary mt-1">
            {caption.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={!selectedImage || !caption.trim() || isLoading}
        >
          {isLoading ? 'Creating Post...' : 'Share Post'}
        </button>
      </form>
    </motion.div>
  );
};

export default CreatePost;