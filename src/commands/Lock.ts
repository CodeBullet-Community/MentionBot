import {Guild, Message} from 'discord.js';
import Command from '../Command';
import GuildData from '../GuildData';

export default class Lock extends Command {
  name = 'lock';

  description = 'Locks mention command';

  usage = '{p}lock';

  protected async internalExecute(data: GuildData, guild: Guild, message: Message): Promise<void> {
    if (!data.isController(message.member!)) return;

    if (data.locked) {
      await this.sendError(
        message,
        `Guild is already locked. Use \`${data.prefix}unlock\` to unlock it.`
      );
      return;
    }

    data.locked = true;
    data.clearQueue();
    await this.sendReply(
      message,
      'Guild has been locked and all queued mentions have been canceled.'
    );
  }
}
