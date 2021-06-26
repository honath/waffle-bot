module.exports = {
  name: "kick",
  description: "Kicks a user from the server",
  usage: "!kick @<username>",
  execute(message, args) {
    /**
     * Exit early if message not sent in a server OR
     * user does not have administrator privileges
     */
    if (!message.guild) return;
    if (!message.member.hasPermission("KICK_MEMBERS"))
      return message.reply("You do not have permission to do that.");

    /* Retrieve target user from message @mentions */
    const kickUser = message.mentions.users.first();

    /* Exit if no user is mentioned */
    if (!kickUser) return message.reply("You didn't tell me who to boot!");

    /* Check if user is in current server/guild - exit early if not */
    const member = message.guild.member(kickUser);
    if (!member) return message.reply("That user is not in this server.");

    /**
     * Kick user from the guild/server
     * Send a message confirming success
     * If it fails, send a message notifying user of failure
     */
    member
      .kick(`${message.author} has kicked you from ${message.guild.name}`)
      .then(() => message.reply(`${kickUser.tag} has been eliminated.`))
      .catch((err) => {
        message.reply("Sorry, I can't do that.");
        console.log(err);
      });
  },
};
