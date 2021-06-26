const { debugSubs } = require("../../api/twitch/twitchAPI");

module.exports = {
  name: "twitchdebug",
  description: "Lists Twitch subscriptions",
  execute(message, args) {
    if (!message.guild) return;
    if (!message.member.hasPermission("ADMINISTRATOR"))
      return message.reply("You do not have permission to do that.");

    /**
     * Calls Twitch with GET method
     * to list all active subscriptions, 
     * for debugging purposes
     */
    debugSubs();
  },
};
