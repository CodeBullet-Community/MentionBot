import {Guild, Message, MessageEmbed, MessageReaction, User} from 'discord.js';

import Command from '../Command';
import {RoleConfig} from '../config';
import GuildData from '../GuildData';

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
    let roleName = args.trim();
    const channelRoles = data.channels.get(message.channel.id);
    if (roleName.length === 0) {
      if (channelRoles?.length === 1) {
        roleName = channelRoles[0];
      } else if (channelRoles) {
        const roles = channelRoles.map(role => `\`${role}\``).join(', ');
        await this.sendError(
          message,
          `This channel has more then one mentionable role: ${roles}. Choose one using \`${data.prefix}mention [name]\`.`
        );
        return;
      } else {
        await this.sendError(
          message,
          `This channel has no mentionable roles. Use \`${data.prefix}list\` to see which channels do have mentionable roles.`
        );
        return;
      }
    }

    if (data.locked) {
      await this.sendError(
        message,
        'Guild is currently locked so you cannot use this command right now.'
      );
      return;
    }

    const roleConfig = data.roles.get(roleName);
    if (!roleConfig) {
      await this.sendError(message, `No role with name \`${roleName}\` is registered.`);
      return;
    }
    if (!channelRoles?.includes(roleName)) {
      const channels = data.channels
        .filter(roles => roles.includes(roleName))
        .map((_, id) => `<#${id}>`)
        .join(', ');
      await this.sendError(
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

    console.log(
      `New mention request: User: ${message.author.id} (${message.author.username}) | ` +
        `Role: ${roleName} (${roleConfig.id}) | Message: ${guild.id}/${message.channel.id}/${message.id} ` +
        `(${guild.name}/#${guild.channels.cache.get(message.channel.id)?.name}/message)`
    );

    const waitEmbed = new MessageEmbed()
      .setTitle(`Mention request for ${roleName}`)
      .setDescription(
        `In ${this.secondsToString(
          roleConfig.wait
        )} a new confirmation message will appear that needs to be accepted for the bot to then mention <@&${
          roleConfig.id
        }>.\n` + 'If you would like to cancel this request, react to this message with `❌`'
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

  private async onCancel(data: GuildData, message: Message, deleteMessage: Message) {
    data.removeFromQueue(message.channel.id);
    try {
      await deleteMessage.delete();
      // eslint-disable-next-line no-empty
    } catch {}
    await this.sendReply(message, 'Mention request was canceled.');
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
      console.log(
        `Mention request accepted: Original message: ${message.guild!.id}/${message.channel.id}/${
          message.id
        }`
      );
    } catch {
      await this.onCancel(data, message, confMessage);
    }
  }
}
