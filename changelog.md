# Changelog

## 4/13/2021

### Major changes
- Created this wonderful changelog
- Moved functionality in ./api/server.js into bot.js "ready"
- Added json config files to store Twitch API endpoints
- Added event subscription file at ./api/subscriptionRouter.js
    - This file takes in a string to subscribe to events
    - Currently only functional for Twitch
- Added Twitch subscription handler at ./api/twitch/subscribeToTwitchEvents.js
    - Contains all webhook and API calls to establish subscription
- Added new folder with events handlers at ./api/errors/
    - errorHandler (general error wrapper)
    - notFound (pushes to errorHandler with specific "not found" 404 error)
    - methodNotAllowed (pushes to errorHandler with specific "not allowed" 405 error)

### Minor Changes
- Updated README
- Added environment variable for Twitch OAuth
- Removed environment variable for Twitch User ID

### Bugfixes
- Technically, the "begin integrating Twitch" commit was entirely wrong, as all of that previous commit's code was rewritten.
