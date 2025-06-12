const fs = require('fs').promises;
const path = require('path');

// Simple file-based database for WebContainer environment
class FileDB {
  constructor() {
    this.dbPath = path.join(__dirname, '../data');
    this.collections = {
      users: path.join(this.dbPath, 'users.json'),
      posts: path.join(this.dbPath, 'posts.json')
    };
    this.data = {
      users: [],
      posts: []
    };
  }

  async init() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dbPath, { recursive: true });
      
      // Load existing data
      await this.loadData();
      
      console.log('✅ File-based database initialized successfully');
      console.log(`📁 Database path: ${this.dbPath}`);
      console.log(`👥 Users loaded: ${this.data.users.length}`);
      console.log(`📝 Posts loaded: ${this.data.posts.length}`);
      
    } catch (err) {
      console.error('❌ Database initialization error:', err.message);
      throw err;
    }
  }

  async loadData() {
    for (const [collection, filePath] of Object.entries(this.collections)) {
      try {
        const data = await fs.readFile(filePath, 'utf8');
        this.data[collection] = JSON.parse(data);
      } catch (err) {
        // File doesn't exist, start with empty array
        this.data[collection] = [];
        await this.saveCollection(collection);
      }
    }
  }

  async saveCollection(collection) {
    try {
      await fs.writeFile(
        this.collections[collection], 
        JSON.stringify(this.data[collection], null, 2)
      );
    } catch (err) {
      console.error(`Error saving ${collection}:`, err.message);
    }
  }

  // User operations
  async findUser(query) {
    return this.data.users.find(user => {
      return Object.keys(query).every(key => user[key] === query[key]);
    });
  }

  async findUserById(id) {
    return this.data.users.find(user => user._id === id);
  }

  async createUser(userData) {
    const user = {
      _id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...userData
    };
    this.data.users.push(user);
    await this.saveCollection('users');
    return user;
  }

  async updateUser(id, updates) {
    const userIndex = this.data.users.findIndex(user => user._id === id);
    if (userIndex === -1) return null;
    
    this.data.users[userIndex] = {
      ...this.data.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.saveCollection('users');
    return this.data.users[userIndex];
  }

  // Post operations
  async findPosts(query = {}) {
    let posts = [...this.data.posts];
    
    if (Object.keys(query).length > 0) {
      posts = posts.filter(post => {
        return Object.keys(query).every(key => post[key] === query[key]);
      });
    }
    
    return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async findPostById(id) {
    return this.data.posts.find(post => post._id === id);
  }

  async createPost(postData) {
    const post = {
      _id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: [],
      comments: [],
      ...postData
    };
    this.data.posts.push(post);
    await this.saveCollection('posts');
    return post;
  }

  async updatePost(id, updates) {
    const postIndex = this.data.posts.findIndex(post => post._id === id);
    if (postIndex === -1) return null;
    
    this.data.posts[postIndex] = {
      ...this.data.posts[postIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.saveCollection('posts');
    return this.data.posts[postIndex];
  }

  async deletePost(id) {
    const postIndex = this.data.posts.findIndex(post => post._id === id);
    if (postIndex === -1) return null;
    
    const deletedPost = this.data.posts.splice(postIndex, 1)[0];
    await this.saveCollection('posts');
    return deletedPost;
  }
}

// Create global database instance
const db = new FileDB();

const connectDB = async () => {
  try {
    console.log('🔄 Initializing file-based database...');
    await db.init();
    
    // Make db available globally
    global.db = db;
    
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('🔍 Full error:', err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Database connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;