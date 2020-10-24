import {Guild, Message} from 'discord.js';
import Command from '../Command';
import GuildData from '../GuildData';

export default class Unlock extends Command {
  name = 'unlock';

  description = 'Unlocks guild';

  usage = '{p}unlock';

  protected async internalExecute(data: GuildData, guild: Guild, message: Message): Promise<void> {
    if (!data.isController(message.member!)) return;
    if (!data.locked) {
      await this.sendError(message, `Guild is already unlocked.`);
      return;
    }
    data.locked = false;
    await this.sendReply(message, 'Guild has been unlocked.');
  }
}
