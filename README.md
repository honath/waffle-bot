# WaffleBot Discord Bot

## Overview

**CURRENTLY ONLY OPERATES LOCALLY/MUST BE HOSTED LOCALLY**

Lightweight discord bot for personal use. Subscribes to [Twitch's EventSub](https://dev.twitch.tv/docs/eventsub) services to alert a Discord server and (planned) send out Tweets on user's behalf, when a subscription notification is received.

## General Usage

- For a list of commands within Discord, just type "!help" in any channel where the bot can see messages.
- If you want more specific information on a single command, type "!help" followed by the command you'd like more information on. (EX: "!help help")
- Scroll down further for a quick setup guide for making use of the Twitch subscription service!

## Functionality

- Helpful, basic moderation commands within Discord
- Subscription via Twitch EventSub - get notifications when your favorite streamers come online!

## Planned Additions

- Connect to Twitter to announce when stream is live
- Connect to YouTube to announce when a video is uploaded or stream is live
- Role management
- Fun stuff, maybe.

## Twitch EventSub Usage

### 1. Set the discord channel where you would like the announcements to go, and type !announce (requires Admin privileges)

| Find the Channel                                            | Type "!announce"                                         |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| ![Find the channel](./resources/images/announcechannel.png) | ![Type "!announce"](./resources/images/typeannounce.png) |

### 2. Find the Twitch "login" username of the streamer you wish to subscribe to

![Where to find the Twitch User Login](./resources/images/twitchusername.png)

###### (This will be in the URL on Twitch)

### 3. In any channel where the bot can see messages, type this command followed by the username found in Step 2: "!subtwitch"

![Type the subscription message](./resources/images/submessage.png)

### 4. That's it! When that streamer goes live, the bot will receive a notification, and send a message to your preset announcements channel!

![Streamer is live!](./resources/images/streamannounce.png)

## File Structure

- `./`
  - **bot.js** (main file - also contains base API/server functions)
  - **.env** (tokens, keys, URLs, etc. Git Ignored)
  - `./commands`
    - `./commands/moderation`
      - **kick.js** (Kick a user via command. Moderator+ only.)
      - **ban.js** (Ban a user via command. Moderator+ only.)
      - **timeout.js** (Remove a user's ability to chat for 10 min via command. Moderator+ only.)
    - `./commands/subscriptions`
      - **cancelSubs.js** (cancels all active Twitch subscriptions. Admin only.)
      - **subToTwitch.js** (Subscribes to a Twitch channel for stream notifications. Admin only.)
      - **twitchDebug.js** (Lists all active subscriptions in the console. Admin only.)
    - `./commands/utility`
      - **help.js** (Help command, lists all commands in bot-**commands.json** intelligently)
      - **setAnnounceChannel.js** (Sets current channel where message is sent as the default "announcements" channel.)
    - `./commands/testing` (Testing/developer commands. Git ignored)
  - `./resources`
    - **config.json** (Stores bot prefix + some possibly deprecated URIs)
    - **announcementConfig.json** (Stores guild and channel IDs for announcements)
    - `./resources/images`
      - general images for use in README
  - `./api`
    - **subscriptionRouter.js** (Verbose, scalable router for subscribing to external services)
    - `./api/twitch`
      - **twitch.router.js** (handles Twitch API routes)
      - **twitch.controller.js** (API endpoints for Twitch HTTP requests)
      - **twitchAPI.js** (Handles outgoing requests made to Twitch API for accessing and retrieving data and EventSub subscriptions)
    - `./api/errors`
      - **notFound.js** (sends custom 404 not found to error handler)
      - **methodNotAllowed.js** (sends custom 405 not allowed to error handler)
      - **errorHandler.js** (all purpose error handler/wrapper. Takes in status code and message)
  - .`/lib`
    - **logger.js** (Logging/debugging class for use in console messages)
    - **notifyDiscord.js** (Notification class for sending Discord notifications, methods for notification origin)

## Links

- I'd really appreciate it if you checked me out on [Twitch](https://www.twitch.tv/dachosenwaffle), [Twitter](https://twitter.com/thechosenwaffle), or [YouTube](https://www.youtube.com/c/ChosenWaffle1)!
- If you'd like to support the development of this and other projects, please feel free to support me on [Patreon!](https://www.patreon.com/thechosenwaffle) 

## Dependencies

- [discord.js](https://discord.js.org/#/)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [node](https://nodejs.org/en/)
- [express](https://expressjs.com/)
- [axios](https://github.com/axios/axios)

## DevDependencies

- [nodemon](https://www.npmjs.com/package/nodemon)
