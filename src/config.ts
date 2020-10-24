import {Snowflake} from 'discord.js';

export interface BotConfig {
  prefix: string;
  owners: string[];
  guilds: {
    [id: string]: GuildConfig | undefined;
  };
}

export interface GuildConfig {
  locked?: boolean;
  prefix?: string;
  /**
   * Roles or users that can control the bot
   */
  controllers?: string[];
  roles: {
    [name: string]: RoleConfig | undefined;
  };
  channels: {
    /**
     * Array of names that are mentionable in this channel
     */
    [id: string]: string[] | undefined;
  };
}

export interface RoleConfig {
  id: Snowflake;
  wait: number;
}
