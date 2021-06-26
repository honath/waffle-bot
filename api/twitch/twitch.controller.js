/* Class imports */
const crypto = require("crypto");
const Logger = require("../../lib/logger");
const NotifyDiscord = require("../../lib/notifyDiscord");

/* Get defined log level and instantiate a new logger */
const { LOG_LEVEL } = process.env;

const logger = new Logger(LOG_LEVEL);

/* Secret for verifying Twitch requests/signatures */
const { TWITCH_SECRET } = process.env;

/* Initialize empty set for storing notification IDs */
const TwitchNotifIDs = new Set();

/**
 * After signature is verified,
 * checks the request message type header
 * Depending on the header type, it will proceed
 * with the appropriate functions
 * ==============================================
 * It is handled this way due to the way the EventSub
 * and callback is set up.
 * Both the original EventSub setup process and the
 * notification payloads are sent to the same URI
 * with the same HTTP method (POST)
 * ==============================================
 * NOTE: functionality had to be restricted to staying in this function,
 * due to (I assume) limitations with Express, or even just my own
 * knowledge of Express
 */
function requestRouter(request, response, next) {
  /* Get message type from header */
  const messageType = request.header("Twitch-Eventsub-Message-Type");

  logger.trace({
    action: "Determine request path",
    location: `'requestRouter' in ${__dirname}`,
    notes: [`Twitch Message Type: ${messageType}`],
  });

  switch (messageType) {
    /**
     * Confirm the "challenge" token from Twitch
     * if message type header matches "callback verification"
     */
    case "webhook_callback_verification":
      /* Retrieve challenge token from Twitch request */
      const { challenge } = request.body;

      /* Log this function's execution and challenge token */
      logger.trace({
        action: `${request.method}`,
        location: `'requestRouter' in ${__dirname}`,
        notes: [`With challenge token: ${challenge}`],
      });

      /**
       * Respond to Twitch API with challenge
       * as specified by Twitch WebHook documentation
       */
      response.status(200).send(`${challenge}`);

      logger.info({
        action: "Return challenge token",
        location: `'requestRouter' in ${__dirname}`,
        status: 200,
        notes: [`Twitch Message Type: ${messageType}`],
      });
      break;
    /**
     * Proceed to notification process
     * and verifying legitimacy of the notification
     * if message type header strictly matches "notification"
     */
    case "notification":
      /* Get Notification ID from request headers */
      const notificationID = request.header("Twitch-Notification-Id");

      /* Check if notification is unique */
      const isUnique = isUniqueNotification(notificationID);

      /* Send "is duplicate" error if necessary */
      if (isUnique === false)
        next({ status: 400, message: "Duplicate payload detected!" });

      /* Get the "meat" of the information from the notification payload */
      const { event } = request.body;

      /* Respond with a "green light" to Twitch (200 OK) */
      response.sendStatus(200);

      logger.info({
        action: "Notification recieved and validated",
        location: `'requestRouter' in ${__dirname}`,
        status: 200,
        notes: [`Twitch Message Type: ${messageType}`],
      });

      /* Proceed to notification process */
      NotifyDiscord.twitch(event);

      break;
    /**
     * Any other message type headers are not accounted for
     * ==============================================
     * Respond with a server error
     */
    default:
      next({
        status: 500,
        message:
          "Sorry, there doesn't seem to be a handler for that EventSub message",
      });
  }
}

/**
 * Verifies the sha-256 signature
 * as defined by Twitch documentation
 */
function verifySignature(request, response, next) {
  logger.trace({
    action: "Verify Twitch signature",
    location: `'verifySignature' in ${__dirname}`,
  });

  /* Quick end if multiple notification retries above specified threshold */
  const retries = request.header("Twitch-Notification-Retry");
  const RETRY_THRESHOLD = 1;
  if (retries > RETRY_THRESHOLD) {
    next({
      status: 202,
      message: "Detected multiple attempts. Ending request loop.",
    });
  }

  /* Retrieve headers + raw bytes as specified by Twitch API documentation */
  const messageSignature = request.header("Twitch-Eventsub-Message-Signature");
  const messageID = request.header("Twitch-Eventsub-Message-Id");
  const messageTimestamp = request.header("Twitch-Eventsub-Message-Timestamp");
  const body = request.rawBody;

  /* Construct HMAC message */
  const message = messageID + messageTimestamp + body;
  const signature = crypto.createHmac("sha256", TWITCH_SECRET).update(message);
  const expectedSignatureHeader = "sha256=" + signature.digest("hex");

  /* Compare signature to verify legitimacy of request */
  if (expectedSignatureHeader !== messageSignature) {
    /* If check fails, respond to requester and exit */
    next({
      status: 400,
      message: "Invalid Twitch Signature",
    });
  }

  /* Otherwise, continue to next middleware in stack */
  next();
}

/**
 * @param {String}
 * =================================
 * Verifies payload is unique and not a duplicate/repeat
 * of a previous notification via a Set (TwitchNotifIDs)
 * @returns {Boolean}
 */
function isUniqueNotification(notificationID) {
  /**
   * if notification ID exists in records, set false (not unique)
   * Otherwise, set true (is unique)
   */
  const isUnique = TwitchNotifIDs.has(notificationID) ? false : true;

  /* If it is a new notification ID, add to the set */
  if (isUnique) TwitchNotifIDs.add(notificationID);

  /* Return boolean value held in isUnique */
  return isUnique;
}

module.exports = {
  subscribe: [verifySignature, requestRouter],
};
