import {Snowflake} from 'discord.js';

export interface BotConfig {
  prefix?: string;
  owners?: string[];
  guilds: {
    [id: string]: GuildConfig;
  };
}

export interface GuildConfig {
  locked?: boolean;
  prefix?: string;
  confirmReactionTime?: number;
  /**
   * Roles or users that can control the bot
   */
  controllers?: string[];
  roles: {
    [name: string]: RoleConfig;
  };
  channels: {
    /**
     * Array of names that are mentionable in this channel
     */
    [id: string]: string[] | ChannelRolesConfig;
  };
}

export type ChannelRolesConfig = {
  roles: string[];
  default: string | null;
};

export interface RoleConfig {
  id: Snowflake;
  wait: number;
}
