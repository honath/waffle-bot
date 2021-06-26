const {
  cancelSubscriptions,
} = require("../../api/twitch/twitchAPI");

module.exports = {
  name: "cancelsubs",
  description: "Cancels all Twitch subs",
  execute(message, args) {
    if (!message.guild) return;
    if (!message.member.hasPermission("ADMINISTRATOR"))
      return message.reply("You do not have permission to do that.");

    /**
     * Deletes active Twitch eventsubs for this client
     */
    cancelSubscriptions();

    console.log("Executing 'cancelSubs'")
  },
};
