module.exports = {
  name: "kick",
  description: "Kicks a user from the server",
  execute(message, args) {
    if (!message.guild) return;
    if (!message.member.hasPermission("KICK_MEMBERS"))
      return message.reply("You do not have permission to do that.");

    const kickUser = message.mentions.users.first();
    if (!kickUser) return message.reply("You didn't tell me who to boot!");

    const member = message.guild.member(kickUser);
    if (!member) return message.reply("That user is not in this server.");

    member
      .kick(`${message.author} has kicked you from ${message.guild.name}`)
      .then(() => message.reply(`${kickUser.tag} has been eliminated.`))
      .catch((err) => {
        message.reply("Sorry, I can't do that.");
        console.log(err);
      });
  },
};
