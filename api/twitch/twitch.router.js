const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./twitch.controller");

/**
 * Valid routes and methods
 * @route /callback
 * Valid methods: [GET, POST]
 * ============================
 * GET - webhook callback route provided to Twitch
 * POST - Twitch notifications to be recieved
 * ============================
 * ALL - methodNotAllowed simply states that
 * requested method is not allowed at this URI
 */
router.route("/callback").post(controller.eventsub).all(methodNotAllowed);

/**
 * Valid routes and methods
 * @route /subscriptions/:guild_id
 * Valid methods: [GET, POST, DELETE]
 * ============================
 * GET - Get all active subscriptions for a given server
 * POST - Log a new subscrition to DB
 * DELETE - Remove an active subscription from DB
 * ============================
 * ALL - methodNotAllowed simply states that
 * requested method is not allowed at this URI
 */
router
  .route("/subscriptions/:guild_id")
  .get(controller.listSubs)
  .post(controller.createSub)
  .delete(controller.destroySub)
  .all(methodNotAllowed);

/**
 * Valid routes and methods
 * @route /announcements/:guild_id
 * Valid methods: [GET, PUT]
 * ============================
 * GET - Get announcement channel by guild ID
 * PUT - Add or Update a guild's announcement channel ID
 * ============================
 * ALL - methodNotAllowed simply states that
 * requested method is not allowed at this URI
 */
router
  .route("/announcements/:guild_id")
  .get(controller.getAnnounce)
  .put(controller.setAnnounce)
  .all(methodNotAllowed);

/**
 * Valid routes and methods
 * @route /announcements
 * Valid methods: [GET]
 * ============================
 * GET - Get all channel IDs for given broadcaster ID (?broadcaster_id=)
 * ============================
 * ALL - methodNotAllowed simply states that
 * requested method is not allowed at this URI
 */
router
  .route("/announcements")
  .get(controller.getChannels)
  .all(methodNotAllowed);

module.exports = router;
