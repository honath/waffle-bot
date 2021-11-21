require("dotenv").config();

/* Internal API imports */
const express = require("express");
const bodyParser = require("body-parser");
const notFound = require("./api/errors/notFound");
const errorHandler = require("./api/errors/errorHandler");
const verifyInternalToken = require("./api/common/verifyAuthToken");

/* App instantiation */
const app = express();

// API routers
const twitchRouter = require("./api/twitch/twitch.router");

/* Class Imports */
const fs = require("fs");
const Discord = require("discord.js");
const Logger = require("./lib/logger");

/* Get defined log level and instantiate a new logger */
const { LOG_LEVEL } = process.env;
const logger = new Logger(LOG_LEVEL);

/* Internal/Callback URL based on dev/production environment */
const environment = process.env.NODE_ENV || "development";

const BASE_URL =
  environment === "development"
    ? process.env.DEV_BASE_URL
    : process.env.PROD_BASE_URL;

/* Other general imports */
const { prefix } = require("./resources/config.json");
const { BOT_TOKEN, PORT = 3000, INTERNAL_ACCESS_TOKEN } = process.env;
const { default: axios } = require("axios");

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
client.login(BOT_TOKEN);

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

/* Baseline JSON parsing */
app.use(express.json());

/* Route handler for Twitch EventSub */
app.use("/twitch", twitchRouter);

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

  logger.trace({
    action: "Log Event Object",
    location: "API route /discord/twitch",
    notes: [event],
  });

  /* Proceed to embed message function */
  twitchLive(event);
});

/* API error handlers */
app.use(notFound);
app.use(errorHandler);

/**
 * Takes in useful payload information
 * from Twitch live notification (EventSub)
 * Processes information into a useful, concise embed
 * for Discord
 * @param {Object} event
 */
async function twitchLive(event) {
  try {
    /* Twitch's "lilac" color */
    const embedColor = "#B9A3E3";

    /* Get useful event information from payload data */
    const {
      broadcaster_user_id,
      broadcaster_user_login,
      broadcaster_user_name,
      started_at,
    } = event;

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

    logger.trace({
      action: "Log Discord Embed Object",
      location: `'twitchLive' in ${__dirname}`,
      notes: [`${twitchEmbed}`],
    });

    /* Internal URL to GET all channel IDs for related broadcaster */
    const GET_URL = `${BASE_URL}twitch/announcements?broadcaster_id=${broadcaster_user_id}`;

    /* Set headers with auth token */
    const headers = {
      Authorization: `Bearer ${INTERNAL_ACCESS_TOKEN}`,
    };

    /* Retrieve all channel IDs */
    await axios
      .get(await GET_URL, { headers })
      .then((response) => {
        logger.info({
          action: "Get All Channel IDs Success",
          location: `'twitchLive' in ${__dirname}`,
          status: response.status,
          notes: [JSON.stringify(response.data, null, 2)],
        });

        /* Format response to account for Axios "data" nesting */
        return response.data.data;
      })
      .then((channel_IDs) => {
        /* Cycle through channel IDs and send notification */
        channel_IDs.forEach(({ channel_id }) => {
          /**
           * TODO: handle what happens when a discord bot is no longer part
           * of a server, DEL request for DB. Test with heroku, to see if this
           * is even an issue yet
           */

          /* Send the embed message to the announcements channel by channel ID */
          client.channels
            .fetch(`${channel_id}`)
            .then((channel) => channel.send("@everyone", twitchEmbed))
            .catch((error) => {
              logger.error({
                action: "Fetch Channel ID",
                location: `'twitchLive' in ${__dirname}`,
                notes: [`Error: ${error}`],
              });
            });
        });
      })
      .then(() => {
        /* Success! */
        logger.info({
          action: "Send a Discord notification for a Twitch notification",
          location: `'twitchLive' in ${__dirname}`,
          notes: [
            `Payload data: ${JSON.stringify(event, null, 2)}`,
            `All messages sent!`,
          ],
        });
      })
      .catch((error) => {
        logger.error({
          action: "Get All Channel IDs Failure",
          location: `'twitchLive' in ${__dirname}`,
          status: error.status,
          notes: [`Error: ${error.message}`],
        });
      });
  } catch (error) {
    logger.error({
      action: "Send a Discord notification for a Twitch notificaiton FAILURE",
      location: `'twitchLive' in ${__dirname}`,
      notes: [
        `Payload data: ${JSON.stringify(event, null, 2)}`,
        `Error Message: ${error}`,
      ],
    });
  }
}
