// tests/integration/appIntegration.test.js
import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import User from "../../models/User.js";
import "./test-setup.js";

describe("Integration Tests for All Controllers", () => {
  //
  // 1. User Controller
  //
  describe("User Controller", () => {
    let userId;

    beforeAll(async () => {
      // Create a test user using the Mongoose model so it passes validation.
      const user = await User.create({
        username: "Alice",
        email: "alice@example.com",
        password: "password"
      });
      userId = user._id.toString();
    });

    afterAll(async () => {
      // Clean up the users collection
      await mongoose.connection.db.collection("users").deleteMany({});
    });

    it("should get all users", async () => {
      const res = await request(app).get("/api/users");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toMatchObject({ username: "Alice" });
    });

    it("should retrieve a user by ID", async () => {
      const res = await request(app).get(`/api/users/${userId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id", userId);
    });

    it("should update a user", async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({ username: "Alice Updated" });
      expect(res.status).toBe(200);
      expect(res.body.username).toBe("Alice Updated");
    });

    it("should delete a user", async () => {
      const res = await request(app).delete(`/api/users/${userId}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ msg: "User deleted successfully" });
    });
  });

  //
  // 2. Transaction Controller
  //
  describe("Transaction Controller", () => {
    let transactionId;
    const newTxData = { amount: 100, currency: "USD", type: "expense", category: "Food" };

    it("should create a new transaction", async () => {
      const res = await request(app).post("/api/transactions").send(newTxData);
      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      transactionId = res.body._id;
      expect(res.body).toMatchObject(newTxData);
    });

    it("should get all transactions", async () => {
      const res = await request(app).get("/api/transactions");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id).toBe(transactionId);
    });

    it("should get a transaction by ID", async () => {
      const res = await request(app).get(`/api/transactions/${transactionId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id", transactionId);
    });

    it("should update a transaction", async () => {
      const res = await request(app)
        .put(`/api/transactions/${transactionId}`)
        .send({ amount: 200 });
      expect(res.status).toBe(200);
      expect(res.body.amount).toBe(200);
    });

    it("should delete a transaction", async () => {
      const res = await request(app).delete(`/api/transactions/${transactionId}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ msg: "Transaction deleted successfully" });

      // Confirm it's gone
      const getRes = await request(app).get(`/api/transactions/${transactionId}`);
      expect(getRes.status).toBe(404);
    });
  });

  //
  // 3. Reporting Controller
  //
  describe("Reporting Controller", () => {
    it("should return spending trend converted (though getExchangeRate is not fully tested here)", async () => {
      // Insert some test transactions
      await request(app).post("/api/transactions").send({ amount: 50, currency: "USD", type: "expense", category: "Food" });
      await request(app).post("/api/transactions").send({ amount: 100, currency: "USD", type: "income", category: "Salary" });

      const res = await request(app).get("/api/reports/spending-trend-converted");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Each item should have a shape like { group: "YYYY-M", total, count }
    });

    it("should return dashboard summary converted", async () => {
      const res = await request(app).get("/api/reports/dashboard-summary-converted");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalIncome");
      expect(res.body).toHaveProperty("totalExpense");
      expect(res.body).toHaveProperty("netBalance");
    });
  });

  //
  // 4. Notification Controller
  //
  describe("Notification Controller", () => {
    it("should fetch notifications for user (none by default)", async () => {
      const res = await request(app).get("/api/notifications");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });
  });

  //
  // 5. Goal Controller
  //
  describe("Goal Controller", () => {
    let goalId;
    it("should create a goal", async () => {
      const res = await request(app)
        .post("/api/goals")
        .send({ description: "My goal", targetAmount: 1000, deadline: "2025-12-31T00:00:00.000Z" });
      expect(res.status).toBe(201);
      goalId = res.body._id;
      expect(res.body).toMatchObject({ description: "My goal", targetAmount: 1000 });
    });

    it("should get all goals", async () => {
      const res = await request(app).get("/api/goals");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id).toBe(goalId);
    });

    it("should get a goal by ID (with progress)", async () => {
      const res = await request(app).get(`/api/goals/${goalId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id", goalId);
      expect(res.body).toHaveProperty("progress");
    });

    it("should update a goal", async () => {
      const res = await request(app)
        .put(`/api/goals/${goalId}`)
        .send({ currentAmount: 200 });
      expect(res.status).toBe(200);
      expect(res.body.currentAmount).toBe(200);
    });

    it("should delete a goal", async () => {
      const res = await request(app).delete(`/api/goals/${goalId}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ msg: "Goal deleted successfully" });
    });
  });

  //
  // 6. Budget Controller
  //
  describe("Budget Controller", () => {
    let budgetId;
    it("should create a budget", async () => {
      const res = await request(app)
        .post("/api/budgets")
        .send({ amount: 500, category: "Groceries", period: "2023-01-01T00:00:00.000Z" });
      expect(res.status).toBe(201);
      budgetId = res.body._id;
      expect(res.body).toMatchObject({
        user: "64fabc0123456789abcdef01",
        amount: 500,
        category: "Groceries",
        period: "2023-01-01T00:00:00.000Z"
      });
    });

    it("should get all budgets", async () => {
      const res = await request(app).get("/api/budgets");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id).toBe(budgetId);
    });

    it("should get budget by ID", async () => {
      const res = await request(app).get(`/api/budgets/${budgetId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id", budgetId);
    });

    it("should update a budget", async () => {
      const res = await request(app)
        .put(`/api/budgets/${budgetId}`)
        .send({ amount: 999 });
      expect(res.status).toBe(200);
      expect(res.body.amount).toBe(999);
    });

    it("should delete a budget", async () => {
      const res = await request(app).delete(`/api/budgets/${budgetId}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ msg: "Budget deleted successfully" });
    });
  });
});
