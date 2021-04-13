# WaffleBot Discord Bot
## Overview
Lightweight discord bot for personal use.

## Functionality
- Help command lists all available commands
- Kick removes a user from a server, if command sender has permissions
- Ban permanently removes a user from a server, if command sender has permissions
- Timeout prevents a user from typing in chat for 10 minutes. Currently no way to remove.
- Connects to Twitch via webhook subscription for stream live events

## Planned Additions
- Implement stream live notification for Twitch
- Connect to Twitter to announce when stream is live
- Connect to YouTube to announce when a video is uploaded or stream is live
- Role management
- Fun stuff, maybe.

## File Structure
- ./
    - bot.js (main file)
    - .env (tokens, keys, URLs, etc. Git Ignored)
    - ./commands
        - ./commands/moderation
            - kick.js (Kick a user via command)
            - ban.js (Ban a user via command)
            - timeout.js (Remove a user's ability to chat for 10 min via command)
        - ./commands/utility
            - help.js (Help command, lists all commands in bot-commands.json intelligently)
    - ./resources
        - externalURLs.json (Holds API endpoint routes)
        - subscriptions.json (Tells whether or not subscription to events for service is active)
        - bot-commands.json (Holds command prefix and name/description pairs for each valid command)
    - ./api
        - app.js (API handler)
        - ./api/twitch
            - twitch.router.js (handles Twitch API routes)
            - twitch.controller.js (API endpoints for Twitch HTTP calls)
            - subscribeToTwitchEvents.js (Establishes webhook subscription to Twitch)
        - ./api/errors
            - notFound.js (sends custom 404 not found to error handler)
            - methodNotAllowed.js (sends custom 405 not allowed to error handler)
            - errorHandler.js (all purpose error handler/wrapper. Takes in status code and message)

## Dependencies
- discord.js
- dotenv
- express
- axios

## DevDependencies
- nodemon