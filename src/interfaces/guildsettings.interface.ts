import { MusicChannel } from "./music.interface";

export interface Guildsettings {
    guildid: string;
    prefix?: string;
    musicChannel?: MusicChannel;
}