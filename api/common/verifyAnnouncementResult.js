const Logger = require("../../lib/logger");

/* Get defined log level and instantiate a new logger */
const { LOG_LEVEL } = process.env;

const logger = new Logger(LOG_LEVEL);

/**
 * Mainly used for validation elsewhere
 * Process the result of previous middleware
 * "announcementExists"
 */
function verifyAnnouncementResult(request, response, next) {
  logger.trace({
    action: "Process Announcement Fetch Result",
    location: `"verifyAnnouncementResult" in ${__dirname}`,
  });

  /* Get announcement object from memory */
  const { announcement } = response.locals;

  if (announcement === null)
    next({
      status: 400,
      message: "You must set an announcement channel first!",
    });

  /* Respond with success if exists */
  logger.trace({
    action: "Announcement Exists",
    location: `"verifyAnnouncementResult" in ${__dirname}`,
  });
  next();
}

module.exports = verifyAnnouncementResult;