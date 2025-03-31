// __mocks__/Notification.js

const Notification = {
  // For .find()
  find: jest.fn(),

  // For "new Notification(...)"
  // We'll override in tests so we can track .save()
  mockImplementation: jest.fn(),
};

export default Notification;
