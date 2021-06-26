const { prefix } = require("../../resources/config.json");

module.exports = {
  name: "help",
  cooldown: 5,
  description: "Shows all commands and their descriptions, or you can specify a command by name to see more details.",
  usage: "!help || !help <command name>",
  execute(message, args) {
    /**
     * Initialize empty command array
     * Will hold all requested information, formatted,
     * to be sent back to requester
     */
    const data = [];

    /* Retrieve all valid commands */
    const { commands } = message.client;

    /**
     * Check if there are any command arguments in message
     * If there are not, list all command names + their descriptions
     */
    if (!args.length) {
      data.push("\nHere is a list of all of the available commands:");
      data.push(`***Command Prefix***: ${prefix}`);
      data.push(
        commands.map((cmd) => `**${cmd.name}**: ${cmd.description}`).join("\n")
      );

      return message.reply(data);
    }

    /* Get specific command from arguments (EX: !help <command>) */
    const name = args[0].toLowerCase();

    /* Retrieve command from commands list */
    const cmd = commands.get(name);

    /* Exit early with failure message if command not valid */
    if (!cmd) return message.reply(`Sorry, ${name} is not a valid command`);

    /* Fill command info array (data) with requested information */
    data.push(`\n**Name**: ${cmd.name}`);

    /* Not all commands will have these values, so they are nested in an "if" check */
    if (cmd.description) data.push(`**Description**: ${cmd.description}`);
    if (cmd.usage) data.push(`**Usage**: ${cmd.usage}`);

    /* Reply with requested command data */
    return message.reply(data);
  },
};
