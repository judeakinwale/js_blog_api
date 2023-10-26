// using paystack
// https://paystack.com/docs/payments/accept-payments/#initialize-transaction

const { default: axios } = require("axios");

/**
 * Sample Paystack API Response.
 * @typedef {Object} PaystackResponse
 * @property {boolean} status - Response Status.
 * @property {string} message - Response Message.
 * @property {Object} data - The data in the response.
 */

/**
 * @typedef {Object} CardPayload
 * @property {number} number - card number
 * @property {number} cvv - card cvv
 * @property {number} expiry_month - card expiration month
 * @property {number} expiry_year - card expiration year
 */

/**
 * @typedef {Object} TransactionPayload
 * @property {string} amount - Amount should be in the subunit of the supported currency (value * 100 to convert to the lowest currency unit)
 * @property {string} email - Customer's email address
 * @property {string} [currency] - The transaction currency, ["NGN", "GHS", "USD"]. Defaults to your integration currency.
 * @property {string} [reference] - Unique transaction reference. Only -, ., = and alphanumeric characters allowed.
 * @property {string} [callback_url] - Fully qualified url, e.g. https://example.com/ . Use this to override the callback url provided on the dashboard for this transaction
 * @property {string} [plan] - If transaction is to create a subscription to a predefined plan, provide plan code here. This would invalidate the value provided in amount
 * @property {number} [invoice_limit] - Number of times to charge customer during subscription to plan
 * @property {string} [metadata] - Stringified JSON object of custom data. Kindly check the Metadata page for more information.
 * @property {Array} [channels] - An array of payment channels to control what channels you want to make available to the user to make a payment with. Available channels include: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer", "eft"]
 * @property {CardPayload} [card] - Payload for card transactions
 * @property {string} [split_code] - The split code of the transaction split. e.g. SPL_98WF13Eb3w
 * @property {string} [subaccount] - The code for the subaccount that owns the payment. e.g. ACCT_8f4s1eq7ml6rlzj
 * @property {Integer} [transaction_charge] - An amount used to override the split configuration for a single split payment. If set, the amount specified goes to the main account regardless of the split configuration.
 * @property {string} [bearer] - Who bears Paystack charges? account or subaccount (defaults to account).
 */

/**
 * @typedef {Object} ChargePayload
 * @property {string} amount - Amount should be in the subunit of the supported currency (value * 100 to convert to the lowest currency unit)
 * @property {string} email - Customer's email address
 * @property {string} authorization_code - Valid authorization code to charge.
 * @property {string} [reference] - Unique transaction reference. Only -, ., = and alphanumeric characters allowed.
 * @property {string} [currency] - The transaction currency, ["NGN", "GHS", "USD"]. Defaults to your integration currency.
 * @property {string} [metadata] - Stringified JSON object of custom data. Kindly check the Metadata page for more information.
 * @property {Array} [channels] - An array of payment channels to control what channels you want to make available to the user to make a payment with. Available channels include: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer", "eft"]
 * @property {string} [subaccount] - The code for the subaccount that owns the payment. e.g. ACCT_8f4s1eq7ml6rlzj
 * @property {string} [bearer] - Who bears Paystack charges? account or subaccount (defaults to account).
 * @property {Boolean} queue - If you are making a scheduled charge call, it is a good idea to queue them so the processing system does not get overloaded causing transaction processing errors. Send queue:true to take advantage of our queued charging.
 */

/**
 * @typedef {Object} PaystackQuery
 * @property {number} [perPage=50] - Specify how many records you want to retrieve per page. If not specify we use a default value of 50.
 * @property {number} [page=1] - Specify exactly what page you want to retrieve. If not specify we use a default value of 1.
 * @property {number} [customer] - Specify an ID for the customer whose transactions you want to retrieve
 * @property {string} [terminalid] - The Terminal ID for the transactions you want to retrieve
 * @property {string} [status] - Filter transactions by status ('failed', 'success', 'abandoned')
 * @property {datetime} [from] - A timestamp from which to start listing transaction e.g. 2016-09-24T00:00:05.000Z, 2016-09-21
 * @property {datetime} [to] - A timestamp at which to stop listing transaction e.g. 2016-09-24T00:00:05.000Z, 2016-09-21
 * @property {number} [amount] - Filter transactions by amount using the supported currency code
 */

const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * 
 * @param {TransactionPayload} payload
 * @param {CardPayload} [card]
 * @return {Object}
 * @sampleResponse https://paystack.com/docs/api/transaction/#initialize
 * {
    "status": true,
    "message": "Authorization URL created",
    "data": {
      "authorization_url": "https://checkout.paystack.com/0peioxfhpn",
      "access_code": "0peioxfhpn",
      "reference": "7PVGX8MEk85tgeEpVDtD"
    }
  }
 */
exports.createPaystackTransaction = async (payload, card = undefined) => {
  if (!(payload?.email && payload?.amount))
    throw new Error("Email and Amount Required!");

  if (card) payload.card = card

  const url = "https://api.paystack.co/transaction/initialize";
  const key = SECRET_KEY;
  const options = { headers: { Authorization: `Bearer ${key}` } };

  const {data: response} = await axios.post(url, payload, options);
  console.log({ response });
  if (response?.status == false)
    throw new Error("Request Failed: Could not complete transaction!");
  // if (response?.data?.status !== "success")
  //   throw new Error("Transaction not Successful!");

  return response?.data;
};

/**
 *
 * @param {string} reference
 * @returns {object}
 * @sampleResponse https://paystack.com/docs/api/transaction/#verify
 */
exports.verifyPaystackTransaction = async (reference) => {
  const url = `https://api.paystack.co/transaction/verify/${reference}`;
  const key = SECRET_KEY;
  const options = { headers: { Authorization: `Bearer ${key}` } };

  const {data: response} = await axios.get(url, options);
  console.log({ response });
  if (response?.status == false)
    throw new Error("Request Failed: Could not verify transaction!");
  if (response?.data?.status !== "success")
    throw new Error("Transaction not Successful!");

  return response?.data;
};

/**
 *
 * @param {PaystackQuery} [query]
 * @returns {object[]}
 * @sampleResponse https://paystack.com/docs/api/transaction/#list
 */
exports.getAllPaystackTransactions = async (query = undefined) => {
  const queryStr = query ? `?${objectToQueryString(query)}` : "";
  const url = `https://api.paystack.co/transaction${queryStr}`;
  const key = SECRET_KEY;
  const options = { headers: { Authorization: `Bearer ${key}` } };

  const {data: response} = await axios.get(url, options);
  console.log({ response });
  if (response?.status == false)
    throw new Error("Request Failed: Could not get all transaction!");

  return response?.data;
};

/**
 *
 * @param {number} id - transaction id (from paystack)
 * @returns {object}
 * @sampleResponse https://paystack.com/docs/api/transaction/#fetch
 */
exports.getSinglePaystackTransaction = async (id) => {
  const url = `https://api.paystack.co/transaction/${id}`;
  const key = SECRET_KEY;
  const options = { headers: { Authorization: `Bearer ${key}` } };

  const {data: response} = await axios.get(url, options);
  console.log({ response });
  if (response?.status == false)
    throw new Error("Request Failed: Could not get transaction!");

  return response?.data;
};

/**
 *
 * @param {ChargePayload} payload
 * @returns {object}
 * @sampleResponse https://paystack.com/docs/api/transaction/#charge-authorization
 */
exports.chargePaystackAuthorization = async (payload) => {
  const url = `https://api.paystack.co/transaction/charge_authorization`;
  const key = SECRET_KEY;
  const options = { headers: { Authorization: `Bearer ${key}` } };

  const { data: response } = await axios.post(url, payload, options);
  console.log({ response });
  if (response?.status == false)
    throw new Error("Request Failed: Could not complete transaction!");
  if (response?.data?.status !== "success")
    throw new Error("Transaction not Successful!");

  return response?.data;
};

function objectToQueryString(obj) {
  const keyValuePairs = [];

  for (const [key, value] of Object.entries(obj)) {
    keyValuePairs.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    );
  }

  return keyValuePairs.join("&");
}

// function objectToQueryString(obj) {
//   const keyValuePairs = [];

//   for (const key in obj) {
//     if (obj.hasOwnProperty(key)) {
//       const value = obj[key];
//       keyValuePairs.push(
//         encodeURIComponent(key) + "=" + encodeURIComponent(value)
//       );
//     }
//   }
//   return keyValuePairs.join("&");
// }
