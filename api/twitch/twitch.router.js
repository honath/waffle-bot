const router = require("express").Router();
const controller = require("./twitch.controller");

router.route("/callback").post(controller.subscribe);

module.exports = router;