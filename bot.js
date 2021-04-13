require("dotenv").config();

const fs = require("fs");
const Discord = require("discord.js");

const app = require("./api/app");

const { prefix } = require("./resources/bot-commands.json");
const { bot_token, PORT = 3000 } = process.env;

const client = new Discord.Client();
client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();
const commandFolders = fs.readdirSync("./commands");

commandFolders.forEach((folder) => {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter((file) => file.endsWith(".js"));

  // Map commands to a set
  commandFiles.forEach((file) => {
    const command = require(`./commands/${folder}/${file}`);
    client.commands.set(command.name, command);
  });
});

// Bot load
client.on("ready", () => {
  console.log("Ready to work!");

  const listener = app.listen(PORT, () =>
    console.log(`Listening on Port ${PORT}!`)
  );
});

// Message listener
client.on("message", (message) => {
  // Early exit, no prefix present
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // Split user arguments + initial command
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Check if valid command
  if (!client.commands.has(commandName)) return;
  const command = client.commands.get(commandName);

  // Command cooldown
  const { cooldowns } = client;

  if (!cooldowns.has(command.name))
    cooldowns.set(command.name, new Discord.Collection());

  // Get time / set cooldown
  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  // Cooldown check
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        `please wait ${timeLeft.toFixed(
          1
        )} more second(s) before reusing the \`${command.name}\` command.`
      );
    }
  }

  // Put user on command timeout. Go sit in the corner and think about your spam.
  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  // Command execution
  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply(`There was an error trying to execute ${commandName}`);
  }
});

client.login(bot_token);
