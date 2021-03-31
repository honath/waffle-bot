module.exports = {
  name: "timeout",
  description: "Prevents a user from typing in chat for 10 minutes",
  execute(message, args) {
    if (!message.guild) return;
    if (!message.member.hasPermission("MUTE_MEMBERS"))
      return message.reply("You do not have permission to do that.");

    const user = message.mentions.users.first();
    if (!user) return message.reply("I have nobody to put in timeout.");

    const member = message.guild.member(user);
    if (!member) return message.reply("That user is not in this server.");

    try {
      member.permissions.remove(["SEND_MESSAGES", "SEND_TTS_MESSAGES"]);
      message.reply(`${user.tag} has been muted for 10 minutes.`);
      setTimeout(() => {
        member.permissions.add(["SEND_MESSAGES", "SEND_TTS_MESSAGES"]);
      }, 600000); // 10 minutes
    } catch (err) {
      message.reply("Sorry, I can't do that.");
      console.log(err);
    }
  },
};
