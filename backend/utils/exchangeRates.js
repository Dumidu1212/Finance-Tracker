import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

let cachedRates = {};
let lastUpdate = null;

export const updateExchangeRates = async () => {
  try {
    const response = await axios.get(process.env.EXCHANGE_RATE_API_URL, {
      params: {
        access_key: process.env.EXCHANGE_RATE_API_KEY
        // Remove the base parameter as the free plan returns EUR as the base.
      }
    });
    if (response.data && response.data.rates) {
      const rawRates = response.data.rates;
      // Round each rate to two decimal places.
      cachedRates = {};
      for (const currency in rawRates) {
        // Use parseFloat to convert the toFixed string back to a number.
        cachedRates[currency] = parseFloat(rawRates[currency].toFixed(2));
      }
      lastUpdate = new Date();
      console.log("Exchange rates updated:", cachedRates);
    } else {
      console.error("No rates found in response:", response.data);
    }
  } catch (error) {
    console.error("Error updating exchange rates:", error.message);
  }
};

/**
 * Returns the exchange rate to convert from one currency to another.
 * If a currency is EUR (the fixer base), its rate is 1.
 *
 * @param {string} fromCurrency - The currency code to convert from.
 * @param {string} toCurrency - The currency code to convert to.
 * @returns {number} - The conversion rate.
 * @throws Will throw an error if the necessary rate is unavailable.
 */
export const getExchangeRate = (fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return 1;
  if (!cachedRates || Object.keys(cachedRates).length === 0) {
    throw new Error("Exchange rates not available; please try again later");
  }
  const rateFrom = fromCurrency === "EUR" ? 1 : cachedRates[fromCurrency];
  const rateTo = toCurrency === "EUR" ? 1 : cachedRates[toCurrency];
  if (!rateFrom || !rateTo) {
    throw new Error("Exchange rate not available for given currency");
  }
  // Calculate the conversion rate and round to two decimals.
  return parseFloat(((1 / rateFrom) * rateTo).toFixed(2));
};

/**
 * Returns the last update timestamp of the exchange rates.
 */
export const getLastUpdate = () => lastUpdate;
