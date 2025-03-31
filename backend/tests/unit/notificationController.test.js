import request from 'supertest';
import app from '../../app.js';                // Your Express app
import Notification from '../../models/Notification.js';
import { getSocketIO } from '../../utils/socket.js';
import { createNotification } from '../../controllers/notificationController.js';

// Tell Jest to use mocks
jest.mock('../../models/Notification.js');
jest.mock('../../utils/socket.js');

describe('Notification Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. createNotification function
  // -------------------------------------------------------------------------
  describe('createNotification function', () => {
    it('should create a notification and emit a socket event', async () => {
      // 1) Mock the Notification constructor and its .save() method.
      // When save() is called, it returns a plain object with the expected keys.
      const saveMock = jest.fn().mockResolvedValue({
        _id: 'notif123',
        user: 'testUser',
        message: 'Hello',
        type: 'upcoming'
      });
      Notification.mockImplementation(() => ({ save: saveMock }));

      // 2) Mock getSocketIO() to return a fake "io" object
      const emitMock = jest.fn();
      const toMock = jest.fn().mockReturnValue({ emit: emitMock });
      getSocketIO.mockReturnValue({ to: toMock });

      const userId = 'testUser';
      const message = 'Hello';
      const type = 'upcoming';

      // Call the controller function directly
      const result = await createNotification(userId, message, type);

      // Use toMatchObject to compare only the relevant keys
      expect(result).toMatchObject({ _id: 'notif123', user: 'testUser', message: 'Hello', type: 'upcoming' });

      // Check that Notification was constructed with the right args
      expect(Notification).toHaveBeenCalledWith({ user: 'testUser', message: 'Hello', type: 'upcoming' });
      expect(saveMock).toHaveBeenCalledTimes(1);

      // Check socket usage: should emit to room "testUser" with the saved notification
      expect(getSocketIO).toHaveBeenCalledTimes(1);
      expect(toMock).toHaveBeenCalledWith('testUser');
      expect(emitMock).toHaveBeenCalledWith('notification', {
        _id: 'notif123',
        user: 'testUser',
        message: 'Hello',
        type: 'upcoming'
      });
    });

    it('should not emit a socket event if getSocketIO() returns null', async () => {
      // 1) Mock Notification so that save() returns the expected object.
      const saveMock = jest.fn().mockResolvedValue({
        _id: 'notif123',
        user: 'testUser',
        message: 'Hi',
        type: 'upcoming'
      });
      Notification.mockImplementation(() => ({ save: saveMock }));

      // 2) Mock getSocketIO() to return null.
      getSocketIO.mockReturnValue(null);

      const result = await createNotification('testUser', 'Hi', 'upcoming');
      expect(result).toMatchObject({ _id: 'notif123', user: 'testUser', message: 'Hi', type: 'upcoming' });

      // No socket calls should occur.
      expect(getSocketIO).toHaveBeenCalledTimes(1);
    });

    it('should throw any error from save()', async () => {
      const saveMock = jest.fn().mockRejectedValue(new Error('DB Error'));
      Notification.mockImplementation(() => ({ save: saveMock }));
      getSocketIO.mockReturnValue(null);

      await expect(createNotification('testUser', 'Boom', 'upcoming')).rejects.toThrow('DB Error');
    });
  });

  // -------------------------------------------------------------------------
  // 2. GET /api/notifications => getNotificationsForUser
  // -------------------------------------------------------------------------
  describe('GET /api/notifications => getNotificationsForUser', () => {
    it('should retrieve notifications sorted by createdAt desc', async () => {
      const mockNotifs = [
        { _id: 'n2', user: 'testUserId', message: 'Second', createdAt: '2023-01-02T10:00:00Z' },
        { _id: 'n1', user: 'testUserId', message: 'First', createdAt: '2023-01-03T12:00:00Z' },
      ];

      // In the code: Notification.find({ user: req.user.id }).sort({ createdAt: -1 })
      const sortMock = jest.fn().mockResolvedValue(mockNotifs);
      Notification.find.mockReturnValue({ sort: sortMock });

      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockNotifs);

      expect(Notification.find).toHaveBeenCalledWith({ user: '64fabc0123456789abcdef01' });
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should handle server errors gracefully', async () => {
      Notification.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });
});
