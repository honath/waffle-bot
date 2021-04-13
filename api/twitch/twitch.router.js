const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./twitch.controller");

/**
 * Valid routes and methods
 * @route /webhooks/callback
 * Valid methods: [post]
 */
router.route("/webhooks/callback").get(controller.subscribe).all(methodNotAllowed);

module.exports = router;