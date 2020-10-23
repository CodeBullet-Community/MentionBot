import {Message} from 'discord.js';
import Command from '../Command';

export default class Ping extends Command {
  name = 'ping';

  description = 'Command to test availability';

  usage = '{p}ping';

  protected async internalExecute(message: Message): Promise<void> {
    this.sendReply(message, 'Pong');
  }
}
