import {Guild, Message} from 'discord.js';
import Command from '../Command';
import GuildData from '../GuildData';

export default class Ping extends Command {
  name = 'ping';

  description = 'Test availability';

  usage = '{p}ping';

  protected async internalExecute(data: GuildData, guild: Guild, message: Message): Promise<void> {
    this.sendReply(message, 'Pong');
  }
}
