import { EmbedState, Playlist, Queue, SeekState, Song } from "../player/index";
import Modified_Client from "../client/Client";

const updateEmbed = (client: Modified_Client, queue: Queue, state: EmbedState) => {
    const musicEmbed = queue.guild.musicEmbed;
    if(musicEmbed && queue.guild.musicEmbed && queue.guild.musicChannel){
        musicEmbed.updateEmbed(client, state);
        if(state === EmbedState.NOWPLAYING) musicEmbed.startUpdateEmbed(client, state, queue);
        else musicEmbed.stopUpdateEmbed();
    }
}

export const PlayerEvents = (client: Modified_Client) => {
    if(!client.player) return console.error(`No clientplayer available.`);

    /*client.player
        .on('songAdd',  (queue: Queue, song: Song) => updateEmbed(client, queue, EmbedState.NOWPLAYING))
        .on('playlistAdd',  (queue: Queue, playlist: Playlist) => updateEmbed(client, queue, EmbedState.NOWPLAYING)) 
        .on('queueEnd',  (queue: Queue) => updateEmbed(client, queue, EmbedState.STOPPED))
        .on('songChanged', async (queue: Queue, newSong: Song, oldSong: Song) => updateEmbed(client, queue, EmbedState.CHANGING))
        .on('songFirst', async (queue: Queue, song: Song) => updateEmbed(client, queue as Queue, EmbedState.NOWPLAYING))
        .on('error', (error, queue: Queue) => updateEmbed(client, queue, EmbedState.STOPPED))
        .on("paused", (queue: Queue, paused: boolean) => updateEmbed(client, queue, EmbedState.NOWPLAYING))
        .on("seeking", (queue: Queue, seekState: SeekState) => seekState.finishedSeeking ? updateEmbed(client, queue, EmbedState.NOWPLAYING) : updateEmbed(client, queue, EmbedState.SEEKING))
        .on("songPlaying", (queue: Queue, song: Song) => updateEmbed(client, queue, EmbedState.NOWPLAYING));*/
}