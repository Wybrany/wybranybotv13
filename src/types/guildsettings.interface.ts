import { MusicChannel } from "./music.interface";
import { CurrentSettings } from "./cah.interface";
import { LeavingReason } from "../managers/MemberLeaveGuild";
import { Snowflake } from "discord.js";

export interface MemberLeaveSettings {
    targetId: Snowflake;
    targetName: string;
    executor: Snowflake;
    giveBackRoles: boolean;
    oldRoles: Snowflake[];
    reason: LeavingReason;
}

export interface Guildsettings {
    guildid: string;
    prefix?: string;
    musicChannel?: MusicChannel | null;
    cahsettings?: CurrentSettings;
    leavingMembers?: MemberLeaveSettings[] | null;
}