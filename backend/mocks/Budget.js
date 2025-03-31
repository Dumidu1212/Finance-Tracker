// __mocks__/Budget.js
const Budget = {
  // For .find(), .findOne(), .findOneAndUpdate(), .findOneAndDelete()
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  // We'll also mock the constructor for `new Budget(...)`
  mockImplementation: jest.fn()
};

export default Budget;
