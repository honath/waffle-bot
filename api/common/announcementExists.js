/* Database Query import */
const service = require("../twitch/twitch.service");

const Logger = require("../../lib/logger");

/* Get defined log level and instantiate a new logger */
const { LOG_LEVEL } = process.env;

const logger = new Logger(LOG_LEVEL);

/**
 * Query the DB to check if
 * the entry already exists
 * Announcement set to "null"
 * in response.locals if no
 * matching entry found in DB
 */
async function announcementExists(request, response, next) {
  logger.trace({
    action: "Verify Announcement Exists",
    location: `'announcementExists' in ${__dirname}`,
  });

  /* Get guild ID from route parameters */
  const { guild_id } = request.params;

  const announcement = await service.readAnnouncement(guild_id);

  if (!announcement) {
    /* Announcement not found, this is a new entry */
    logger.info({
      action: "Announcement Not Found in DB",
      location: `'announcementExists' in ${__dirname}`,
    });

    /* Set announcement object as "null" for quick continue */
    response.locals.announcement = null;
    next();
  } else {
    /* Announcement found, this is an update */
    logger.info({
      action: "Announcement Found in DB",
      location: `'announcementExists' in ${__dirname}`,
      notes: [`Announcement Object: ${JSON.stringify(announcement, null, 2)}`],
    });

    /* Store announcement object from DB in memory and continue */
    response.locals.announcement = announcement;
    next();
  }
}

module.exports = announcementExists;
