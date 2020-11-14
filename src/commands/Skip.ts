import {Guild, Message} from 'discord.js';
import Command from '../Command';
import GuildData from '../GuildData';

export default class Skip extends Command {
  name = 'skip';

  description = 'Skip the waiting time';

  usage = '{p}skip';

  protected async internalExecute(data: GuildData, guild: Guild, message: Message): Promise<void> {
    if (!data.isController(message.member!)) return;

    const request = data.getFromQueue(message.channel.id);
    if (!request?.isWaiting) {
      await this.sendError(
        message,
        'There is no pending mention request to skip the waiting time of.'
      );
      return;
    }
    await request.forceConfirmation();
  }
}
