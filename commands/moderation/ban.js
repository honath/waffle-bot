module.exports = {
  name: "ban",
  description: "Bans a user from the server",
  usage: "!ban @<username>",
  execute(message, args) {
    /**
     * Exit early if message not sent in a server OR
     * user does not have administrator privileges
     */
    if (!message.guild) return;
    if (!message.member.hasPermission("BAN_MEMBERS"))
      return message.reply("You do not have permission to do that.");

    /* Retrieve target user from message @mentions */
    const banUser = message.mentions.users.first();

    /* Exit if no user is mentioned */
    if (!banUser) return message.reply("Can't kill what I can't see...");

    /* Check if user is in current server/guild - exit early if not */
    const member = message.guild.member(banUser);
    if (!member) return message.reply("That user is not in this server.");

    /**
     * Ban user from the guild/server
     * Send a message confirming success
     * If it fails, send a message notifying user of failure
     */
    member
      .ban({
        reason: `${message.author} has banned you from ${message.guild.name}`,
      })
      .then(() => message.reply(`I have utterly decimated ${banUser.tag}.`))
      .catch((err) => {
        message.reply("Sorry, I can't do that.");
        console.log(err);
      });
  },
};
