import {Message} from 'discord.js';
import Command from '../Command';

export default class Lock extends Command {
  name = 'lock';

  description = 'Locks mention command';

  usage = '{p}lock';

  protected async internalExecute(message: Message, args: string): Promise<void> {
    const member = message.member!;
    if (!this.bot.isMemberController(member)) return;

    const guild = message.guild!;
    const guildConfig = this.bot.getGuildConfig(guild.id);

    if (guildConfig.locked) {
      await this.sendError(
        message,
        `Guild is already locked. Use \`${this.bot.getPrefix(guild.id)}unlock\` to unlock it.`
      );
      return;
    }

    guildConfig.locked = true;
    this.bot.clearQueue();
    await this.sendReply(
      message,
      'Guild has been locked and all queued mentions have been canceled.'
    );
  }
}
