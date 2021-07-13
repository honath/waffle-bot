# Changelog

## 7/13/2021 C

Minor rework to how channels are retrieved, to fix issue with cache returning undefined channels.

## 7/13/2021 B

Added some trace-level logger calls for Heroku debugging.

## 7/13/2021 A

I capitalized a variable name that should've been in all caps already. Yes, that's really it.

## 7/2/2021
This update added a database connection and functionality. Announcement configuration is now stored in a database table, while all active Twitch notification subscriptions are now stored in a separate table. Subscriptions can be added, removed, or listed from Discord.

### Major Changes
- Removed `announcementConfig.json` file - now handled by DB
- Added a PostgreSQL database hosted by [ElephantSQL](https://www.elephantsql.com/)
- Added `knex` and `pg` npm packages as dependencies
- Added the following knex and database folders and files:
    - `knexfile.js`
    - `db` folder
        - `connection.js`
        - `migrations` folder
            - migration files for DB
        - `seeds` folder
            - seed files for DB
    - `api/twitch` folder (not new)
        - `twitch.service.js`
- Added `asyncErrorBoundary.js` to wrap asynchronous function execution and error handling in the API
- Added ability to list active Twitch notification subscriptions in Discord via command
- Added ability to remove a Twitch notification subscription for a specified broadcaster in Discord via command

### Minor Changes
- Hid some testing files/Discord commands
- Converted `notifyDiscord.js` function into a class with static methods for future purposes
- Small message formatting change to the Logger class methods
- README updates

## 6/23/2021

**CURRENTLY ONLY OPERATES LOCALLY/MUST BE HOSTED LOCALLY**

As of this update, the discord bot can subscribe to the "stream online" event of a Twitch user by username, 
and the bot will receive notifications when this event occurs. It will then send an embedded message with basic
stream information and a link to the Twitch stream to the user-defined "announcements" channel within their
Discord server.

### Major Changes
- Major refactor of all API code
- information found in `app.js` moved into `bot.js` due to circular dependency issues and accessibility
- Twitch API integration completed
- Signature verification (for Twitch authentication) handled
- Logger class added. Provided extra, streamlined functionality for logging errors, or just tracing information
- Added `announcementConfig.json` file for storing the "announcements" channel for Discord bot notifications. Channel is set by user.

### Minor Changes
- Using Logger class, added log statements to most functions
- Rename `subscribeToTwitchEvents.js` to `twitchAPI.js`
- Removed `externalURLs.json` and `subscriptions.json`
- Updated file paths
- README updates

## 4/13/2021 B

### Minor changes
- Moved `externalURLs.json` and `subscriptions.json` to "resources" folder, as it was more appropriate, given their use.
- Updated file paths accordingly in relevant files
- Updated README's filepath accordingly
- Removed `server.js` from filepath

## 4/13/2021

### Major changes
- Created this wonderful changelog
- Moved functionality in `./api/server.js` into bot.js "ready"
- Added json config files to store Twitch API endpoints
- Added event subscription file at `./api/subscriptionRouter.js`
    - This file takes in a string to subscribe to events
    - Currently only functional for Twitch
- Added Twitch subscription handler at `./api/twitch/subscribeToTwitchEvents.js`
    - Contains all webhook and API calls to establish subscription
- Added new folder with events handlers at `./api/errors/`
    - `errorHandler.js` (general error wrapper)
    - `notFound.js` (pushes to errorHandler with specific "not found" 404 error)
    - `methodNotAllowed.js` (pushes to errorHandler with specific "not allowed" 405 error)

### Minor Changes
- Updated README
- Added environment variable for Twitch OAuth
- Removed environment variable for Twitch User ID

### Bugfixes
- Technically, the "begin integrating Twitch" commit was entirely wrong, as all of that previous commit's code was rewritten.
