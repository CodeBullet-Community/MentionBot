import {Guild, Message, MessageEmbed, MessageReaction, User} from 'discord.js';

import Command from '../Command';
import {GuildConfig, RoleConfig} from '../config';
import GuildData from '../GuildData';

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
    if (args.trim().length === 0) {
      message.channel.send(this.getHelpEmbed(data));
      return;
    }

    if (data.locked) {
      await this.sendError(
        message,
        'Guild is currently locked so you cannot use this command right now.'
      );
      return;
    }

    const roleConfig = data.roles.get(args);
    if (!roleConfig) {
      this.sendError(message, `No role with name \`${args}\` is registered.`);
      return;
    }
    if (!data.channels.get(message.channel.id)?.includes(args)) {
      const channels = data.channels
        .filter(roles => roles.includes(args))
        .map((_, id) => `<#${id}>`)
        .join(', ');
      this.sendError(
        message,
        `You cannot mention this role in this channel. Allowed channels: ${channels}`
      );
      return;
    }
    if (data.isInQueue(message.channel.id)) {
      this.sendError(
        message,
        `This channel already has a pending mention request. Wait until that one has canceled or executed.`
      );
      return;
    }

    const waitEmbed = new MessageEmbed()
      .setTitle(`Mention request for ${args}`)
      .setDescription(
        `In ${roleConfig.wait}ms a new confirmation message will appear that needs to be accepted for the bot to then mention <@&${roleConfig.id}>.\n` +
          'If you would like to cancel this request, react to this message with `❌`'
      )
      .setFooter(`Time of confirmation message`)
      .setTimestamp(message.createdTimestamp + roleConfig.wait);
    const waitMessage = await message.channel.send(waitEmbed);
    waitMessage.react('❌');

    const remainingTime = roleConfig.wait - Date.now() + message.createdTimestamp;
    waitMessage
      .awaitReactions(
        (reaction: MessageReaction, user: User) =>
          reaction.emoji.name === '❌' && user.id === message.author.id,
        {max: 1, time: remainingTime, errors: ['time']}
      )
      .then(() => this.onCancel(data, message, waitMessage))
      .catch(() => {});

    const timeout = setTimeout(async () => {
      await waitMessage.delete();
      data.deleteFromQueue(message.channel.id);
      await this.afterWait(data, message, roleConfig);
    }, remainingTime);
    data.addToQueue(message.channel.id, timeout);
  }

  private onCancel(data: GuildData, message: Message, deleteMessage: Message) {
    data.removeFromQueue(message.channel.id);
    deleteMessage.delete();
    this.sendReply(message, 'Mention request was canceled.');
  }

  private async afterWait(data: GuildData, message: Message, roleConfig: RoleConfig) {
    const confEmbed = new MessageEmbed().setDescription(
      `Still want to mention <@&${roleConfig.id}>? If so react with \`✅\` else with \`❌\` in the next 30 seconds.`
    );
    const confMessage = await message.channel.send(message.author.toString(), confEmbed);
    await Promise.all([confMessage.react('❌'), confMessage.react('✅')]);
    try {
      const reaction = (
        await confMessage.awaitReactions(
          (userReaction: MessageReaction, user: User) =>
            (userReaction.emoji.name === '❌' || userReaction.emoji.name === '✅') &&
            user.id === message.author.id,
          {max: 1, time: 30000, errors: ['time']}
        )
      ).first();
      if (!reaction || reaction.emoji.name === '❌') {
        await this.onCancel(data, message, confMessage);
        return;
      }
      confMessage.delete();
      message.channel.send(`<@&${roleConfig.id}>: ${message.author} mentioned you: ${message.url}`);
    } catch {
      await confMessage.delete();
      await this.onCancel(data, message, confMessage);
    }
  }
}
