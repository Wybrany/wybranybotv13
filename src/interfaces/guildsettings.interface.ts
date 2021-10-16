import { MusicChannel } from "./music.interface";
import { CurrentSettings } from "./cah.interface";

export interface Guildsettings {
    guildid: string;
    prefix?: string;
    musicChannel?: MusicChannel | null;
    cahsettings?: CurrentSettings;
}