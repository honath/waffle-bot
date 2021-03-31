module.exports = {
  name: "ban",
  description: "Bans a user from the server",
  execute(message, args) {
    if (!message.guild) return;
    if (!message.member.hasPermission("BAN_MEMBERS"))
      return message.reply("You do not have permission to do that.");

    const banUser = message.mentions.users.first();
    if (!banUser) return message.reply("Can't kill what I can't see...");

    const member = message.guild.member(banUser);
    if (!member) return message.reply("That user is not in this server.");

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
