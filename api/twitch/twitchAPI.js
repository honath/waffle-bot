const axios = require("axios");
const Logger = require("../../lib/logger");

/* Get defined log level and instantiate a new logger */
const { LOG_LEVEL } = process.env;

const logger = new Logger(LOG_LEVEL);

/* Twitch URL for all EventSub API requests */
const EVENTSUB_URL = "https://api.twitch.tv/helix/eventsub/subscriptions";

/* Twitch identification and signing secret for this application */
const { TWITCH_CLIENT_ID, TWITCH_SECRET } = process.env;

/**
 * Takes in the URL of the internal API for HTTPS requests
 * and the Twitch channel username to set up the
 * webhook subscription service
 * @param {String} BASE_URL Internal Service API URL
 * @param {String} name Twitch channel to subscribe to
 */
async function subscribeToTwitchEvents(BASE_URL, name) {
  logger.info({
    action: "Initiate EventSub subscription",
    location: `'subscribeToTwitchEvents' in ${__dirname}`,
    notes: [`EventSub for channel '${name}'`],
  });

  /* Retrieve Twitch Access Token */
  const ACCESS_TOKEN = await retrieveAccessToken();

  /* Proceed if ACCESS_TOKEN is not rejected */
  if ((await ACCESS_TOKEN) !== "") {
    /* Set axios request headers */
    const headers = {
      "Client-ID": TWITCH_CLIENT_ID,
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    };

    /* Get Twitch User ID by channel name */
    const twitchUserID = await retrieveUserID(name, headers);

    /* Proceed if Twitch User ID is successfully retrieved */
    if ((await twitchUserID) !== "") {
      /**
       * Set request body for event sub POST request
       * Keys and values set up as specified by Twitch WebHook documentation
       * 'version' - The version of the subscription type that is being created
       * 'type' - The category of the subscription that is being created.
       * 'condition' - JSON object containing custom parameters for a particular subscription
       *    + 'broadcaster_user_id' - The broadcaster user ID you want to get stream online notifications for
       * 'transport' - JSON object containing notification delivery specific configuration
       *    + 'method' - Only valid transport method is "webhook" currently
       *    + 'callback' - URL for Twitch to respond to (our URL)
       *    + 'secret' - Twitch signing secret for this client
       */
      const data = {
        version: "1",
        type: "stream.online",
        condition: {
          broadcaster_user_id: twitchUserID,
        },
        transport: {
          method: "webhook",
          callback: `${BASE_URL}twitch/callback`,
          secret: TWITCH_SECRET,
        },
      };

      /**
       * Send a POST request to Twitch subscription
       * with request data
       * and headers as defined by documentation
       * If successful, internal API will recieve a request at:
       * `${BASE_URL}twitch/callback`
       */
      await axios
        .post(EVENTSUB_URL, data, { headers })
        .then((response) => {
          logger.info({
            action: "EventSub Subscription Success",
            location: `'subscribeToTwitchEvents' in ${__dirname}`,
            status: response.status,
          });
        })
        .catch((error) => {
          logger.error({
            action: "EventSub Subscription Success",
            location: `'subscribeToTwitchEvents' in ${__dirname}`,
            status: error.status,
            notes: [`Error: ${error}`],
          });
        })
        .finally(revokeAccessToken(ACCESS_TOKEN));
    } else {
      /* Cleanup access token if User ID is not retrieved */
      await revokeAccessToken(ACCESS_TOKEN);
    }
  }

  /* Exit */
  return;
}

/**
 * Sends a POST request to Twitch's API
 * to retrieve an access token
 * @returns Twitch Access Token
 */
function retrieveAccessToken() {
  logger.trace({
    action: "Retrieve Access Token",
    location: `'retrieveAccessToken' in ${__dirname}`,
  });

  /* Twitch base URL for retrieving oauth token*/
  const AUTH_URL = "https://id.twitch.tv/oauth2/token";

  /* URI to send POST request to */
  const POST_URL = `${AUTH_URL}?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_SECRET}&grant_type=client_credentials`;

  /* POST request to URI as defined by Twitch webhook documentation */
  return axios
    .post(POST_URL)
    .then((response) => {
      /* Access Token and expiration (in seconds) from response object */
      const ACCESS_TOKEN = response.data.access_token;

      logger.info({
        action: "Access Token Retrieval Success",
        location: `'retrieveAccessToken' in ${__dirname}`,
        status: response.status,
      });

      /* Return the access token to originating function */
      return ACCESS_TOKEN;
    })
    .catch((error) => {
      logger.error({
        action: "Access Token Retrieval Failure",
        location: `'retrieveAccessToken' in ${__dirname}`,
        status: error.status,
        notes: [`Error: ${error}`],
      });

      /* Return empty to exit subscription process early */
      return "";
    });
}

/**
 * Takes in a Twitch OAuth token
 * and sends an API request to revoke
 * said token.
 *
 * Functions as "cleanup"
 * @param {String} token
 */
function revokeAccessToken(token) {
  logger.trace({
    action: "Revoke OAuth Token",
    location: `'revokeAccessToken' in ${__dirname}`,
  });

  /* Twitch base URL for revoking all oauth token*/
  const REVOKE_URL = "https://id.twitch.tv/oauth2/revoke";

  /* POST request to URI as defined by Twitch API documentation */
  axios
    .post(`${REVOKE_URL}?client_id=${TWITCH_CLIENT_ID}&token=${token}`)
    .then((response) => {
      logger.info({
        action: "Access Token Revocation Success",
        location: `'revokeAccessToken' in ${__dirname}`,
        status: response.status,
      });
    })
    .catch((error) => {
      logger.error({
        action: "Access Token Revocation Failure",
        location: `'revokeAccessToken' in ${__dirname}`,
        notes: [error],
      });
    });
}

/**
 * Sends a GET request to Twitch's
 * User ID URI to retrieve a
 * channel's ID by channel username
 * @param {String} name
 * @returns User ID or empty string
 */
function retrieveUserID(name, headers) {
  logger.trace({
    action: "Get User ID from Twitch API",
    location: `'retrieveUserID' in ${__dirname}`,
  });

  /* Twitch base URL for retrieving user ID */
  const USER_URL = "https://api.twitch.tv/helix/";

  /* GET request to URI as defined by Twitch API documentation */
  return axios
    .get(`${USER_URL}users?login=${name}`, { headers })
    .then((response) => {
      logger.info({
        action: "User ID Retrieval Success",
        location: `'retrieveUserID' in ${__dirname}`,
        status: response.status,
        notes: [`For Username: ${name}`],
      });

      /* Retrieve Twitch User ID from response object */
      const twitchUserID = response.data.data[0].id;

      return twitchUserID;
    })
    .catch((error) => {
      logger.error({
        action: "User ID Retrieval Failure",
        location: `'retrieveUserID' in ${__dirname}`,
        status: error.status,
        notes: [`Error: ${error}`],
      });

      /* Return empty to exit subscription process early */
      return "";
    });
}

/**
 * DEBUGGER FUNCTION
 * =================
 * Retrieves all active subscriptions
 * that this client has with Twitch's
 * WebHook API, and outputs to console
 */
async function debugSubs(token = null) {
  logger.trace({
    action: "Check for active subscriptions",
    location: `'debugSubs' in ${__dirname}`,
  });

  /**
   * Retrieve access token from API *if*
   * this function is not being called by
   * another function (token is not null)
   */
  const ACCESS_TOKEN = token === null ? await retrieveAccessToken() : token;

  /* Set axios request headers */
  const headers = {
    "Client-ID": TWITCH_CLIENT_ID,
    Authorization: `Bearer ${await ACCESS_TOKEN}`,
  };

  /* Storage for all subscription IDs */
  const subIDs = [];

  // Retrieve all active subscriptions with Twitch EventSub
  await axios
    .get(EVENTSUB_URL, { headers })
    .then((response) => response.data)
    .then((response) => {
      /* Format logging string for listing active subs */
      const subsList =
        response.data.length > 0
          ? `Active Subs: ${JSON.stringify(response.data, null, 2)}`
          : `No Active Subscriptions`;

      logger.info({
        action: "Active Subs Retrieval Success",
        location: `'debugSubs' in ${__dirname}`,
        status: response.status,
        notes: [subsList],
      });

      /* Map sub IDs to subIDs variable from response */
      response.data.forEach((sub) => {
        subIDs.push(sub.id);
      });
    })
    .catch((error) => {
      logger.error({
        action: "Active Subs Retrieval Failure",
        location: `'debugSubs' in ${__dirname}`,
        status: error.status,
        notes: [`Error: ${error}`],
      });
    })
    .finally(revokeAccessToken(ACCESS_TOKEN));

  /* Return all sub IDs for use in 'cancelSubscriptions' - does nothing otherwise */
  return subIDs;
}

/**
 * DEBUGGER FUNCTION
 * =================
 * Gets all active sub IDs via 'debugSubs'
 * Sends a delete request for each one to Twitch
 */
async function cancelSubscriptions() {
  logger.trace({
    action: "Cancel active subscriptions",
    location: `'cancelSubscriptions' in ${__dirname}`,
  });

  /* Retrieve Access Token  */
  const ACCESS_TOKEN = await retrieveAccessToken();

  /* Set axios request headers */
  const headers = {
    "Client-ID": TWITCH_CLIENT_ID,
    Authorization: `Bearer ${await ACCESS_TOKEN}`,
  };

  /* Get all subscription IDs */
  const subIDs = await debugSubs(await ACCESS_TOKEN);

  /* Send delete requests for each subscription ID */
  await subIDs.forEach(async (id) => {
    await axios
      .delete(`${EVENTSUB_URL}?id=${id}`, { headers })
      .then((response) => {
        logger.debug({
          action: "Active Subs Cancellation Success",
          location: `'cancelSubscriptions' in ${__dirname}`,
          status: response.status,
        });
      })
      .catch((error) => {
        logger.debug({
          action: "Active Subs Cancellation Failure",
          location: `'cancelSubscriptions' in ${__dirname}`,
          status: error.status,
          notes: [`Error: ${error}`],
        });
      })
      .finally(revokeAccessToken(ACCESS_TOKEN));
  });

  /* Exit */
  return;
}

module.exports = {
  subscribeToTwitchEvents,
  debugSubs,
  cancelSubscriptions,
};
