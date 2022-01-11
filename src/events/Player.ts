import { Message } from "discord.js"
import { EmbedState, Queue } from "discord-music-player";
import Modified_Client from "../client/Client";

const updateEmbed = (client: Modified_Client, queue: Queue, state: EmbedState) => {
    const musicEmbed = queue.guild.musicEmbed;
    if(queue.guild.musicEmbed && queue.guild.musicChannel) musicEmbed?.updateEmbed(client, state);
}

export const PlayerEvents = (client: Modified_Client) => {
    if(!client.player) return console.error(`No clientplayer available.`);
    client.player
        .on('songAdd',  (queue, song) => updateEmbed(client, queue, EmbedState.NOWPLAYING))
        .on('playlistAdd',  (queue, playlist) => updateEmbed(client, queue, EmbedState.NOWPLAYING)) 
        .on('queueEnd',  (queue) => updateEmbed(client, queue, EmbedState.STOPPED))
        .on('songChanged', async (queue, newSong, oldSong) => updateEmbed(client, queue, EmbedState.CHANGING))
        .on('songFirst', async (queue, song) => updateEmbed(client, queue, EmbedState.NOWPLAYING))
        .on('error', (error, queue) => updateEmbed(client, queue, EmbedState.STOPPED))
        .on("paused", (queue, paused) => updateEmbed(client, queue, EmbedState.NOWPLAYING))
        .on("seeking", (queue, seekState) => updateEmbed(client, queue, EmbedState.SEEKING))
        .on("songPlaying", (queue, song) => updateEmbed(client, queue, EmbedState.NOWPLAYING));
}