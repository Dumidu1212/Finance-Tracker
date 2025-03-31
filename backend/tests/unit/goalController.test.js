// tests/unit/goalController.test.js
import request from 'supertest';
import app from '../../app.js';
import Goal from '../../models/Goal.js';
import { allocateSavingsForUser } from '../../controllers/goalController.js';

// Simulate an authenticated user for all requests
app.use((req, res, next) => {
  req.user = { id: '64fabc0123456789abcdef01' };
  next();
});

// Tell Jest to mock the Goal model
jest.mock('../../models/Goal.js');

describe('Goal Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. POST /api/goals => createGoal
  // -------------------------------------------------------------------------
  describe('POST /api/goals => createGoal', () => {
    it('should create a new goal with defaults', async () => {
      // Create a saveMock that sets _id on the instance and returns the instance
      const saveMock = jest.fn().mockImplementation(function () {
        this._id = 'goal123';
        return Promise.resolve(this);
      });
      // When new Goal(...) is called, return an object that includes the passed data plus save()
      Goal.mockImplementation((data) => ({ ...data, save: saveMock }));

      const requestBody = {
        description: 'My goal',
        targetAmount: 1000,
        deadline: '2025-12-31'
      };

      const res = await request(app).post('/api/goals').send(requestBody);
      expect(res.status).toBe(201);
      // The test expects at minimum _id, description, and targetAmount
      expect(res.body).toMatchObject({
        _id: 'goal123',
        description: 'My goal',
        targetAmount: 1000
      });

      // Check that Goal was constructed with the correct data (including simulated user)
      expect(Goal).toHaveBeenCalledWith({
        user: '64fabc0123456789abcdef01',
        description: 'My goal',
        targetAmount: 1000,
        deadline: '2025-12-31',
        autoAllocate: false,
        autoAllocatePercentage: 0
      });
      expect(saveMock).toHaveBeenCalledTimes(1);
    });

    it('should handle server errors', async () => {
      Goal.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('DB Error'))
      }));

      const res = await request(app).post('/api/goals').send({});
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // -------------------------------------------------------------------------
  // 2. GET /api/goals => getGoals
  // -------------------------------------------------------------------------
  describe('GET /api/goals => getGoals', () => {
    it('should retrieve all goals for the user, sorted by deadline ascending', async () => {
      const mockGoals = [
        { _id: 'g1', deadline: '2025-01-01', user: '64fabc0123456789abcdef01' },
        { _id: 'g2', deadline: '2024-05-01', user: '64fabc0123456789abcdef01' }
      ];

      // The controller calls: Goal.find({ user: req.user.id }).sort({ deadline: 1 })
      const sortMock = jest.fn().mockResolvedValue(mockGoals);
      Goal.find.mockReturnValue({ sort: sortMock });

      const res = await request(app).get('/api/goals');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockGoals);

      expect(Goal.find).toHaveBeenCalledWith({ user: '64fabc0123456789abcdef01' });
      expect(sortMock).toHaveBeenCalledWith({ deadline: 1 });
    });

    it('should handle server errors', async () => {
      Goal.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const res = await request(app).get('/api/goals');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // -------------------------------------------------------------------------
  // 3. GET /api/goals/:id => getGoalById
  // -------------------------------------------------------------------------
  describe('GET /api/goals/:id => getGoalById', () => {
    it('should return a goal with calculated progress', async () => {
      const mockGoal = {
        _id: 'g123',
        user: '64fabc0123456789abcdef01',
        targetAmount: 1000,
        currentAmount: 200,
        toObject: function () {
          return this;
        }
      };

      Goal.findOne.mockResolvedValue(mockGoal);

      const res = await request(app).get('/api/goals/g123');
      expect(res.status).toBe(200);
      // Progress: (200 / 1000)*100 => 20.00
      expect(res.body).toEqual({
        _id: 'g123',
        user: '64fabc0123456789abcdef01',
        targetAmount: 1000,
        currentAmount: 200,
        progress: '20.00'
      });
    });

    it('should return 404 if goal not found', async () => {
      Goal.findOne.mockResolvedValue(null);
      const res = await request(app).get('/api/goals/doesnotexist');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('msg', 'Goal not found');
    });

    it('should handle server errors', async () => {
      Goal.findOne.mockImplementation(() => {
        throw new Error('DB Error');
      });
      const res = await request(app).get('/api/goals/g123');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // -------------------------------------------------------------------------
  // 4. PUT /api/goals/:id => updateGoal
  // -------------------------------------------------------------------------
  describe('PUT /api/goals/:id => updateGoal', () => {
    it('should update the goal if it exists', async () => {
      const mockUpdatedGoal = { _id: 'g123', user: '64fabc0123456789abcdef01', description: 'Updated desc' };

      Goal.findOneAndUpdate.mockResolvedValue(mockUpdatedGoal);

      const res = await request(app)
        .put('/api/goals/g123')
        .send({ description: 'Updated desc' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUpdatedGoal);

      expect(Goal.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'g123', user: '64fabc0123456789abcdef01' },
        { $set: { description: 'Updated desc' } },
        { new: true, runValidators: true }
      );
    });

    it('should return 404 if goal not found', async () => {
      Goal.findOneAndUpdate.mockResolvedValue(null);
      const res = await request(app).put('/api/goals/g999').send({ description: 'nope' });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('msg', 'Goal not found');
    });

    it('should handle server errors', async () => {
      Goal.findOneAndUpdate.mockImplementation(() => {
        throw new Error('DB Error');
      });
      const res = await request(app).put('/api/goals/g123').send({ description: 'error' });
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // -------------------------------------------------------------------------
  // 5. DELETE /api/goals/:id => deleteGoal
  // -------------------------------------------------------------------------
  describe('DELETE /api/goals/:id => deleteGoal', () => {
    it('should delete the goal if found', async () => {
      Goal.findOneAndDelete.mockResolvedValue({ _id: 'g123', user: '64fabc0123456789abcdef01' });
      const res = await request(app).delete('/api/goals/g123');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('msg', 'Goal deleted successfully');
      expect(Goal.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'g123',
        user: '64fabc0123456789abcdef01'
      });
    });

    it('should return 404 if goal not found', async () => {
      Goal.findOneAndDelete.mockResolvedValue(null);
      const res = await request(app).delete('/api/goals/g999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('msg', 'Goal not found');
    });

    it('should handle server errors', async () => {
      Goal.findOneAndDelete.mockImplementation(() => {
        throw new Error('DB Error');
      });
      const res = await request(app).delete('/api/goals/g123');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // -------------------------------------------------------------------------
  // 6. allocateSavingsForUser function
  // -------------------------------------------------------------------------
  describe('allocateSavingsForUser function', () => {
    it('should allocate savings to all autoAllocate goals', async () => {
      const mockGoals = [
        { _id: 'g1', user: '64fabc0123456789abcdef01', autoAllocate: true, autoAllocatePercentage: 10, currentAmount: 0, targetAmount: 100, save: jest.fn() },
        { _id: 'g2', user: '64fabc0123456789abcdef01', autoAllocate: true, autoAllocatePercentage: 50, currentAmount: 50, targetAmount: 100, save: jest.fn() },
        { _id: 'g3', user: '64fabc0123456789abcdef01', autoAllocate: false, autoAllocatePercentage: 100, currentAmount: 0, targetAmount: 200, save: jest.fn() }
      ];

      // The function calls: Goal.find({ user: userId, autoAllocate: true })
      Goal.find.mockResolvedValue([mockGoals[0], mockGoals[1]]);

      await allocateSavingsForUser('64fabc0123456789abcdef01', 200);

      // For g1: currentAmount += 200 * 0.1 = 20
      expect(mockGoals[0].currentAmount).toBe(20);
      expect(mockGoals[0].save).toHaveBeenCalledTimes(1);
      // For g2: currentAmount was 50, so 50 + (200 * 0.5) = 150
      expect(mockGoals[1].currentAmount).toBe(150);
      expect(mockGoals[1].save).toHaveBeenCalledTimes(1);
    });

    it('should mark goal as achieved if currentAmount >= targetAmount', async () => {
      const mockGoal = {
        _id: 'g1',
        user: '64fabc0123456789abcdef01',
        autoAllocate: true,
        autoAllocatePercentage: 100,
        currentAmount: 50,
        targetAmount: 100,
        achieved: false,
        save: jest.fn()
      };

      Goal.find.mockResolvedValue([mockGoal]);

      await allocateSavingsForUser('64fabc0123456789abcdef01', 100);
      // currentAmount becomes 50 + 100 = 150, so achieved should be true
      expect(mockGoal.achieved).toBe(true);
      expect(mockGoal.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error if database fails', async () => {
      Goal.find.mockRejectedValue(new Error('DB Error'));
      await expect(allocateSavingsForUser('64fabc0123456789abcdef01', 100)).rejects.toThrow('DB Error');
    });
  });
});
