import { Queue } from "discord-music-player";
import { embedStates } from "src/interfaces/music.interface";
import Modified_Client from "../client/Client";

//Update_Every_Tick_Function

let interval: NodeJS.Timeout | null = null;

//async function updateEveryTick(): Promise<void> => {}

const checkForEmbed = async (client: Modified_Client, queue: Queue, state: embedStates) => {
    if(!client || !queue || !queue.guild.musicChannel || !queue.guild.musicEmbed) return;
    await queue.guild.musicEmbed.updateEmbed(client, state);
}

export const PlayerEvents = (client: Modified_Client) => {
    if(!client.player) return console.error(`No clientplayer available.`);
    client.player
    // Emitted when channel was empty.
    .on('channelEmpty',  (queue) =>
        console.log(`Everyone left the Voice Channel, queue ended.`))
    // Emitted when a song was added to the queue.
    .on('songAdd',  (queue, song) =>
        console.log(`Song ${song} was added to the queue.`))
    // Emitted when a playlist was added to the queue.
    .on('playlistAdd',  (queue, playlist) =>
        console.log(`Playlist ${playlist} with ${playlist.songs.length} was added to the queue.`))
    // Emitted when there was no more music to play.
    .on('queueDestroyed',  (queue) =>
        console.log(`The queue was destroyed.`))
    // Emitted when the queue was destroyed (either by ending or stopping).    
    .on('queueEnd',  (queue) =>
        console.log(`The queue has ended.`))
    // Emitted when a song changed.
    .on('songChanged', async (queue, newSong, oldSong) => {
        console.log(queue.songs.length);
        console.log(`${newSong} is now playing.`)
    })
    // Emitted when a first song in the queue started playing.
    .on('songFirst', async (queue, song) => {
        console.log(`Song ${song} has started playing.`)
        //await checkForEmbed(client, queue, "NOWPLAYING")
    })
    // Emitted when someone disconnected the bot from the channel.
    .on('clientDisconnect', (queue) =>
        console.log(`I was kicked from the Voice Channel, queue ended.`))
    // Emitted when deafenOnJoin is true and the bot was undeafened
    .on('clientUndeafen', (queue) =>
        console.log(`I got undefeanded.`))
    // Emitted when there was an error in runtime
    .on('error', (error, queue) => {
        console.log(`Error: ${error} in ${queue.guild.name}`);
    })
}