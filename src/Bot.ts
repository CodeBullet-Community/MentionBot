import {Client, Collection, Message, Snowflake} from 'discord.js';

import Command, {CommandConstructor} from './Command';
import Force from './commands/Force';
import Help from './commands/Help';
import List from './commands/List';
import Lock from './commands/Lock';
import Mention from './commands/Mention';
import Ping from './commands/Ping';
import Reject from './commands/Reject';
import Unlock from './commands/Unlock';
import {BotConfig} from './config';
import GuildData from './GuildData';

export default class Bot {
  static commandConstructors: CommandConstructor[] = [
    Ping,
    Mention,
    List,
    Lock,
    Unlock,
    Help,
    Force,
    Reject,
  ];

  readonly prefix: string;

  readonly owners: string[];

  readonly guilds: Collection<Snowflake, GuildData>;

  readonly commands: Collection<string, Command>;

  client!: Client;

  constructor(config: BotConfig) {
    this.prefix = config.prefix ?? '??';
    this.owners = config.owners ?? [];
    this.guilds = new Collection(
      Object.entries(config.guilds).map(([id, guildConfig]) => [
        id,
        new GuildData(this, id, guildConfig),
      ])
    );
    this.commands = new Collection();
    Bot.commandConstructors.forEach(constructor => {
      const command = new constructor(this);
      this.commands.set(command.name, command);
    });
  }

  async initializeBot(): Promise<void> {
    this.client = new Client({disableMentions: 'everyone'});

    this.client.addListener('ready', () => console.log('Client is ready.'));
    this.client.addListener('error', console.error);

    this.client.addListener('message', (message: Message) => this.onMessage(message));

    this.client.login(process.env.DISCORD_TOKEN);
  }

  private onMessage(message: Message) {
    if (message.author.bot || message.guild === null) return;

    const data = this.guilds.get(message.guild.id);
    if (!data) return;

    if (!message.content.startsWith(data.prefix)) return;
    const [commandName, args] = message.content.slice(data.prefix.length).split(' ', 2);
    const command = this.commands.get(commandName);
    if (!command) return;
    command.execute(data, message.guild, message, args ?? '');
  }
}
