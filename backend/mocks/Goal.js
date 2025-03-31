// __mocks__/Goal.js
const Goal = {
  // For .find(), .findOne(), .findOneAndUpdate(), .findOneAndDelete()...
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),

  // We'll also mock the constructor for `new Goal(...)`:
  mockImplementation: jest.fn()
};

export default Goal;
