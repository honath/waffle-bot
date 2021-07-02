const { subscribeToTwitchEvents } = require("./twitch/twitchAPI");

const Logger = require("../lib/logger");

/* Get defined log level and instantiate a new logger */
const { LOG_LEVEL } = process.env;

const logger = new Logger(LOG_LEVEL);

/**
 * Takes in a string "type" specifying the service
 * to subscribe to.
 * Name is the channel in the specified service
 * that the subscription is for
 * @param {String} type
 * @param {String} name
 */
function subscriptionRouter(type, name = null, guildID = null) {
  logger.info({
    action: "Determine subscription service for Discord",
    location: `'subscriptionRouter' in ${__dirname}`,
    notes: [
      `Service: ${type}`,
      `Broadcaster: ${name}`,
      `Guild ID: ${guildID}`,
    ],
  });

  /* If the channel name is missing, exit function early with error */
  if (name === null)
    return console.error(
      `ERR in 'subscriptionRouter': The channel name is missing!`
    );
  if (guildID === null)
    return console.error(
      `ERR in 'subscriptionRouter': Guild and Channel IDs are required!`
    );

  /**
   * Check which service is being requested
   * Only works for Twitch and YouTube, all other services will
   * be rejected by this function with a log statement
   */
  switch (type) {
    case "twitch":
      subscribeToTwitchEvents(name, guildID);
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
