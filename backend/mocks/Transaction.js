// __mocks__/Transaction.js
const Transaction = {
  // For .find(), .findOne() calls, etc.
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  lean: jest.fn(),    // If needed

  // We'll also mock the constructor for `new Transaction(...)`
  // so we can simulate `transaction.save()`.
  mockImplementation: jest.fn()
};

export default Transaction;
