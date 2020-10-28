import type {Guild, Message} from 'discord.js';
import type {RoleConfig} from './config';
import type GuildData from './GuildData';

export type MentionRequestRejectCallback = (
  request: MentionRequest,
  reason: string
) => Promise<void>;

export type MentionRequestAcceptCallback = (request: MentionRequest) => Promise<void>;

export type MentionRequestConfirmHandler = (request: MentionRequest) => Promise<boolean>;

export default class MentionRequest {
  readonly guild: GuildData;

  readonly guildObject: Guild;

  readonly requestMessage: Message;

  readonly roleName: string;

  readonly roleConfig: RoleConfig;

  private readonly rejectCallback: MentionRequestRejectCallback;

  private readonly acceptCallback: MentionRequestAcceptCallback;

  private readonly confirmHandler: MentionRequestConfirmHandler;

  private readonly timeout: NodeJS.Timeout;

  get remainingTime(): number {
    return this.roleConfig.wait - Date.now() + this.requestMessage.createdTimestamp;
  }

  constructor(
    guild: GuildData,
    requestMessage: Message,
    roleName: string,
    roleConfig: RoleConfig,
    rejectCallback: MentionRequestRejectCallback,
    acceptCallback: MentionRequestAcceptCallback,
    confirmHandler: MentionRequestConfirmHandler
  ) {
    this.guild = guild;
    this.requestMessage = requestMessage;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.guildObject = requestMessage.guild!;
    this.roleName = roleName;
    this.roleConfig = roleConfig;
    this.rejectCallback = rejectCallback;
    this.acceptCallback = acceptCallback;
    this.confirmHandler = confirmHandler;
    this.timeout = setTimeout(() => this.confirmRequest(), this.remainingTime, this);
  }

  private async confirmRequest() {
    try {
      if (await this.confirmHandler(this)) {
        await this.accept();
        return;
      }
      await this.reject('Confirmation was rejected.');
    } catch (error) {
      console.error(error);
      await this.reject('Confirmation failed.');
    }
  }

  private settle() {
    clearTimeout(this.timeout);
    this.guild.deleteFromQueue(this.requestMessage.channel.id);
  }

  reject(reason: string): Promise<void> {
    this.settle();
    return this.rejectCallback(this, reason);
  }

  accept(): Promise<void> {
    this.settle();
    return this.acceptCallback(this);
  }

  async forceConfirmation(): Promise<void> {
    this.settle();
    await this.confirmRequest;
  }
}
