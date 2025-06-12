// Simple post model for file-based database
class Post {
  static async find(query = {}) {
    return await global.db.findPosts(query);
  }

  static async findById(id) {
    return await global.db.findPostById(id);
  }

  static async create(postData) {
    return await global.db.createPost(postData);
  }

  static async findByIdAndUpdate(id, updates, options = {}) {
    const post = await global.db.updatePost(id, updates);
    return post;
  }

  static async findByIdAndDelete(id) {
    return await global.db.deletePost(id);
  }

  // Helper method to validate post data
  static validate(postData) {
    const errors = [];
    
    if (!postData.content || postData.content.trim().length === 0) {
      errors.push('Post content is required');
    }
    
    if (!postData.author) {
      errors.push('Post author is required');
    }
    
    if (postData.type && !['text', 'image', 'mood'].includes(postData.type)) {
      errors.push('Invalid post type');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = Post;