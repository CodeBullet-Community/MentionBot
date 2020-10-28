import {Guild, Message} from 'discord.js';
import Command from '../Command';
import GuildData from '../GuildData';

export default class Reject extends Command {
  name = 'reject';

  description = 'Rejects request in current channel';

  usage = '{p}reject';

  protected async internalExecute(data: GuildData, guild: Guild, message: Message): Promise<void> {
    if (!data.isController(message.member!)) return;

    const request = data.getFromQueue(message.channel.id);
    if (!request) {
      await this.sendError(message, 'There is no pending mention request to reject.');
      return;
    }
    await request.reject(`Forcefully rejected with mod command.`);
  }
}
