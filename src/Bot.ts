import {Client, Collection, Message, Snowflake} from 'discord.js';

import Command, {CommandConstructor} from './Command';
import Ping from './commands/Ping';

export interface BotConfig {
  prefix: string;
  owners: string[];
  guilds: {
    [id: string]: GuildConfig | undefined;
  };
}

export interface GuildConfig {
  locked?: boolean;
  prefix?: string;
  /**
   * Roles or users that can control the bot
   */
  controllers?: string[];
  roles: {
    [name: string]: Snowflake | undefined;
  };
  channels: {
    /**
     * Array of names that are mentionable in this channel
     */
    [id: string]: string[] | undefined;
  };
}

export default class Bot {
  static commandConstructors: CommandConstructor[] = [Ping];

  private client!: Client;

  readonly config: BotConfig;

  readonly commands: Collection<string, Command>;

  constructor(config: BotConfig) {
    this.config = config;
    this.commands = new Collection();
    Bot.commandConstructors.forEach(constructor => {
      const command = new constructor(this);
      this.commands.set(command.name, command);
    });
  }

  async initializeBot(): Promise<void> {
    this.client = new Client({disableMentions: 'everyone'});

    this.client.addListener('error', console.error);
    this.client.addListener('ready', () => console.log('Client is ready.'));

    this.client.addListener('message', (message: Message) => this.onMessage(message));

    this.client.login(process.env.BOT_TOKEN);
  }

  private onMessage(message: Message) {
    if (message.author.bot || message.guild === null || !this.isConfigured(message.guild.id))
      return;

    const {content} = message;
    const prefix = this.getPrefix(message.guild.id);
    if (!content.startsWith(prefix)) return;

    const [commandName, args] = content.slice(prefix.length).split(' ', 2);
    const command = this.commands.get(commandName);
    if (!command) return;
    command.execute(message, args ?? '');
  }

  isConfigured(guildId: Snowflake): boolean {
    return this.config.guilds[guildId] !== undefined;
  }

  /**
   * Only supposed to be used in commands or functions for commands
   * as this will always fail for not configured guilds.
   */
  getGuildConfig(guildId: Snowflake): GuildConfig {
    const config = this.config.guilds[guildId];
    if (config === undefined)
      throw new Error(`Tried to get config of not-configured guild with id ${guildId}.`);
    return config;
  }

  getPrefix(guildId: Snowflake): string {
    const guild = this.config.guilds[guildId];
    if (guild?.prefix !== undefined) return guild.prefix;
    return this.config.prefix;
  }
}
