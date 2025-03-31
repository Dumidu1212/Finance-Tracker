// tests/transactionController.test.js
import request from 'supertest';
import app from '../../app.js'; // Your Express app
import Transaction from '../../models/Transaction.js';

// Ensure that for testing the user is simulated as authenticated
app.use((req, res, next) => {
  req.user = { id: '64fabc0123456789abcdef01' };
  next();
});

// Use the mock for Transaction
jest.mock('../../models/Transaction.js');

describe('Transaction Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. POST /api/transactions => createTransaction
  // -------------------------------------------------------------------------
  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      const mockTransaction = {
        _id: 'tx123',
        amount: 100,
        currency: 'USD',
        user: '64fabc0123456789abcdef01',
      };

      // Mock the constructor and its save() method:
      const saveMock = jest.fn().mockResolvedValue(mockTransaction);
      Transaction.mockImplementation(() => ({ save: saveMock }));

      const newTxData = { amount: 100, currency: 'USD' };
      const res = await request(app).post('/api/transactions').send(newTxData);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockTransaction);

      // Ensure that the Transaction constructor was called with user: '64fabc0123456789abcdef01'
      // plus the newTxData
      expect(Transaction).toHaveBeenCalledWith({
        ...newTxData,
        user: '64fabc0123456789abcdef01'
      });
      expect(saveMock).toHaveBeenCalledTimes(1);
    });

    it('should handle server errors', async () => {
      Transaction.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('DB Error'))
      }));

      const res = await request(app).post('/api/transactions').send({ amount: 100 });
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // -------------------------------------------------------------------------
  // 2. GET /api/transactions => getTransactions
  // -------------------------------------------------------------------------
  describe('GET /api/transactions', () => {
    it('should retrieve all transactions for the user', async () => {
      const mockTransactions = [
        { _id: 'tx1', amount: 50, user: '64fabc0123456789abcdef01' },
        { _id: 'tx2', amount: 150, user: '64fabc0123456789abcdef01' },
      ];

      // Controller calls: Transaction.find({ user: req.user.id }).sort({ date: -1 })
      const sortMock = jest.fn().mockResolvedValue(mockTransactions);
      Transaction.find.mockReturnValue({ sort: sortMock });

      const res = await request(app).get('/api/transactions');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockTransactions);

      expect(Transaction.find).toHaveBeenCalledWith({ user: '64fabc0123456789abcdef01' });
      expect(sortMock).toHaveBeenCalledWith({ date: -1 });
    });

    it('should handle server errors', async () => {
      Transaction.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const res = await request(app).get('/api/transactions');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // -------------------------------------------------------------------------
  // 3. GET /api/transactions/:id => getTransactionById
  // -------------------------------------------------------------------------
  describe('GET /api/transactions/:id', () => {
    it('should retrieve the specified transaction if it exists', async () => {
      const mockTx = { _id: 'tx123', amount: 200, user: '64fabc0123456789abcdef01' };

      // In the controller: Transaction.findOne({ _id: req.params.id, user: req.user.id })
      Transaction.findOne.mockResolvedValue(mockTx);

      const res = await request(app).get('/api/transactions/tx123');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockTx);

      expect(Transaction.findOne).toHaveBeenCalledWith({
        _id: 'tx123',
        user: '64fabc0123456789abcdef01'
      });
    });

    it('should return 404 if transaction is not found', async () => {
      Transaction.findOne.mockResolvedValue(null);

      const res = await request(app).get('/api/transactions/tx999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('msg', 'Transaction not found');
    });

    it('should handle server errors', async () => {
      Transaction.findOne.mockImplementation(() => {
        throw new Error('DB Error');
      });
      const res = await request(app).get('/api/transactions/tx123');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // -------------------------------------------------------------------------
  // 4. PUT /api/transactions/:id => updateTransaction
  // -------------------------------------------------------------------------
  describe('PUT /api/transactions/:id', () => {
    it('should update the transaction if found', async () => {
      const updates = { amount: 300 };
      const mockUpdatedTx = { _id: 'tx123', amount: 300, user: '64fabc0123456789abcdef01' };

      // In the controller:
      // Transaction.findOneAndUpdate(
      //   { _id: req.params.id, user: req.user.id },
      //   { $set: updates },
      //   { new: true, runValidators: true }
      // )
      Transaction.findOneAndUpdate.mockResolvedValue(mockUpdatedTx);

      const res = await request(app).put('/api/transactions/tx123').send(updates);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUpdatedTx);

      expect(Transaction.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'tx123', user: '64fabc0123456789abcdef01' },
        { $set: updates },
        { new: true, runValidators: true }
      );
    });

    it('should return 404 if transaction not found', async () => {
      Transaction.findOneAndUpdate.mockResolvedValue(null);

      const res = await request(app).put('/api/transactions/tx999').send({ amount: 300 });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('msg', 'Transaction not found');
    });

    it('should handle server errors', async () => {
      Transaction.findOneAndUpdate.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const res = await request(app).put('/api/transactions/tx123').send({ amount: 300 });
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // -------------------------------------------------------------------------
  // 5. DELETE /api/transactions/:id => deleteTransaction
  // -------------------------------------------------------------------------
  describe('DELETE /api/transactions/:id', () => {
    it('should delete the transaction if found', async () => {
      const mockTx = { _id: 'tx123', amount: 200, user: '64fabc0123456789abcdef01' };
      Transaction.findOneAndDelete.mockResolvedValue(mockTx);

      const res = await request(app).delete('/api/transactions/tx123');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('msg', 'Transaction deleted successfully');

      expect(Transaction.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'tx123',
        user: '64fabc0123456789abcdef01'
      });
    });

    it('should return 404 if transaction not found', async () => {
      Transaction.findOneAndDelete.mockResolvedValue(null);

      const res = await request(app).delete('/api/transactions/tx999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('msg', 'Transaction not found');
    });

    it('should handle server errors', async () => {
      Transaction.findOneAndDelete.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const res = await request(app).delete('/api/transactions/tx123');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });
});
