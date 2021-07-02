const Logger = require("./logger");

const axios = require("axios");

const { LOG_LEVEL, INTERNAL_ACCESS_TOKEN, NODE_ENV } = process.env;

const BASE_URL =
  NODE_ENV === "development"
    ? process.env.DEV_BASE_URL
    : process.env.PROD_BASE_URL;

const logger = new Logger(LOG_LEVEL);

class NotifyDiscord {
  /**
   * Takes in useful payload information
   * from Twitch live notification (EventSub)
   * Processes information into a useful, concise embed
   * for Discord
   * @param {Object} event
   */
  static twitch(event) {
    logger.trace({
      action: "Send a Discord notification for a Twitch notificaiton",
      location: `'twitch' in ${__dirname}`,
      notes: [
        `Payload data: ${event}`,
        `Encrypt info and send internal server request`,
      ],
    });

    /* Set headers with auth token */
    const headers = {
      Authorization: `Bearer ${INTERNAL_ACCESS_TOKEN}`,
    };

    /* Send POST request to internal URL with Twitch event info */
    axios
      .post(`${BASE_URL}discord/twitch`, { event }, { headers })
      .then((response) => {
        logger.info({
          action: "Successfully sent request to server",
          location: `'notifyDiscord' in ${__dirname}`,
        });
      })
      .catch((error) => {
        logger.warn({
          action: "Error sending request to server",
          location: `'notifyDiscord' in ${__dirname}`,
          notes: [`Axios Error: ${error}`],
        });
      });
  }
}

module.exports = NotifyDiscord;
