const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./twitch.controller");

/**
 * Valid routes and methods
 * @route /webhooks/callback
 * Valid methods: [GET, POST]
 * ============================
 * GET - webhook callback route provided to Twitch
 * POST - Twitch notifications to be recieved
 * ============================
 * ALL - methodNotAllowed simply states that request
 * method is not allowed at this URI
 */
router
  .route("/callback")
  .post(controller.subscribe)
  .all(methodNotAllowed);

module.exports = router;
