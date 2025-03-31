// tests/unit/budgetController.test.js
import request from 'supertest';
import app from '../../app.js'; // Your Express app
import Budget from '../../models/Budget.js';

// Add a middleware for testing that sets req.user to simulate an authenticated user
app.use((req, res, next) => {
  req.user = { id: '64fabc0123456789abcdef01' };
  next();
});

// Tell Jest to mock the Budget model
jest.mock('../../models/Budget.js');

describe('Budget Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. POST /api/budgets => createBudget
  // -------------------------------------------------------------------------
  describe('POST /api/budgets => createBudget', () => {
    it('should create a new budget for the authenticated user', async () => {
      // Create a saveMock that sets _id on the instance and returns it.
      const saveMock = jest.fn().mockImplementation(function() {
        this._id = 'b123';
        return Promise.resolve(this);
      });
      // When new Budget(...) is called, return an object that includes the passed data plus the save method.
      Budget.mockImplementation((data) => ({ ...data, save: saveMock }));

      const newBudget = { amount: 500, category: 'Groceries', period: 'monthly' };
      const res = await request(app).post('/api/budgets').send(newBudget);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        _id: 'b123',
        user: '64fabc0123456789abcdef01',
        amount: 500,
        category: 'Groceries',
        period: 'monthly'
      });

      // Verify that Budget was constructed with the correct properties (including the simulated user)
      expect(Budget).toHaveBeenCalledWith({
        user: '64fabc0123456789abcdef01',
        amount: 500,
        category: 'Groceries',
        period: 'monthly'
      });
      expect(saveMock).toHaveBeenCalledTimes(1);
    });

    it('should handle server errors', async () => {
      // Force an error by having save() reject
      Budget.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('DB Error'))
      }));

      const res = await request(app).post('/api/budgets').send({ amount: 500 });
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // -------------------------------------------------------------------------
  // 2. GET /api/budgets => getBudgets
  // -------------------------------------------------------------------------
  describe('GET /api/budgets => getBudgets', () => {
    it('should return all budgets for the user sorted by period descending', async () => {
      const mockBudgets = [
        { _id: 'b2', period: 'yearly' },
        { _id: 'b1', period: 'monthly' }
      ];

      // Budget.find({ user: req.user.id }).sort({ period: -1 })
      const sortMock = jest.fn().mockResolvedValue(mockBudgets);
      Budget.find.mockReturnValue({ sort: sortMock });

      const res = await request(app).get('/api/budgets');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockBudgets);

      expect(Budget.find).toHaveBeenCalledWith({ user: '64fabc0123456789abcdef01' });
      expect(sortMock).toHaveBeenCalledWith({ period: -1 });
    });

    it('should handle server errors', async () => {
      Budget.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const res = await request(app).get('/api/budgets');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // -------------------------------------------------------------------------
  // 3. GET /api/budgets/:id => getBudgetById
  // -------------------------------------------------------------------------
  describe('GET /api/budgets/:id => getBudgetById', () => {
    it('should return a budget if found', async () => {
      const mockBudget = { _id: 'b999', user: '64fabc0123456789abcdef01', amount: 1000 };
      Budget.findOne.mockResolvedValue(mockBudget);

      const res = await request(app).get('/api/budgets/b999');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockBudget);
      expect(Budget.findOne).toHaveBeenCalledWith({
        _id: 'b999',
        user: '64fabc0123456789abcdef01'
      });
    });

    it('should return 404 if the budget is not found', async () => {
      Budget.findOne.mockResolvedValue(null);

      const res = await request(app).get('/api/budgets/notfound');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('msg', 'Budget not found');
    });

    it('should handle server errors', async () => {
      Budget.findOne.mockImplementation(() => {
        throw new Error('DB Error');
      });
      const res = await request(app).get('/api/budgets/b123');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // -------------------------------------------------------------------------
  // 4. PUT /api/budgets/:id => updateBudget
  // -------------------------------------------------------------------------
  describe('PUT /api/budgets/:id => updateBudget', () => {
    it('should update and return the updated budget', async () => {
      const updates = { amount: 999 };
      const mockUpdatedBudget = { _id: 'b123', user: '64fabc0123456789abcdef01', amount: 999 };

      // .findOneAndUpdate({ _id, user }, { $set: updates }, { new: true, runValidators: true })
      Budget.findOneAndUpdate.mockResolvedValue(mockUpdatedBudget);

      const res = await request(app).put('/api/budgets/b123').send(updates);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUpdatedBudget);

      expect(Budget.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'b123', user: '64fabc0123456789abcdef01' },
        { $set: updates },
        { new: true, runValidators: true }
      );
    });

    it('should return 404 if the budget is not found', async () => {
      Budget.findOneAndUpdate.mockResolvedValue(null);

      const res = await request(app).put('/api/budgets/missing').send({ amount: 100 });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('msg', 'Budget not found');
    });

    it('should handle server errors', async () => {
      Budget.findOneAndUpdate.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const res = await request(app).put('/api/budgets/b123').send({ amount: 100 });
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // -------------------------------------------------------------------------
  // 5. DELETE /api/budgets/:id => deleteBudget
  // -------------------------------------------------------------------------
  describe('DELETE /api/budgets/:id => deleteBudget', () => {
    it('should delete the budget if found', async () => {
      Budget.findOneAndDelete.mockResolvedValue({ _id: 'b123', user: '64fabc0123456789abcdef01' });

      const res = await request(app).delete('/api/budgets/b123');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('msg', 'Budget deleted successfully');
      expect(Budget.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'b123',
        user: '64fabc0123456789abcdef01'
      });
    });

    it('should return 404 if the budget is not found', async () => {
      Budget.findOneAndDelete.mockResolvedValue(null);

      const res = await request(app).delete('/api/budgets/b999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('msg', 'Budget not found');
    });

    it('should handle server errors', async () => {
      Budget.findOneAndDelete.mockImplementation(() => {
        throw new Error('DB Error');
      });
      const res = await request(app).delete('/api/budgets/b123');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });
});
