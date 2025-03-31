// jobs/exchangeRateUpdater.js
import cron from "node-cron";
import { updateExchangeRates } from "../utils/exchangeRates.js";

/**
 * Schedules a cron job to update exchange rates every hour.
 * Runs at minute 0 of every hour.
 */
const scheduleExchangeRateUpdates = () => {
  cron.schedule("0 * * * *", async () => {
    await updateExchangeRates();
  });
};

export default scheduleExchangeRateUpdates;
