require("dotenv").config();
const express = require("express");
const notFound = require("./errors/notFound");
const errorHandler = require("./errors/errorHandler");
const subscriptionRouter = require("./subscriptionRouter");
const app = express();
const twitchSigningSecret = process.env.TWITCH_SIGNING_SECRET;

// JSON config files
const subscriptions = require("./subscriptions.json");

// API routers
const twitchRouter = require("./twitch/twitch.router");

// Calls subscription functions if not currently subscribed to web events
if (!subscriptions.twitch) subscriptionRouter("twitch");
//if (!subscriptions.youtube) subscriptionRouter("youtube");

// Routes
app.use("/twitch", twitchRouter);

// Errors
app.use(notFound);

app.use(errorHandler);

module.exports = app;
