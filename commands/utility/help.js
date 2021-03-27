const { commands } = require("../../resources/bot-commands.json");

module.exports = {
  name: "help",
  cooldown: 5,
  description: "Displays useful command information for the user",
  execute(message, args) {
    const cmdNames = commands.map((cmd) => cmd.name);
    // Check for valid argument following !help, ignore extras
    let helpReply =
      args.length && cmdNames.includes(args[0])
        ? commands.find((cmd) => cmd.name === args[0])
        : commands.map((cmd) => `**${cmd.name}** - ${cmd.description}`);

    // Check if helpReply is array or object, complete output string accordingly
    if (Array.isArray(helpReply)) helpReply = helpReply.join("\n");
    if (helpReply.name)
      helpReply = `**${helpReply.name}** - ${helpReply.description}`;

    // Reply to user with relevant help command(s)
    message.reply(`\n${helpReply}`);
  },
};
