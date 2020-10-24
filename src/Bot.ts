import {Client, Collection, GuildMember, Message, Snowflake} from 'discord.js';

import Command, {CommandConstructor} from './Command';
import List from './commands/List';
import Lock from './commands/Lock';
import Mention from './commands/Mention';
import Ping from './commands/Ping';
import Unlock from './commands/Unlock';
import {BotConfig, GuildConfig} from './config';

export default class Bot {
  static commandConstructors: CommandConstructor[] = [Ping, Mention, List, Lock, Unlock];

  private client!: Client;

  readonly config: BotConfig;

  readonly commands: Collection<string, Command>;

  private readonly mentionQueue: Collection<string, NodeJS.Timeout>;

  constructor(config: BotConfig) {
    this.config = config;
    this.commands = new Collection();
    this.mentionQueue = new Collection();
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

  addToQueue(id: string, timeout: NodeJS.Timeout): void {
    this.mentionQueue.set(id, timeout);
  }

  removeFromQueue(id: string): void {
    const timeout = this.mentionQueue.get(id);
    if (!timeout) return;
    clearTimeout(timeout);
  }

  deleteFromQueue(id: string): void {
    this.mentionQueue.delete(id);
  }

  isInQueue(id: string): boolean {
    return this.mentionQueue.has(id);
  }

  clearQueue(): void {
    this.mentionQueue.forEach(timeout => clearTimeout(timeout));
    this.mentionQueue.clear();
  }

  isMemberController(member: GuildMember): boolean {
    const isController = this.isController(member.guild.id, member.id);
    if (isController) return true;
    return !!member.roles.cache.find(role => this.isController(member.guild.id, role.id));
  }

  isController(guildId: Snowflake, id: Snowflake): boolean {
    return (
      this.config.owners.includes(id) ||
      this.config.guilds[guildId]?.controllers?.includes(id) ||
      false
    );
  }
}
