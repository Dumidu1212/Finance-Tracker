// tests/reportingController.test.js
import request from 'supertest';
import app from '../../app.js';                // Your Express app
import Transaction from '../../models/Transaction.js';
import { getExchangeRate } from '../../utils/exchangeRates.js';

// Tell Jest to use the mocks for Transaction & getExchangeRate
jest.mock('../../models/Transaction.js');
jest.mock('../../utils/exchangeRates.js');

describe('Reporting Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();  // reset call counts and mock implementations
  });

  // ---------------------------------------------------------------------------
  // 1. getSpendingTrendReportConverted
  //    GET /api/reports/spending-trend-converted
  // ---------------------------------------------------------------------------
  describe('GET /api/reports/spending-trend-converted', () => {
    it('should return a sorted spending trend report in USD', async () => {
      // We'll set up mock data
      const mockTransactions = [
        { amount: 100, currency: 'USD', date: '2025-01-10', user: '64fabc0123456789abcdef01' },
        { amount: 200, currency: 'EUR', date: '2025-01-15', user: '64fabc0123456789abcdef01' },
        { amount: 50,  currency: 'USD', date: '2025-02-01', user: '64fabc0123456789abcdef01' }
      ];

      // The controller calls: Transaction.find(query).lean()
      // We'll have find.mockReturnValue(...) return an object
      // that has .lean() returning our mockTransactions
      Transaction.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTransactions),
      });

      // Mock getExchangeRate so that EUR -> USD is 1.1, for example
      getExchangeRate.mockImplementation((fromCurrency, toCurrency) => {
        if (fromCurrency === 'EUR' && toCurrency === 'USD') return 1.1;
        return 1;
      });

      const res = await request(app).get('/api/reports/spending-trend-converted');

      expect(res.status).toBe(200);
      // The controller groups monthly by default, so we expect keys like "2025-1", "2025-2"
      // Then it sorts them in ascending order by groupKey
      // For "2025-1", the total is 100 (USD->USD=1x) + 200(EUR->USD=1.1 => 220) = 320
      // For "2025-2", the total is 50 (USD->USD=1x) => 50
      // count for Jan = 2, for Feb = 1
      expect(res.body).toEqual([
        { group: '2025-1', total: 320, count: 2 },
        { group: '2025-2', total: 50,  count: 1 },
      ]);

      // Check we called Transaction.find with correct user
      expect(Transaction.find).toHaveBeenCalledWith({ user: '64fabc0123456789abcdef01' });
    });

    it('should allow daily grouping via query param groupBy=daily', async () => {
      const mockTransactions = [
        { amount: 10, currency: 'USD', date: '2025-01-10', user: '64fabc0123456789abcdef01' },
        { amount: 20, currency: 'USD', date: '2025-01-10', user: '64fabc0123456789abcdef01' },
        { amount: 50, currency: 'USD', date: '2025-01-11', user: '64fabc0123456789abcdef01' },
      ];
      Transaction.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTransactions),
      });
      getExchangeRate.mockReturnValue(1);

      const res = await request(app)
        .get('/api/reports/spending-trend-converted?groupBy=daily');

      expect(res.status).toBe(200);
      // For daily grouping:
      // 2025-0-basedMonth=0-based? Actually new Date(2025-01-10).getUTCMonth() => 0 => So it's "2025-1-10"?
      // The controller does: date.getUTCMonth() + 1 => 1-based month
      // So groupKey = "2025-1-10" for the first two, then "2025-1-11" for the next
      expect(res.body).toEqual([
        { group: '2025-1-10', total: 30, count: 2 },
        { group: '2025-1-11', total: 50, count: 1 },
      ]);
    });

    it('should filter by startDate, endDate, type, category, and tags if provided', async () => {
      Transaction.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      // Request includes all query filters
      const res = await request(app)
        .get('/api/reports/spending-trend-converted?startDate=2025-01-01&endDate=2025-12-31&type=income&category=salary&tags=bonus,stock');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]); // Because we mocked an empty array

      // Check that Transaction.find was called with correct query
      expect(Transaction.find).toHaveBeenCalledWith({
        user: '64fabc0123456789abcdef01',
        date: { $gte: new Date('2025-01-01'), $lte: new Date('2025-12-31') },
        type: 'income',
        category: 'salary',
        tags: { $in: ['bonus', 'stock'] },
      });
    });

    it('should handle server errors', async () => {
      Transaction.find.mockImplementation(() => {
        throw new Error('DB Error');
      });
      const res = await request(app).get('/api/reports/spending-trend-converted');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. getDashboardSummaryConverted
  //    GET /api/reports/dashboard-summary-converted
  // ---------------------------------------------------------------------------
  describe('GET /api/reports/dashboard-summary-converted', () => {
    it('should return a summary of totalIncome, totalExpense, and netBalance in USD', async () => {
      // Suppose we have 2 incomes: 100 USD, 200 EUR => 200 EUR => 220 USD if rate=1.1
      // and 1 expense: 50 GBP => 60 USD if rate=1.2
      const mockIncomes = [
        { amount: 100, currency: 'USD', type: 'income', user: '64fabc0123456789abcdef01' },
        { amount: 200, currency: 'EUR', type: 'income', user: '64fabc0123456789abcdef01' },
      ];
      const mockExpenses = [
        { amount: 50, currency: 'GBP', type: 'expense', user: '64fabc0123456789abcdef01' },
      ];

      // The controller does Transaction.find({ user: userId, type: "income" })
      // and then .lean() => we can just mock .find() multiple times or separate calls
      Transaction.find
        .mockImplementationOnce(() => ({
          lean: jest.fn().mockResolvedValue(mockIncomes),
        }))
        .mockImplementationOnce(() => ({
          lean: jest.fn().mockResolvedValue(mockExpenses),
        }));

      // Mock the exchange rates
      getExchangeRate.mockImplementation((from, to) => {
        if (from === 'EUR') return 1.1;
        if (from === 'GBP') return 1.2;
        return 1;
      });

      const res = await request(app).get('/api/reports/dashboard-summary-converted');
      expect(res.status).toBe(200);
      // totalIncome = 100(USD->USD=1) + 200(EUR->USD=1.1=>220) = 320
      // totalExpense= 50(GBP->USD=1.2=>60)
      // netBalance= 320 - 60= 260
      expect(res.body).toEqual({
        totalIncome: 320,
        totalExpense: 60,
        netBalance: 260
      });

      // Check calls to Transaction.find for incomes and expenses
      expect(Transaction.find).toHaveBeenCalledWith({
        user: '64fabc0123456789abcdef01',
        type: 'income'
      });
      expect(Transaction.find).toHaveBeenCalledWith({
        user: '64fabc0123456789abcdef01',
        type: 'expense'
      });
    });

    it('should handle server errors', async () => {
      Transaction.find.mockImplementation(() => {
        throw new Error('DB Error');
      });
      const res = await request(app).get('/api/reports/dashboard-summary-converted');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('msg', 'Server Error');
    });
  });
});
