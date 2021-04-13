const externals = require("../resources/externalURLs.json");
const subscriptions = require("../resources/subscriptions.json");

const subscribeToTwitchEvents = require("./twitch/subscribeToTwitchEvents");

const DEVELOPMENT = true;

const BASE_URL = DEVELOPMENT
  ? process.env.DEV_BASE_URL
  : process.env.PROD_BASE_URL;

/**
 * Routes to relevant event subscription
 * base on given string from ./app.js and data
 * stored in ../resources/subscriptions.json
 * @param {string} type
 * valid 'type' inputs are as follows:
 * ["twitch", "youtube"]
 */
function subscriptionRouter(type) {
  switch (type) {
    case "twitch":
      subscribeToTwitchEvents(BASE_URL, externals, subscriptions);
      break;
    case "youtube":
      subscribeToYouTubeEvents();
      break;
    default:
      console.log(`'${type}' is not a valid service to subscribe to.`);
  }
}

function subscribeToYouTubeEvents() {
  return console.log("Subscribed to YouTube");
}

module.exports = subscriptionRouter;
