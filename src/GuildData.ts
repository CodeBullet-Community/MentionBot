import {Collection, GuildMember, Snowflake} from 'discord.js';
import type Bot from './Bot';
import {GuildConfig, RoleConfig} from './config';

export default class GuildData {
  readonly id: Snowflake;

  locked: boolean;

  private customPrefix: string | undefined;

  get prefix(): string {
    return this.customPrefix || this.bot.prefix;
  }

  readonly controllers: string[];

  readonly roles: Collection<string, RoleConfig>;

  readonly channels: Collection<string, string[]>;

  private readonly mentionQueue: Collection<string, NodeJS.Timeout>;

  private readonly bot: Bot;

  constructor(bot: Bot, id: Snowflake, config: GuildConfig) {
    this.bot = bot;
    this.id = id;
    this.locked = config.locked ?? false;
    this.customPrefix = config.prefix;
    this.controllers = config.controllers ?? [];
    this.roles = new Collection(Object.entries(config.roles));
    this.channels = new Collection(Object.entries(config.channels));
    this.mentionQueue = new Collection();
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

  isController(member: GuildMember): boolean {
    return (
      this.isIdController(member.id) ||
      !!member.roles.cache.find(role => this.isIdController(role.id))
    );
  }

  private isIdController(id: Snowflake): boolean {
    return this.bot.owners.includes(id) || this.controllers.includes(id) || false;
  }
}
