// Simple user model for file-based database
class User {
  static async findOne(query) {
    return await global.db.findUser(query);
  }

  static async findById(id) {
    return await global.db.findUserById(id);
  }

  static async create(userData) {
    return await global.db.createUser(userData);
  }

  static async findByIdAndUpdate(id, updates, options = {}) {
    const user = await global.db.updateUser(id, updates);
    return user;
  }

  // Helper method to validate user data
  static validate(userData) {
    const errors = [];
    
    if (!userData.username || userData.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    if (!userData.email || !this.isValidEmail(userData.email)) {
      errors.push('Valid email is required');
    }
    
    if (!userData.password || userData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = User;