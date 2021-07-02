// #region Imports
/* Class imports */
const crypto = require("crypto");
const Logger = require("../../lib/logger");
const NotifyDiscord = require("../../lib/notifyDiscord");

/* Database Query import */
const service = require("./twitch.service");

/* Middleware import */
const verifyInternalToken = require("../common/verifyAuthToken");
const announcementExists = require("../common/announcementExists");
const verifyAnnouncementResult = require("../common/verifyAnnouncementResult");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

/* Get defined log level and instantiate a new logger */
const { LOG_LEVEL } = process.env;

const logger = new Logger(LOG_LEVEL);

/* Secret for verifying Twitch requests/signatures */
const { TWITCH_SECRET } = process.env;

/* Initialize empty set for storing notification IDs */
const TwitchNotifIDs = new Set();
// #endregion Imports

// #region Twitch EventSub Communication
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
      if (isUnique === false) {
        next({ status: 400, message: "Duplicate payload detected!" });
      } else {
        /* Respond with a "green light" to Twitch (200 OK) */
        response.sendStatus(200);
      }

      /* Get the "meat" of the information from the notification payload */
      const { event } = request.body;

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
// #endregion Twitch EventSub Communication

// #region Set Announcement Channel for a Discord Server
/**
 * Sends either an INSERT or UPDATE request
 * to the DB, depending on if an existing entry
 * for the guild ID was located in the DB
 * previously.
 *
 * @returns Status code and JSON object
 */
async function setAnnouncement(request, response) {
  const { announcement } = response.locals;
  const newChannelID = response.locals.channel_id;

  logger.info({
    action: "Set Announcement Channel",
    location: `'setAnnouncement' in ${__dirname}`,
    notes: [
      `Announcement Object: ${announcement}`,
      `Channel ID: ${newChannelID}`,
    ],
  });

  /**
   * INSERT into DB new announcement entry
   * if existing entry was not found
   * in previous middleware
   */
  if (announcement === null) {
    const newGuildID = request.params.guild_id;
    const newAnnouncement = {
      guild_id: newGuildID,
      channel_id: newChannelID,
    };
    /* INSERT */
    const insertedAnnouncement = await service.createAnnouncement(
      newAnnouncement
    );

    response.status(201).json({ data: await insertedAnnouncement });
  } else {
    /* UPDATE existing DB by guild_id with new channel_id */
    const guild_id = announcement.guild_id;
    const updatedAnnouncement = await service.updateAnnouncement(
      guild_id,
      newChannelID
    );

    response.status(200).json({ data: await updatedAnnouncement });
  }
}

/**
 * Checks request query parameters for the new
 * channel ID
 */
function hasChannelID(request, response, next) {
  logger.trace({
    action: "Verify Channel ID is Present",
    location: `'hasChannelID' in ${__dirname}`,
  });

  /* Get channel ID from query parameters */
  const { channel_id } = request.query;

  /* Error message snippet for formatting purposes */
  const errorQuery = "?channel_id=<channel ID>";

  /* If no channel ID, return an error */
  if (!channel_id)
    next({
      status: 400,
      message: `Channel ID missing! Please enter it as a query parameter as follows: ${errorQuery}`,
    });

  /* Continue */
  logger.info({
    action: "Channel ID is Present",
    location: `'hasChannelID' in ${__dirname}`,
  });

  /* Store new channel ID in memory and continue */
  response.locals.channel_id = channel_id;
  next();
}

/**
 * Verify that the user-provided channel ID is new,
 * and not the same as the previously saved ID
 * Will "quick continue" if entry was not found
 * in DB
 */
function channelIDisNew(request, response, next) {
  logger.trace({
    action: "Verify Channel ID is New",
    location: `'channelIDisNew' in ${__dirname}`,
    notes: ["Will 'quick continue' if entry not found in DB"],
  });

  /* Quick continue if announcement not found in DB */
  if (response.locals.announcement === null) {
    logger.info({
      action: "No Entry found in DB - Continue to Next Middleware Early",
      location: `'channelIDisNew' in ${__dirname}`,
    });
    next();
  } else {
    const oldID = response.locals.announcement.channel_id;
    const newID = response.locals.channel_id;

    if (oldID == newID)
      next({
        status: 202,
        message: `Channel ID is the same as previous ID. No changes.`,
      });

    /* Channel ID confirmed new, continue */
    logger.info({
      action: "Channel ID Confirmed New",
      location: `'channelIDisNew' in ${__dirname}`,
      notes: [`New Channel ID: ${newID}`],
    });
    next();
  }
}
// #endregion Set Announcement Channel for a Discord Server

// #region Get Announcement Channel
/**
 * Mainly just used as validation that an announcement
 * channel has been set by the user
 * @returns {Object} announcement channel information
 */
function getAnnouncementChannel(request, response) {
  logger.info({
    action: "Return Announcement Object",
    location: `"getAnnouncementChannel" in ${__dirname}`,
  });

  /* Get announcement object from memory */
  const { announcement } = response.locals;

  response.status(200).json({ data: announcement });
}
// #endregion Get Announcement Channel

// #region Add New Twitch Broadcaster Subscription for a Discord Server
/**
 * Sends INSERT request to DB with new
 * subscription
 * @returns Status code and JSON object
 */
async function createNewLogEntry(request, response) {
  /* Retrieve subscription information from memory */
  const { broadcaster_id } = response.locals;
  const { guild_id } = response.locals.announcement;

  /* Set up new subscription object to be inserted into DB */
  const subscription = {
    guild_id,
    broadcaster_id,
  };

  /* Send INSERT query */
  const newLogEntry = await service.createSubscription(subscription);

  /* Respond to user with result */
  response.status(201).json({ data: await newLogEntry });
}

/**
 * Checks request query parameters for
 * broadcaster ID
 */
function hasBroadcasterID(request, response, next) {
  logger.trace({
    action: "Verify Broadcaster ID is Present",
    location: `'hasBroadcasterID' in ${__dirname}`,
  });

  /* Get broadcaster ID from query parameters */
  const { broadcaster_id } = request.query;

  /* Error message snippet for formatting purposes */
  const errorQuery = "?broadcaster_id=<broadcaster ID>";

  /* If no broadcaster ID, return an error */
  if (!broadcaster_id)
    next({
      status: 400,
      message: `Broadcaster ID missing! Please enter it as a query parameter as follows: ${errorQuery}`,
    });

  /* Continue */
  logger.info({
    action: "Broadcaster ID is Present",
    location: `'hasBroadcasterID' in ${__dirname}`,
    notes: [`Broadcaster ID: ${broadcaster_id}`],
  });

  response.locals.broadcaster_id = broadcaster_id;
  next();
}

/**
 * Verifies that the subscription request
 * will not create a duplicate entry in the
 * database
 */
async function isNotDuplicateSub(request, response, next) {
  logger.trace({
    action: "Check for Duplicate Subscription",
    location: `'isNotDuplicateSub' in ${__dirname}`,
  });

  const { guild_id } = request.params;
  const { broadcaster_id } = response.locals;

  const checkSubscription = await service.readSub(guild_id, broadcaster_id);

  if (checkSubscription) {
    next({
      status: 409,
      message: `There is already a subscription in that guild for broadcaster '${broadcaster_id}'`,
    });
  } else {
    logger.info({
      action: "No Duplicate Subscription Found",
      location: `'isNotDuplicateSub' in ${__dirname}`,
      notes: [`${JSON.stringify(checkSubscription, null, 2)}`],
    });
    next();
  }
}
// #endregion Add New Twitch Broadcaster Subscription for a Discord Server

// #region Get All Channels for Given Broadcaster ID
/**
 * Retrieves all related channel IDs
 * from the "subscriptions" table in DB
 * for a given broadcaster ID
 * @returns {Array} Channel IDs
 */
async function listChannelIDs(request, response) {
  /* Get broadcaster ID */
  const { broadcaster_id } = response.locals;

  logger.trace({
    action: "Get All Channel IDs for Given Broadcaster ID",
    location: `'listChannelIDs' in ${__dirname}`,
  });

  /* Retrieve all related channel IDs */
  const channelIDs = await service.listSubsForBroadcaster(broadcaster_id);

  logger.info({
    action: "Get All Channel IDs for Given Broadcaster ID",
    location: `'listChannelIDs' in ${__dirname}`,
    notes: [
      `Broadcaster ID: ${broadcaster_id}`,
      `Related Channel IDs: ${JSON.stringify(await channelIDs, null, 2)}`,
    ],
  });

  /* Respond with array and status 200 OK */
  response.status(200).json({ data: await channelIDs });
}
// #endregion Get All Channels for Given Broadcaster ID

// #region Destroy a Subscription
async function destroySub(request, response) {
  const { guild_id } = request.params;
  const { broadcaster_id } = response.locals;

  /* Send delete request */
  await service.unsubscribe(guild_id, broadcaster_id);

  /* Respond with Success code 204 (No Content) */
  response.sendStatus(204);
}
// #endregion Destroy a Subscription

// #region List Active Subscriptions for a Guild
async function listSubs(request, response) {
  const { guild_id } = request.params;

  const broadcasterIDs = await service.listSubsByGuild(guild_id);

  logger.info({
    action: "Get All Subscriptions for a Guild",
    location: `'listSubs' in ${__dirname}`,
    notes: [
      `Broadcaster IDs: ${JSON.stringify(await broadcasterIDs, null, 2)}`,
    ],
  });

  response.status(200).json({ data: await broadcasterIDs });
}
// #endregion List Active Subscriptions for a Guild

module.exports = {
  eventsub: [verifySignature, requestRouter],
  createSub: [
    verifyInternalToken,
    hasBroadcasterID,
    asyncErrorBoundary(isNotDuplicateSub),
    asyncErrorBoundary(announcementExists),
    verifyAnnouncementResult,
    asyncErrorBoundary(createNewLogEntry),
  ],
  setAnnounce: [
    verifyInternalToken,
    hasChannelID,
    asyncErrorBoundary(announcementExists),
    channelIDisNew,
    asyncErrorBoundary(setAnnouncement),
  ],
  getAnnounce: [
    verifyInternalToken,
    asyncErrorBoundary(announcementExists),
    verifyAnnouncementResult,
    getAnnouncementChannel,
  ],
  getChannels: [verifyInternalToken, hasBroadcasterID, listChannelIDs],
  destroySub: [
    verifyInternalToken,
    hasBroadcasterID,
    asyncErrorBoundary(destroySub),
  ],
  listSubs: [verifyInternalToken, asyncErrorBoundary(listSubs)],
};
