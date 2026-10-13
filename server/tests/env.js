// Runs before each test file is loaded, so config/env.js sees these instead of a real .env.
// MONGO_URI is set by globalSetup (in-memory server).
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.MONGO_URI ??= 'mongodb://127.0.0.1:27017/unused';
