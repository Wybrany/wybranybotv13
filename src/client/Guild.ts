import { Guild } from "discord.js";
import { MemberLeaveGuild } from "src/managers/MemberLeaveGuild";
import { CurrentSettings } from "../types/cah.interface";
import { MusicChannel, MusicEmbedInterface } from "../types/music.interface";

const standardPrefix = process.env.PREFIX as string;

declare module "discord.js" {
    interface Guild {
        prefix: string;
        musicChannel: MusicChannel | null;
        cahsettings: CurrentSettings | null;
        musicEmbed: MusicEmbedInterface | null;
        memberLeave: MemberLeaveGuild | null;
    }
}

Guild.prototype.prefix = standardPrefix;
Guild.prototype.musicChannel = null;
Guild.prototype.cahsettings = null;
Guild.prototype.musicEmbed = null;
Guild.prototype.memberLeave = null;