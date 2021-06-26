require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const notFound = require("./api/errors/notFound");
const errorHandler = require("./api/errors/errorHandler");

const app = express();

// API routers
const twitchRouter = require("./api/twitch/twitch.router");

const fs = require("fs");
const Discord = require("discord.js");
const Logger = require("./lib/logger");

/* Get defined log level and instantiate a new logger */
const { LOG_LEVEL } = process.env;

const logger = new Logger(LOG_LEVEL);

/* const app = require("./api/app"); */

const { prefix } = require("./resources/config.json");
const { bot_token, PORT = 3000, INTERNAL_ACCESS_TOKEN } = process.env;
const { channelID, guildID } = require("./resources/announcementConfig.json");

/* Initialize discord client */
const client = new Discord.Client();

/* Initialize valid commands and cooldowns for client */
client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();

/* Collect list of all command folders/categories */
const commandFolders = fs.readdirSync("./commands");

/* Collect each command from every folder */
commandFolders.forEach((folder) => {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter((file) => file.endsWith(".js"));

  /* Map each command to a list for use */
  commandFiles.forEach((file) => {
    const command = require(`./commands/${folder}/${file}`);
    client.commands.set(command.name, command);
  });
});

/**
 * Bot startup
 * Includes:
 * - Server listener for event subs and API endpoints
 * - Locates announcements channel
 */
client.on("ready", () => {
  console.log("Ready to work!");

  const listener = app.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}!`);
  });
});

/**
 * Chat message listener
 * Handles commands and general
 * logic regarding them
 */
client.on("message", (message) => {
  /* Ignore messages without the recognized prefix */
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  /* Retrieve command + any user arguments from sent message */
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  /* Check if the command exists/is valid */
  if (!client.commands.has(commandName)) return;

  /* Retrieve the requested command function from our commands list */
  const command = client.commands.get(commandName);

  /* Get "commands on cooldown" list from the client */
  const { cooldowns } = client;

  /* Set command on cooldown (if it has a universal use cooldown) */
  if (!cooldowns.has(command.name))
    cooldowns.set(command.name, new Discord.Collection());

  /* Establish cooldown duration and expiration for current execution */
  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000; // convert to seconds from ms

  /* Check if the user is currently on "command cooldown" */
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        `please wait ${timeLeft.toFixed(
          1
        )} more second(s) before reusing the \`${command.name}\` command.`
      );
    }
  }

  /* Command will execute - set user on a short timeout to prevent command spam */
  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  /* Execute the command - throw an error if anything goes wrong */
  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply(`There was an error trying to execute ${commandName}`);
  }
});

/* Login bot using token */
client.login(bot_token);

/**
 * API INSTANTIATION - not how I would normally have formatted this
 * =============================================================================
 * API routes and declarations were originally in their own file, however there
 * were issues utilizing the discord 'client' object outside of this file,
 * and so to avoid those issues and any circular dependencies, the highest
 * level of the API is in this file.
 */

/* Body parser to utilize raw body bytes for Twitch signature verification */
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

/* Route handler for Twitch EventSub */
app.use("/twitch", twitchRouter);

/* Baseline JSON parsing for additional routes */
app.use(express.json());

/* Handle internal POST request to send a discord notification */
app.post("/discord/twitch", verifyInternalToken, (request, response) => {
  logger.info({
    action: "Send payload to Discord for embed/notification",
    location: __dirname,
    status: 202,
  });

  /* Let requester know of success */
  response.sendStatus(202);

  /* Destructure "event" object from payload */
  const { event } = request.body;

  /* Proceed to embed message function */
  twitchLive(event);
});

/* API error handlers */
app.use(notFound);
app.use(errorHandler);

/* Validates the token received on requests to this API */
function verifyInternalToken(request, response, next) {
  logger.trace({
    action: "Validate token for authorization",
    location: `'verifyInternalToken' in ${__dirname}`,
  });

  /* Retrieve authorization header for verification */
  const authHeader = request.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  /* Send an error if no token */
  if (token == null)
    next({
      status: 401,
      message: "No authorization token",
    });

  /* Verify token matches */
  if (token !== INTERNAL_ACCESS_TOKEN) {
    next({
      status: 403,
      message: "Invalid authorization token",
    });
  }

  logger.info({
    action: "Internal signature verification success",
    location: `${request.method} to ${request.originalUrl}`,
  });

  /* Continue if no issues */
  next();
}

/**
 * Takes in useful payload information
 * from Twitch live notification (EventSub)
 * Processes information into a useful, concise embed
 * for Discord
 * @param {Object} event
 */
function twitchLive(event) {
  try {
    /* Twitch's "lilac" color */
    const embedColor = "#B9A3E3";

    /* Get useful event information from payload data */
    const { broadcaster_user_login, broadcaster_user_name, started_at } = event;

    /* Embed author name */
    const embedAuthor = "TheChosenWaffle's Discord Bot";

    /* Create stream title from user name */
    const streamTitle = `${broadcaster_user_name} is live NOW on Twitch!`;

    /* Create stream URL from user login */
    const streamURL = `https://www.twitch.tv/${broadcaster_user_login}`;

    /* Format day and time information for stream start */
    const liveDate = new Date(started_at);
    const streamDay = liveDate.toDateString();
    const streamTime = liveDate.toTimeString();

    /* Twitch logo URL */
    const twitchLogo = "https://i.imgur.com/esBdzQP.png";

    /* Create the embed message for the announcement channel */
    const twitchEmbed = new Discord.MessageEmbed()
      .setColor(embedColor)
      .setTitle(streamTitle)
      .setURL(streamURL)
      .setAuthor(embedAuthor)
      .setThumbnail(twitchLogo)
      .addFields(
        { name: "\u200B", value: "\u200B" },
        { name: "Stream Date:", value: streamDay },
        { name: "Stream Start Time:", value: streamTime }
      );

    /* Send the embed message to the announcements channel by channel ID */
    client.channels.cache.get(`${channelID}`).send(twitchEmbed);

    logger.info({
      action: "Send a Discord notification for a Twitch notificaiton",
      location: `'twitchLive' in ${__dirname}`,
      notes: [
        `Payload data: ${event}`,
        `Send message to channel '${channelID}' in guild '${guildID}'`,
      ],
    });
  } catch (error) {
    logger.warn({
      action: "Send a Discord notification for a Twitch notificaiton FAILURE",
      location: `'twitchLive' in ${__dirname}`,
      notes: [
        `Payload data: ${event}`,
        `Send message to channel '${channelID}' in guild '${guildID}'`,
        `Error Message: ${error}`,
      ],
    });
  }
}
