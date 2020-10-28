import {Collection, GuildMember, Message, Snowflake} from 'discord.js';
import type Bot from './Bot';
import {GuildConfig, RoleConfig} from './config';
import type MentionRequest from './MentionRequest';

export default class GuildData {
  readonly id: Snowflake;

  locked: boolean;

  private customPrefix: string | undefined;

  get prefix(): string {
    return this.customPrefix || this.bot.prefix;
  }

  readonly confirmReactionTime: number;

  readonly controllers: string[];

  readonly roles: Collection<string, RoleConfig>;

  readonly channels: Collection<string, string[]>;

  private readonly mentionQueue: Collection<string, MentionRequest>;

  private readonly bot: Bot;

  constructor(bot: Bot, id: Snowflake, config: GuildConfig) {
    this.bot = bot;
    this.id = id;
    this.locked = config.locked ?? false;
    this.customPrefix = config.prefix;
    this.confirmReactionTime = config.confirmReactionTime ?? 60000;
    this.controllers = config.controllers ?? [];
    this.roles = new Collection(Object.entries(config.roles));
    this.channels = new Collection(Object.entries(config.channels));
    this.mentionQueue = new Collection();
  }

  addToQueue(id: string, request: MentionRequest): void {
    this.mentionQueue.set(id, request);
  }

  async removeFromQueue(id: string, reason: string): Promise<void> {
    const request = this.mentionQueue.get(id);
    if (!request) return;
    await request.reject(reason);
    this.deleteFromQueue(id);
  }

  deleteFromQueue(id: string): void {
    this.mentionQueue.delete(id);
  }

  getFromQueue(id: string): MentionRequest | undefined {
    return this.mentionQueue.get(id);
  }

  async clearQueue(reason: string): Promise<void> {
    Promise.allSettled(this.mentionQueue.map(request => request.reject(reason)));
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
