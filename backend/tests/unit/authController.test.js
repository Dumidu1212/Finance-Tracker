// tests/controllers/authController.test.js
import { register, login, refreshToken } from '../../controllers/authController.js';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

// Mock external modules
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

// Corrected mock for the User model: export a jest.fn()
jest.mock('../../models/User.js', () => {
  const UserMock = jest.fn();
  UserMock.findOne = jest.fn();
  UserMock.findById = jest.fn();
  UserMock.create = jest.fn();
  return UserMock;
});

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    // Fresh mocks for each test
    req = {
      body: {},
      cookies: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn()
    };
    next = jest.fn();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. register
  // -------------------------------------------------------------------------
  describe('register', () => {
    it('should return 400 if validation errors exist', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid field' }]
      });

      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: [{ msg: 'Invalid field' }]
      });
    });

    it('should return 400 if user already exists', async () => {
      // Simulate no validation errors
      validationResult.mockReturnValue({ isEmpty: () => true });
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password',
        role: 'Regular'
      };

      // findOne returns a user => user already exists
      User.findOne.mockResolvedValue({ _id: 'existingUser' });

      await register(req, res);
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'User already exists' });
    });

    it('should save a new user and return 201 if registration is successful', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      req.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        role: 'Regular'
      };

      // findOne => returns null => user doesn't exist
      User.findOne.mockResolvedValue(null);

      // Mock the "save" method on a new user instance
      const saveMock = jest.fn().mockResolvedValue({});
      User.mockImplementation(() => ({ save: saveMock }));

      await register(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'new@example.com' });
      // Instead of checking the constructor call, verify that the save method was called.
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ msg: 'User registered successfully' });
    });

    it('should return 500 if an exception is thrown', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockImplementation(() => {
        throw new Error('DB error');
      });

      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Server Error',
        error: 'DB error'
      });
    });
  });

  // -------------------------------------------------------------------------
  // 2. login
  // -------------------------------------------------------------------------
  describe('login', () => {
    it('should return 400 if validation errors exist', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Email is invalid' }]
      });

      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: [{ msg: 'Email is invalid' }]
      });
    });

    it('should return 400 if user not found or invalid credentials', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      req.body = { email: 'nope@example.com', password: 'wrong' };

      // Return an object with a .select() method that resolves to null
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Invalid credentials' });
    });

    it('should return 400 if password is invalid', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      req.body = { email: 'test@example.com', password: 'wrongpass' };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: 'someUser',
          password: 'hashedPassword',
          comparePassword: jest.fn().mockResolvedValue(false),
          role: 'Regular'
        })
      });

      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Invalid credentials' });
    });

    it('should sign a token, set cookie, and return accessToken if credentials are correct', async () => {
      process.env.JWT_SECRET = 'testsecret';
      process.env.JWT_EXPIRES = '1h';
      process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';
      process.env.REFRESH_TOKEN_EXPIRES = '7d';

      validationResult.mockReturnValue({ isEmpty: () => true });
      req.body = { email: 'test@example.com', password: 'secretpass' };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          id: 'userid123',
          email: 'test@example.com',
          password: 'hashedPassword',
          role: 'Regular',
          comparePassword: jest.fn().mockResolvedValue(true)
        })
      });

      // Mock jwt.sign to return fake tokens for access and refresh tokens
      jwt.sign
        .mockReturnValueOnce('fakeAccessToken')
        .mockReturnValueOnce('fakeRefreshToken');

      await login(req, res);

      expect(jwt.sign).toHaveBeenCalledTimes(2);
      // Expect the access token call with the correct payload (role "Regular")
      expect(jwt.sign).toHaveBeenCalledWith(
        { user: { id: 'userid123', role: 'Regular' } },
        'testsecret',
        { expiresIn: '1h' }
      );
      // Expect the refresh token sign call
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'userid123' },
        'refreshsecret',
        { expiresIn: '7d' }
      );

      // Verify that the refresh token cookie is set
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'fakeRefreshToken', {
        httpOnly: true,
        secure: false, // Assuming NODE_ENV is not "production"
        sameSite: 'strict'
      });
      // Verify the JSON response includes both accessToken and userID
      expect(res.json).toHaveBeenCalledWith({ accessToken: 'fakeAccessToken', userID: 'userid123' });
    });

    it('should return 500 if an exception is thrown', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockImplementation(() => {
        throw new Error('DB error');
      });

      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Server Error',
        error: 'DB error'
      });
    });
  });

  // -------------------------------------------------------------------------
  // 3. refreshToken
  // -------------------------------------------------------------------------
  describe('refreshToken', () => {
    it('should return 403 if refreshToken is missing', () => {
      req.cookies = {};
      refreshToken(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Access denied' });
    });

    it('should return 403 if refreshToken is invalid', () => {
      req.cookies = { refreshToken: 'badToken' };
      jwt.verify.mockImplementation((token, secret, cb) => {
        cb(new Error('Invalid refresh token'));
      });

      refreshToken(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Invalid refresh token' });
    });

    it('should sign a new accessToken if refreshToken is valid', () => {
      process.env.JWT_SECRET = 'testsecret';
      process.env.JWT_EXPIRES = '1h';
      process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';
      req.cookies = { refreshToken: 'validRefresh' };

      // Simulate jwt.verify decoding the refresh token to an object with id 'user123'
      jwt.verify.mockImplementation((token, secret, cb) => {
        cb(null, { id: 'user123' });
      });
      jwt.sign.mockReturnValue('newAccessToken');

      refreshToken(req, res);
      expect(jwt.verify).toHaveBeenCalledWith('validRefresh', 'refreshsecret', expect.any(Function));
      expect(jwt.sign).toHaveBeenCalledWith(
        { user: { id: 'user123' } },
        'testsecret',
        { expiresIn: '1h' }
      );
      expect(res.json).toHaveBeenCalledWith({ accessToken: 'newAccessToken' });
    });
  });
});
