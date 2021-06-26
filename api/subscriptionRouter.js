const { subscribeToTwitchEvents } = require("./twitch/twitchAPI");

const DEVELOPMENT = true;

const BASE_URL = DEVELOPMENT
  ? process.env.DEV_BASE_URL
  : process.env.PROD_BASE_URL;

/**
 * Takes in a string "type" specifying the service
 * to subscribe to.
 * Name is the channel in the specified service
 * that the subscription is for
 * @param {String} type
 * @param {String} name
 */
function subscriptionRouter(type, name = null) {
  /* If the channel name is missing, exit function early with error */
  if (name === null)
    return console.error(
      `ERR in 'subscriptionRouter': The channel name is missing!`
    );

  /**
   * Check which service is being requested
   * Only works for Twitch and YouTube, all other services will
   * be rejected by this function with a log statement
   */
  switch (type) {
    case "twitch":
      subscribeToTwitchEvents(BASE_URL, name);
      break;
    case "youtube":
      subscribeToYouTubeEvents(); // Placeholder
      break;
    default:
      console.log(`'${type}' is not a valid service to subscribe to.`);
  }
}

function subscribeToYouTubeEvents() {
  return console.log("Subscribed to YouTube (TEMP)");
}

module.exports = subscriptionRouter;
