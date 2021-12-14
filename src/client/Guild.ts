import { Guild } from "discord.js";
import { CurrentSettings } from "../interfaces/cah.interface";
import { MusicChannel, MusicEmbedInterface } from "../interfaces/music.interface";

const standardPrefix = process.env.PREFIX as string;

declare module "discord.js" {
    interface Guild {
        prefix: string;
        musicChannel: MusicChannel | null;
        cahsettings: CurrentSettings | null;
        musicEmbed: MusicEmbedInterface | null;
    }
}

Guild.prototype.prefix = standardPrefix;
Guild.prototype.musicChannel = null;
Guild.prototype.cahsettings = null;
Guild.prototype.musicEmbed = null;