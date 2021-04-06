# WaffleBot Discord Bot
## Overview
Lightweight discord bot for personal use.

## Functionality
- Help command lists all available commands
- Kick removes a user from a server, if command sender has permissions
- Ban permanently removes a user from a server, if command sender has permissions
- Timeout prevents a user from typing in chat for 10 minutes. Currently no way to remove.

## Planned Additions
- Connect to Twitch to announce when stream is live
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
        - bot-commands.json (Holds command prefix and name/description pairs for each valid command)
    - ./api
        - server.js (initialize server)
        - app.js (API handler)
        - ./api/twitch
            - twitch.router.js (handles Twitch API routes)
            - twitch.controller.js (API endpoints for Twitch HTTP calls)

## Dependencies
- discord.js
- dotenv
- express

## DevDependencies
- nodemon