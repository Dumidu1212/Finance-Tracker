// tests/userController.test.js
import request from 'supertest';
import app from '../../app.js';          // Your Express app
import User from '../../models/User.js'; // The actual model (mocked by __mocks__/User.js)

// Automatically use the mock for the User model
jest.mock('../../models/User.js');

// Optional: If you want to suppress or test logger outputs, you could mock logger too:
// jest.mock('../utils/logger.js');

describe('User Controller', () => {
  // Clear mock calls between tests
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. GET /api/users => getAllUsers
  // ---------------------------------------------------------------------------
  describe('GET /api/users', () => {
    it('should return all users (excluding password)', async () => {
      const mockUsers = [
        { _id: '1', name: 'Alice', email: 'alice@test.com' },
        { _id: '2', name: 'Bob', email: 'bob@test.com' }
      ];

      // Simulate User.find().select("-password") returning mockUsers
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers),
      });

      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUsers);
      expect(User.find).toHaveBeenCalledTimes(1);
    });

    it('should handle server errors correctly', async () => {
      User.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const res = await request(app).get('/api/users');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
      // Optionally check the logger
      // expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('DB Error'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. GET /api/users/:id => getUserById
  // ---------------------------------------------------------------------------
  describe('GET /api/users/:id', () => {
    it('should return a single user when found', async () => {
      const mockUser = { _id: '123', name: 'Carol', email: 'carol@test.com' };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app).get('/api/users/123');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUser);
      expect(User.findById).toHaveBeenCalledWith('123');
    });

    it('should return 404 if user not found', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app).get('/api/users/999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('msg', 'User not found');
    });

    it('should handle server errors correctly', async () => {
      User.findById.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const res = await request(app).get('/api/users/123');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. PUT /api/users/:id => updateUser
  // ---------------------------------------------------------------------------
  describe('PUT /api/users/:id', () => {
    it('should update the user if found', async () => {
      const updates = { name: 'New Name' };
      const mockUpdatedUser = { _id: '123', name: 'New Name' };

      // Simulate findByIdAndUpdate returning mockUpdatedUser
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedUser),
      });

      const res = await request(app).put('/api/users/123').send(updates);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUpdatedUser);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        updates,
        { new: true, runValidators: true }
      );
    });

    it('should return 404 if user not found', async () => {
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app).put('/api/users/999').send({ name: 'NoUser' });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('msg', 'User not found');
    });

    it('should handle server errors correctly', async () => {
      User.findByIdAndUpdate.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const res = await request(app).put('/api/users/123').send({ name: 'Error' });
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. DELETE /api/users/:id => deleteUser
  // ---------------------------------------------------------------------------
  describe('DELETE /api/users/:id', () => {
    it('should delete the user if found', async () => {
      const mockUser = { _id: '123', name: 'ToDelete' };
      User.findByIdAndDelete.mockResolvedValue(mockUser);

      const res = await request(app).delete('/api/users/123');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('msg', 'User deleted successfully');
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('123');
    });

    it('should return 404 if user not found', async () => {
      User.findByIdAndDelete.mockResolvedValue(null);

      const res = await request(app).delete('/api/users/999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('msg', 'User not found');
    });

    it('should handle server errors correctly', async () => {
      User.findByIdAndDelete.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const res = await request(app).delete('/api/users/123');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });
});
