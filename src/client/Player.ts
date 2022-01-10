import { Player, PlayerOptions, Queue, Song, Utils, DMPError, DMPErrors } from "discord-music-player";
import { Guild } from "discord.js";
import Modified_Client from "./Client";

declare module "discord-music-player"{
    interface Queue {
        unshuffledSongs: Song[]
        toggleShuffle: boolean;
    }
}

export default class extends Queue {
    constructor(player: Player, guild: Guild, options?: PlayerOptions){
        super(player, guild, options);

        this.toggleShuffle = false;
        this.unshuffledSongs = [];
    }

    shuffle(): Song[] | undefined {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        if(!this.toggleShuffle) {
            this.unshuffledSongs = this.songs;
            let currentSong = this.songs.shift();
            this.songs = Utils.shuffle(this.songs);
            this.songs.unshift(currentSong!);
            this.toggleShuffle = true;
        }
        else {
            const currentSong = this.songs.shift();
            const filterPlayedSongs = this.unshuffledSongs.filter(s => this.songs.map(s => s.url).includes(s.url));
            this.songs = filterPlayedSongs;
            this.songs.unshift(currentSong!);
            this.toggleShuffle = false;
        }
        return this.songs;
    }

}