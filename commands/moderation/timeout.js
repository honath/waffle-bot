module.exports = {
  name: "timeout",
  description: "Prevents a user from typing in chat for 10 minutes",
  usage: "!timeout @<username>",
  execute(message, args) {
    /**
     * Exit early if message not sent in a server OR
     * user does not have administrator privileges
     */
    if (!message.guild) return;
    if (!message.member.hasPermission("MUTE_MEMBERS"))
      return message.reply("You do not have permission to do that.");

    /* Retrieve target user from message @mentions */
    const user = message.mentions.users.first();

    /* Exit if no user is mentioned */
    if (!user) return message.reply("I have nobody to put in timeout.");

    /* Check if user is in current server/guild - exit early if not */
    const member = message.guild.member(user);
    if (!member) return message.reply("That user is not in this server.");

    /* Set timeout duration */
    const TIMEOUT_DURATION = 600000; // 10 minutes

    /**
     * Timeout user from messaging
     * Send a message confirming success
     * If it fails, send a message notifying user of failure
     */
    try {
      /* Remove permissions */
      member.permissions.remove(["SEND_MESSAGES", "SEND_TTS_MESSAGES"]);
      message.reply(`${user.tag} has been muted for 10 minutes.`);

      /* Return permissions after timeout duration */
      setTimeout(() => {
        member.permissions.add(["SEND_MESSAGES", "SEND_TTS_MESSAGES"]);
      }, TIMEOUT_DURATION);
    } catch (err) {
      message.reply("Sorry, I can't do that.");
      console.log(err);
    }
  },
};
