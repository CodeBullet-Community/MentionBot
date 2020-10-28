import {Guild, Message, MessageEmbed, MessageReaction, User} from 'discord.js';

import Command from '../Command';
import GuildData from '../GuildData';
import MentionRequest from '../MentionRequest';

export enum Duration {
  Nano = 1e-6,
  Second = 1000,
  Minute = Second * 60,
  Hour = Minute * 60,
  Day = Hour * 24,
  ThirtyDays = Day * 30,
}

export default class Mention extends Command {
  name = 'mention';

  description = 'Mention a role';

  usage = '{p}mention [name]';

  protected async internalExecute(
    data: GuildData,
    guild: Guild,
    message: Message,
    args: string
  ): Promise<void> {
    if (data.locked) {
      await this.sendError(
        message,
        'Guild is currently locked so you cannot use this command right now.'
      );
      return;
    }

    let roleName = args.trim();
    const channelConfig = data.channels.get(message.channel.id);
    if (roleName.length === 0) {
      if (!channelConfig) {
        await this.sendError(
          message,
          `This channel has no mentionable roles. Use \`${data.prefix}list\` to see which channels do have mentionable roles.`
        );
        return;
      }
      if (!channelConfig.default) {
        const roles = channelConfig.roles.map(role => `\`${role}\``).join(', ');
        await this.sendError(
          message,
          `This channel has no default role. Using \`${data.prefix}mention [name]\` choose one of the following: ${roles}`
        );
        return;
      }
      roleName = channelConfig.default;
    }

    const roleConfig = data.roles.get(roleName);
    if (!roleConfig) {
      await this.sendError(message, `No role with name \`${roleName}\` is registered.`);
      return;
    }
    if (!channelConfig?.roles.includes(roleName)) {
      const channels = data.channels
        .filter(config => config.roles.includes(roleName))
        .map((_, id) => `<#${id}>`)
        .join(', ');
      await this.sendError(
        message,
        `You cannot mention this role in this channel. Allowed channels: ${channels}`
      );
      return;
    }
    const exitingRequest = data.getFromQueue(message.channel.id);
    if (exitingRequest) {
      this.sendError(
        message,
        `This channel already has a pending mention request. Wait until the following request has been canceled or executed: ${exitingRequest.requestMessage.url}`
      );
      return;
    }

    console.log(
      `New mention request: User: ${message.author.id} (${message.author.username}) | ` +
        `Role: ${roleName} (${roleConfig.id}) | Message: ${guild.id}/${message.channel.id}/${message.id} ` +
        `(${guild.name}/#${guild.channels.cache.get(message.channel.id)?.name}/message)`
    );

    const waitEmbed = new MessageEmbed()
      .setTitle(`Mention request for ${roleName}`)
      .setDescription(
        `In ${this.secondsToString(roleConfig.wait)} a new confirmation message will appear ` +
          `that needs to be accepted for the bot to then mention <@&${roleConfig.id}>.\n` +
          'If you would like to cancel this request, react to this message with `❌`'
      )
      .setFooter(`Time of confirmation message`)
      .setTimestamp(message.createdTimestamp + roleConfig.wait);
    const waitMessage = await message.channel.send(waitEmbed);
    waitMessage.react('❌');

    const request = new MentionRequest(
      data,
      message,
      roleName,
      roleConfig,
      (...arg) => this.onRequestRejection(...arg),
      (...arg) => this.onRequestAcceptation(...arg),
      (...arg) => this.confirmRequest(waitMessage)(...arg)
    );
    waitMessage
      .awaitReactions(
        (reaction: MessageReaction, user: User) =>
          reaction.emoji.name === '❌' && user.id === message.author.id,
        {max: 1, time: request.remainingTime, errors: ['time']}
      )
      .then(() => request.reject('Canceled while waiting.'))
      .catch(() => {});

    data.addToQueue(message.channel.id, request);
  }

  private secondsToString(duration: number): string {
    const days = Math.floor(duration / Duration.Day);
    const hours = Math.floor(duration / Duration.Hour) % 24;
    const minutes = Math.floor(duration / Duration.Minute) % 60;
    const seconds = Math.floor(duration / Duration.Second) % 60;
    const milliseconds = duration % 1000;

    let result = '';
    if (days !== 0) result += `${days}d `;
    if (hours !== 0) result += `${hours}hr `;
    if (minutes !== 0) result += `${minutes}min `;
    if (seconds !== 0) result += `${seconds}sec `;
    if (milliseconds !== 0) result += `${milliseconds}ms`;
    return result;
  }

  private async onRequestRejection(request: MentionRequest, reason: string) {
    await this.sendReply(
      request.requestMessage,
      `Mention request for <@&${request.roleConfig.id}> was rejected for following reason: ${reason}`
    );
  }

  private async onRequestAcceptation(request: MentionRequest) {
    console.log(
      `Mention request accepted: Original message: ${request.guild.id}/${request.requestMessage.channel.id}/${request.requestMessage.id}`
    );
    await request.requestMessage.channel.send(
      `<@&${request.roleConfig.id}>: ${request.requestMessage.author} mentioned you: ${request.requestMessage.url}`
    );
  }

  private confirmRequest(waitMessage: Message) {
    return async (request: MentionRequest) => {
      await waitMessage.delete();
      const confMessage = await request.requestMessage.channel.send(
        request.requestMessage.author.toString(),
        new MessageEmbed().setDescription(
          `Still want to mention <@&${
            request.roleConfig.id
          }>? If so react with \`✅\` else with \`❌\` in the next ${this.secondsToString(
            request.guild.confirmReactionTime
          )}.`
        )
      );
      await Promise.all([confMessage.react('❌'), confMessage.react('✅')]);
      try {
        const reactions = await confMessage.awaitReactions(
          (userReaction: MessageReaction, user: User) =>
            (userReaction.emoji.name === '❌' || userReaction.emoji.name === '✅') &&
            user.id === request.requestMessage.author.id,
          {max: 1, time: request.guild.confirmReactionTime, errors: ['time']}
        );
        confMessage.delete();
        return reactions.first()?.emoji.name === '✅';
      } catch {
        confMessage.delete();
        return false;
      }
    };
  }
}
