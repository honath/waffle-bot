# WaffleBot Discord Bot

## Overview
Lightweight discord bot for personal use.

## Functionality
- Currently only help command

## Planned Additions
- Connect to Twitch to announce when stream is live
- Connect to Twitter to announce when stream is live
- Connect to YouTube to announce when a video is uploaded or stream is live
- Implement moderation options
- Role management
- Fun stuff, maybe.

## File Structure
- ./
    - bot.js (main file)
    - config.json (git ignored tokens)
    - ./commands
        - ./commands/moderation
            - kick.js (Kick a user via command)
        - ./commands/utility
            - help.js (Help command, lists all commands in bot-commands.json intelligently)
    - ./resources
        - bot-commands.json (Holds command prefix and name/description pairs for each valid command)

## Dependencies
- discord.js
- nodemon