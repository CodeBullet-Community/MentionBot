import {Message, MessageEmbed, MessageReaction, User} from 'discord.js';

import Command from '../Command';
import {GuildConfig, RoleConfig} from '../config';

export default class Mention extends Command {
  name = 'mention';

  description = 'Mention a role';

  usage = '{p}mention [name]';

  protected async internalExecute(message: Message, args: string): Promise<void> {
    const guild = message.guild!;
    if (args.trim().length === 0) {
      message.channel.send(this.getHelpEmbed(guild.id));
      return;
    }

    const guildConfig = this.bot.getGuildConfig(guild.id);
    if (guildConfig.locked) {
      await this.sendError(
        message,
        'Guild is currently locked so you cannot use this command right now.'
      );
      return;
    }

    const roleConfig = guildConfig.roles[args];
    if (!roleConfig) {
      this.sendError(message, `No role with name \`${args}\` is registered.`);
      return;
    }
    if (!guildConfig.channels[message.channel.id]?.includes(args)) {
      const channels = this.getChannelsForRole(guildConfig, args)
        .map(id => `<#${id}>`)
        .join(', ');
      this.sendError(
        message,
        `You cannot mention this role in this channel. Allowed channels: ${channels}`
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
      .then(() => this.onCancel(message, waitMessage))
      .catch(() => {});

    const timeout = setTimeout(async () => {
      await waitMessage.delete();
      this.bot.deleteFromQueue(message.channel.id);
      await this.afterWait(message, roleConfig);
    }, remainingTime);
    this.bot.addToQueue(message.channel.id, timeout);
  }

  private getChannelsForRole(config: GuildConfig, roleId: string) {
    return Object.entries(config.channels)
      .filter(([_, roles]) => roles?.includes(roleId))
      .map(([id, _]) => id);
  }

  private onCancel(message: Message, deleteMessage: Message) {
    this.bot.removeFromQueue(message.channel.id);
    deleteMessage.delete();
    this.sendReply(message, 'Mention request was canceled.');
  }

  private async afterWait(message: Message, roleConfig: RoleConfig) {
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
        await this.onCancel(message, confMessage);
        return;
      }
      confMessage.delete();
      message.channel.send(`<@&${roleConfig.id}>: ${message.author} mentioned you: ${message.url}`);
    } catch {
      await confMessage.delete();
      await this.onCancel(message, confMessage);
    }
  }
}
