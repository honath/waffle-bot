const fs = require("fs");

module.exports = {
  name: "announce",
  description:
    "Sets the channel that this command is used in as the announcements channel",
  execute(message, args) {
    /* Establish relative file path for announcement configuration file */
    const CONFIG_PATH = "resources/announcementConfig.json";

    /**
     * Exit early if message not sent in a server OR
     * user does not have administrator privileges
     */
    if (!message.guild) return;
    if (!message.member.hasPermission("ADMINISTRATOR"))
      return message.reply("You do not have permission to do that.");

    /* Retrieve the channel and guild IDs for where this command was sent from */
    const channelID = message.channel.id ?? null;
    const guildID = message.guild.id ?? null;

    /**
     * Verify that both the channel and guild
     * IDs were successfully retrieved
     * Exit early with an error message if not
     */
    if (channelID === null)
      return message.reply("Sorry - I couldn't seem to find this channel.");
    if (guildID === null)
      return message.reply(
        "Sorry - I couldn't seem to find this server. Are you sure you're messaging me in one?"
      );

    /* Set data as object in preparation to write to JSON file */
    const announcementData = {
      channelID: channelID,
      guildID: guildID,
    };

    /* Stringify JSON data so that it is readable to humans */
    const data = JSON.stringify(announcementData, null, 2);

    /* Store information in announcementConfig.json */
    fs.writeFileSync(CONFIG_PATH, data);

    /* End with confirmation message to verify success */
    return message.reply(
      "This channel has now been saved as the announcements channel!"
    );
  },
};
