import {Guild, Message} from 'discord.js';
import Command from '../Command';
import GuildData from '../GuildData';

export default class Force extends Command {
  name = 'force';

  description = 'Forces the confirmation message on';

  usage = '{p}force';

  protected async internalExecute(data: GuildData, guild: Guild, message: Message): Promise<void> {
    if (!data.isController(message.member!)) return;

    const request = data.getFromQueue(message.channel.id);
    if (!request) {
      await this.sendError(
        message,
        'There is no pending mention request to force the confirmation message.'
      );
      return;
    }
    await request.forceConfirmation();
  }
}
