import { Guild, VoiceChannel, Interaction, TextChannel, MessageButton, MessageActionRow, MessageSelectMenu } from "discord.js";
import { 
    joinVoiceChannel, 
    getVoiceConnection, 
    createAudioPlayer, 
    NoSubscriberBehavior, 
    createAudioResource, 
    AudioResource,
    AudioPlayer,
    AudioPlayerStatus,
    VoiceConnectionStatus,
} from "@discordjs/voice";
import { 
    MusicChannel, 
    MusicConstructorInterface, 
    Song, 
    VideoDetails, 
    embed_state, 
    search_type 
} from "../../interfaces/music.interface";
import ytsr from "ytsr";
import ytdl, { validateURL, getBasicInfo } from "ytdl-core-discord";
import ytpl, { validateID, getPlaylistID } from "ytpl";
import Modified_Client from "../../methods/client/Client";
import { shuffle } from "../shuffle";
import ffmpeg from "fluent-ffmpeg";
import internal from "stream";
import { Writable } from "stream";
import lyricsFinder from "lyrics-finder";

export class MusicConstructor implements MusicConstructorInterface {

    public client: Modified_Client;
    public guild: Guild
    public musicChannel: MusicChannel;

    public playing: boolean;
    public currentQueuePage: number;
    public queue: [Song[]];

    public select: boolean;
    public remove: boolean;
    public swap: boolean;

    public shuffle: boolean;
    public loop: boolean;
    public paused: boolean;

    public seeking: boolean;
    public seek_time: number;

    public channel: VoiceChannel | null;
    public player: AudioPlayer | null;
    public current_song: Song | null;
    public resource: AudioResource<Song> | null;

    constructor(client: Modified_Client,guild: Guild, musicChannel: MusicChannel){
        this.client = client;
        this.guild = guild;
        this.musicChannel = musicChannel;

        this.playing = false;
        this.currentQueuePage = 0;
        this.queue = [[]];

        //Songqueue state
        this.select = true;
        this.remove = false;
        this.swap = false;

        this.shuffle = false;
        this.loop = false;
        this.paused = false;

        this.seeking = false;
        this.seek_time = 0;

        this.current_song = null;
        this.channel = null;
        this.player = null;
        this.resource = null;
    }

    async play(): Promise<void>{
        let connection = getVoiceConnection(this.guild.id);
        if(!connection && this.channel) connection = joinVoiceChannel({
            channelId: this.channel.id,
            guildId: this.guild.id,
            adapterCreator: this.channel.guild.voiceAdapterCreator
        });
        if(!connection || !this.queue.length || !checkQueueLength(this.queue)) return this.stop(undefined, true);

        let current_song: Song | null = null;
        if(this.shuffle){
            const randomQueueChunk = shuffle(this.queue.length, 1) as number;
            const randomQueue = shuffle(this.queue[randomQueueChunk].length, 1) as number;
            current_song = this.queue[randomQueueChunk].splice(randomQueue, 1)[0];
            const newQueue = regenerate_queue(this.queue);
            this.queue = [[]];
            this.add_queue(newQueue, false);
        }
        else {
            current_song = this.queue[0].shift() as Song;
            const newQueue = regenerate_queue(this.queue);
            this.queue = [[]];
            this.add_queue(newQueue, false);
        }
        //console.log(current_song);
        if(!current_song?.link) return this.play();

        let interval: NodeJS.Timeout | null = null;
        let resource: AudioResource<Song> | null = null;

        if(this.seeking){
            console.log("In this.seeking");
            const readable = await create_readable(current_song as Song);
            if(!readable) return this.play();
            const seek_writeable = await create_seek_readble(readable, this.seek_time);
            console.log(seek_writeable)
            if(!seek_writeable) return this.play();
            resource = createAudioResource(readable, {metadata: current_song}) as AudioResource<Song>
        }
        //Also check for spotify and create a different resource here.
        else resource = await probeAndCreateResource(current_song);

        if(!resource) return this.play();

        /*connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log(`VoiceConnectionStatus.Disconnected`)
            this.stop(undefined, true);
        })*/

        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause
            }
        });

        player.on("error", async err => {
            console.log(`Audioplayer-Error`)
            console.error(err);
            try{
                await this.update_embed("CHANGING");
                const musicChannel = this.client.guildsettings.get(this.guild.id)?.musicChannel?.channelid;
                if(musicChannel){
                    const channel = this.guild.channels.cache.get(musicChannel) as TextChannel | undefined;
                    if(channel) 
                        channel.send({content: `❌ I got an error trying to play: **${this.current_song?.title ?? "UNKNOWN TITLE"}**. This song will be skipped.`})
                            .then(m => setTimeout(async() => await m.delete(), 60000))
                            .catch(err => console.error(`❌ I got an error trying to send a message to guild ${this.guild.id}`));
                }
            }catch(err){
                console.error(`playerOnErrorSendMessage: ${err}`)
            }
            this.player = null;
            this.resource = null;
            this.current_song = null;
            return this.play();
        })
        player.on("stateChange", async (oldState, newState) => {
            switch(newState.status){
                case AudioPlayerStatus.Playing: 
                    console.log('The audio player has started playing!');
                    if(oldState.status !== AudioPlayerStatus.Paused) {
                        this.update_embed("NOWPLAYING");
                        let previousCheck = 0;
                        interval = setInterval(async () => {
                            if(!this.playing){
                                if(interval) clearInterval(interval);
                                return;
                            }
                            const duration = update_every_tick(this.player as AudioPlayer);
                            if(duration > previousCheck) {
                                previousCheck = duration;
                                await this.update_embed("NOWPLAYING");
                            }
                        }, 5000)
                    }
                break;
                
                case AudioPlayerStatus.Idle:
                    console.log('Player is idle!');
                    if(interval) clearInterval(interval);
                    if(!this.playing) return;
                    if(this.loop) {
                        const currentSong = this.current_song as Song;
                        Object.assign(currentSong, {looped: true});
                        if(this.queue[this.queue.length - 1].length === 25) this.queue.push([currentSong]);
                        else this.queue[this.queue.length - 1].push(currentSong);
                    }
                    if(this.queue.length && checkQueueLength(this.queue) && !this.seeking) await this.update_embed("CHANGING");
                    this.current_song = null;
                    this.player = null;
                    this.resource = null;
                    return this.play();
            }
        })
        //console.log(connection, this.player, this.resource)
        if(connection && player && resource) {
            try{
                connection.subscribe(player);
                player.play(resource);
                this.current_song = current_song;
                this.player = player;
                this.resource = resource;
                this.playing = true;
            }catch(err){
                console.error(`Error playing resource: ${err}`);
                return this.play();
            }
        }
    }

    stop(interaction?: Interaction, leave?: boolean){ 
        const connection = getVoiceConnection(this.guild.id);
        if(!connection) return;
        this.playing = false;
        connection.destroy();
        if(interaction || leave){
            //Do embed stuff since a user manually stopped
            return this.update_embed("STOPPED");
        }
    }

    skip(interaction?: Interaction){
        if(this.player) 
            return this.player.stop();
    }
    toggle_pause(interaction: Interaction){
        if(this.player && this.paused){ 
            this.player.unpause();
            this.paused = false;
            return this.update_embed("NOWPLAYING")
        }
        else if(this.player && !this.paused) {
            this.player.pause();
            this.paused = true;
            return this.update_embed("NOWPLAYING");
        }
        else return;
    }

    seek(time_s: number){
        if(!this.current_song || !this.player) return;
        /*this.seeking = true;
        this.seek_time = time_s;
        this.update_embed("SEEKING");
        this.queue.unshift(this.current_song);
        this.skip();*/

        console.log("Now seeking")
    }

    shift(index: number){
        const song = this.queue[this.currentQueuePage].splice(index, 1)[0];
        if(song) {
            this.update_embed("CHANGING");
            const newQueue = regenerate_queue(this.queue);
            newQueue.unshift(song);
            this.queue = [[]];
            this.add_queue(newQueue, false);
            this.skip();
        }
    }

    async add_queue(songs: Song[], update: boolean): Promise<void>{
        if(!songs || !songs.length) return;
        for(let i = 0; i < this.queue.length; i++){
            if(this.queue[i].length === 25 && !songs.length) break;
            if(this.queue[i].length === 25 && songs.length && !Array.isArray(this.queue[i+1])){
                this.queue.push([]);
                continue;
            }
            const queueSongs = songs.splice(0, (25 - this.queue[i].length))
            console.log(`Songs remaining to splice: ${songs.length}`);
            this.queue[i].push(...queueSongs);
            if(songs.length && !Array.isArray(this.queue[i+1])) this.queue.push([]);
        }
        // 1 -> 0
        if(this.currentQueuePage > (this.queue.length - 1)) this.currentQueuePage = (this.queue.length - 1);
        console.log(`addQueue, 2dqueue length: ${this.queue.length}`);
        /*if(!this.player && !this.current_song && !this.playing){
            this.playing = true;
            return await this.play();
        }
        if(update) {
            console.log("Now updating!");
            this.update_embed("NOWPLAYING");
        }*/
    }

    swap_songs(song1: number, song2: number){
        if(checkQueueLength(this.queue) <= 1) return
        [this.queue[this.currentQueuePage][song1], this.queue[this.currentQueuePage][song2]] = [this.queue[this.currentQueuePage][song2], this.queue[this.currentQueuePage][song1]]
        //(this.queue[this.currentQueuePage][song1], this.queue[this.currentQueuePage][song2]) = (this.queue[this.currentQueuePage][song2], this.queue[this.currentQueuePage][song1]);
        this.update_embed("NOWPLAYING");
    }

    remove_queue(index: number, updateEmbed: boolean){
        //if(song.link === this.current_song?.link && this.queue.some(s => s.link !== song.link)) this.skip();
        //this.queue = this.queue.filter(s => s.link !== song.link);
        this.queue[this.currentQueuePage].splice(index, 1);
        const newQueue = regenerate_queue(this.queue);
        this.queue = [[]];
        this.add_queue(newQueue, false);
        if(updateEmbed) this.update_embed("NOWPLAYING");
    }

    queue_page(state: "FIRST" | "NEXT" | "PREV" | "LAST", interaction?: Interaction){
        switch(state){
            case 'FIRST':
                if(this.currentQueuePage === 0) return; 
                this.currentQueuePage = 0;
            break;

            case 'NEXT':
                if((this.currentQueuePage + 1) > (this.queue.length - 1) || this.currentQueuePage === (this.queue.length - 1)) return;
                this.currentQueuePage += 1;
            break;

            case 'PREV':
                if(this.currentQueuePage === 0 || (this.currentQueuePage - 1) < 0) return;
                this.currentQueuePage -= 1;
            break;

            case 'LAST':
                if(this.currentQueuePage === (this.queue.length - 1)) return; 
                this.currentQueuePage = this.queue.length - 1;
            break;
        }
        if(interaction) this.update_embed("NOWPLAYING");
    }

    queue_state(state: "SELECT" | "REMOVE" | "SWAP", interaction?: Interaction){
        switch(state){
            case 'SELECT':
                this.select = true;
                this.remove = false;
                this.swap = false;
            break;

            case 'REMOVE':
                if(!checkQueueLength(this.queue)) return;
                this.select = false;
                this.remove = true;
                this.swap = false;
            break;

            case 'SWAP':
                if(checkQueueLength(this.queue) <= 1 ) return;
                this.select = false;
                this.remove = false;
                this.swap = true;

            break;
            default: return;
        }
        if(interaction && this.player) this.update_embed("NOWPLAYING");
    }

    get_current_channel(): VoiceChannel | null{
        return this.channel;
    }

    set_current_channel(channel: VoiceChannel){
        this.channel = channel;
        if(this.channel === null) this.stop();
    }

    toggle_shuffle(interaction: Interaction){
        if(this.player && this.shuffle) this.shuffle = false;
        else if(this.player && !this.shuffle) this.shuffle = true;
        this.update_embed("NOWPLAYING");
    }

    toggle_loop(interaction: Interaction){
        if(this.player && this.loop) this.loop = false;
        else if(this.player && !this.loop) this.loop = true;
        this.update_embed("NOWPLAYING");
    }

    async update_embed(state: embed_state){
        if(!state) return console.error(`No state.`);
        const channel = this.guild.channels.cache.get(this.musicChannel.channelid) as TextChannel | undefined;
        if(!channel) return console.log("No channel");
        const message = !channel.messages.cache.has(this.musicChannel.embedid) 
            ? await channel.messages.fetch(this.musicChannel.embedid) : channel.messages.cache.get(this.musicChannel.embedid);
        if(!message) return console.log("No message");
        
        const prefix = this.client.guildsettings.get(this.guild.id)?.prefix;
        const [ embed ] = message.embeds;
        const [ buttonRows, selectMenu ] = message.components;
        const [ queue ] = selectMenu.components;

        switch(state){
            case 'NOWPLAYING':{
                const npprogressBar = generate_progress_bar(this.player as AudioPlayer);
                const npEmbed = embed
                    //Description could have a progressbar that updates, add an image as an album cover maybe
                    .setTitle(`🎵 Now playing 🎵 `)
                    .setDescription(`\`\`\`ini\n▶️ ${this.current_song?.title ?? "Unkown"} | ${this.current_song?.length ?? "Unknown"}\n\n${npprogressBar}\n\n${checkQueueLength(this.queue) === 1 ? `${checkQueueLength(this.queue)} song remaining.` : `${checkQueueLength(this.queue)} songs remaining.`}\`\`\``)
                    .setColor("DARK_GREEN")
                    .setFooter(`Requested by: ${this.guild.members.cache.get(this.current_song?.who_queued_id ?? "")?.user.username ?? "Unknown"}`)
                    .setTimestamp();
                this.paused ? npEmbed.setColor("DARK_RED") : npEmbed.setColor("DARK_GREEN");
                const selectButton = generate_music_buttons(this.paused, this.loop, this.shuffle, this.queue, this.guild, false);
                const selectMenu = this.select 
                    ? generate_current_queue_list(this.queue, this.currentQueuePage, this.guild, "SELECT") 
                    : this.remove ? generate_current_queue_list(this.queue, this.currentQueuePage, this.guild, "REMOVE")
                    : generate_current_queue_list(this.queue, this.currentQueuePage, this.guild, "SWAP");
                const queuePageButtons = generate_queue_buttons(this.queue, this.currentQueuePage, this.guild);
                const swapButtons = checkQueueLength(this.queue)
                    ? generate_new_select_buttons(this.select, this.remove, this.swap, this.guild, this.queue, this.currentQueuePage, false)
                    : generate_new_select_buttons(this.select, this.remove, this.swap, this.guild, this.queue, this.currentQueuePage, true)

                const newComponents = queuePageButtons ? [selectButton, selectMenu, queuePageButtons, swapButtons] : [selectButton, selectMenu, swapButtons];
                await message.edit({embeds: [npEmbed], components: newComponents });
            }
            break;
            
            case 'STOPPED':
                const stEmbed = embed
                    .setTitle(`Idle - Not playing anything`)
                    .setDescription(`
                    Use ${prefix ?? process.env.PREFIX}help music to display all available commands.
                    
                    To play something, use the play command as usual! The buttons will help you navigate through songs easier.
                    
                    You can pause/resume, skip and stop the bot. You can also toggle Loop and shuffle with the buttons! 
                    
                    The Song Queue will show songs queued up to 25 songs. Use the buttons below the Song Queue to toggle Select, Remove or Swap.
                    `)
                    .setColor("BLUE")
                    .setFooter(``)
                    .setTimestamp()
                const newButtonRows = generate_music_buttons(false, false, false, this.queue, this.guild, true);
                const newQueue = generate_current_queue_list([[]], 0, this.guild, "SELECT");
                const stoppedSelectButtons = generate_new_select_buttons(true, false, false, this.guild, this.queue, this.currentQueuePage, true);

                await message.edit({embeds: [stEmbed], components: [newButtonRows, newQueue, stoppedSelectButtons]})
            break;

            case 'CHANGING':
                const changingEmbed = embed
                    .setTitle(`Changing song...`)
                    .setColor("BLUE")
                    .setDescription("")
                    .setFooter("")
                    .setTimestamp()
                const changingButtons = new MessageActionRow().addComponents(buttonRows.components.map(comp => comp.setDisabled(true)));
                const changingQueue = new MessageActionRow().addComponents(queue.setDisabled(true));
                const changingSelectButtons = generate_new_select_buttons(this.select, this.remove, this.swap, this.guild,this.queue, this.currentQueuePage, true);
                await message.edit({embeds: [changingEmbed], components: [changingButtons, changingQueue, changingSelectButtons]});
            break;

            case 'SEEKING':
                const seekingEmbed = embed
                    .setTitle(`Seeking... Please wait.`)
                    .setColor("BLUE")
                    .setDescription("")
                    .setFooter("")
                    .setTimestamp()
                const seekingButtons = new MessageActionRow().addComponents(buttonRows.components.map(comp => comp.setDisabled(true)));
                const seekingQueue = new MessageActionRow().addComponents(queue.setDisabled(true));
                const seekingSelectButtons = generate_new_select_buttons(this.select, this.remove, this.swap, this.guild, this.queue, this.currentQueuePage, true);
                await message.edit({embeds: [seekingEmbed], components: [seekingButtons, seekingQueue, seekingSelectButtons]});
            break;
                
            default:

            break;
        }
    }
}

const checkQueueLength = (queue2d: [Song[]]): number => {
    let queuelength = 0;
    for(let i = 0; i < queue2d.length; i++){
        if(Array.isArray(queue2d[i])) queuelength += queue2d[i]?.length ?? 0;
    }
    return queuelength;
}

const regenerate_queue = (queue2d: [Song[]]): Song[] => {
    const oldQueue: Song[] = [];
    for(const queue of queue2d){
        oldQueue.push(...queue);
    }
    return oldQueue;
}

const update_every_tick = (player: AudioPlayer): number => {
    //@ts-ignore
    const resource = player?.state?.resource as AudioResource;
    if(!resource) return 0;
    const { playbackDuration, metadata } = resource;
    const { details } = metadata as Song;
    const { lengthSeconds } = details;

    let progress_based_on_40 = Math.trunc((playbackDuration/1000)/(parseFloat(lengthSeconds)) * 39);
    if(progress_based_on_40 >= 39) progress_based_on_40 = 39;

    return progress_based_on_40;
}

const generate_progress_bar = (player: AudioPlayer): string => {
    //@ts-ignore
    const resource = player?.state?.resource as AudioResource;
    if(!resource) return new Array(40).fill("🔘", 0, 1).fill("▬").join("");
    const { playbackDuration, metadata } = resource;
    const { details } = metadata as Song;
    const { lengthSeconds } = details;

    let progress_based_on_40 = Math.trunc((playbackDuration/1000)/(parseFloat(lengthSeconds)) * 39);
    if(progress_based_on_40 >= 39) progress_based_on_40 = 39;
    //▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    const progressBar = new Array(40).fill("▬");
    progressBar[progress_based_on_40] = "🔘"
    return progressBar.join("");
}

const generate_music_buttons = (paused: boolean, loop: boolean, shuffle: boolean, queue: [Song[]], guild: Guild, disabled: boolean): MessageActionRow => {
    
    const playPauseButton = new MessageButton()
        .setCustomId(`buttonPlayPause-${guild.id}`)
        .setLabel("Pause")
        .setStyle("PRIMARY")
        .setDisabled(false)
        .setEmoji("⏯️")
    if(paused) playPauseButton.setLabel("Resume").setStyle("DANGER")
    if(disabled) playPauseButton.setDisabled(true);

    const skipButton = new MessageButton()
        .setCustomId(`buttonSkip-${guild.id}`)
        .setLabel("Skip")
        .setStyle("PRIMARY")
        .setDisabled(false)
        .setEmoji("⏭️")
    if(disabled) skipButton.setDisabled(true);

    const stopButton = new MessageButton()
        .setCustomId(`buttonStop-${guild.id}`)
        .setLabel("Stop")
        .setStyle("PRIMARY")
        .setDisabled(false)
        .setEmoji("⏹️")
    if(disabled) stopButton.setDisabled(true);

    const loopButton = new MessageButton()
        .setCustomId(`buttonLoop-${guild.id}`)
        .setLabel(`Loop`)
        .setStyle("DANGER")
        .setDisabled(false)
        .setEmoji("🔁")
    if(loop) loopButton.setStyle("SUCCESS");
    if(disabled) loopButton.setDisabled(true);

    const shuffleButton = new MessageButton()
        .setCustomId(`buttonShuffle-${guild.id}`)
        .setLabel(`Shuffle`)
        .setStyle("DANGER")
        .setDisabled(false)
        .setEmoji("🔀")
    if(shuffle) shuffleButton.setStyle("SUCCESS");
    if(disabled) shuffleButton.setDisabled(true);
    
    return new MessageActionRow().addComponents(playPauseButton, skipButton, stopButton, loopButton, shuffleButton);
}

const generate_queue_buttons = (queue: [Song[]], currentpage: number, guild: Guild): MessageActionRow | null => {
    if(!queue?.length || checkQueueLength(queue) <= 25 || queue.length === 1) return null;
    const skipToFirst = new MessageButton()
        .setCustomId(`buttonFirstPageQueue-${guild.id}`)
        .setLabel(`First Page`)
        .setStyle("PRIMARY")
        .setEmoji("⏮️")
        
    const nextPageButton = new MessageButton()
        .setCustomId(`buttonNextPageQueue-${guild.id}`)
        .setLabel(`Next Page`)
        .setStyle("PRIMARY")
        .setEmoji("▶️")

    const prevPageButton = new MessageButton()
        .setCustomId(`buttonPrevPageQueue-${guild.id}`)
        .setLabel(`Previous Page`)
        .setStyle("PRIMARY")
        .setEmoji("◀️")
    
    const skipToLast = new MessageButton()
        .setCustomId(`buttonLastPageQueue-${guild.id}`)
        .setLabel(`Last Page`)
        .setStyle("PRIMARY")
        .setEmoji("⏭️");
    
    //Only return buttons when necessary
    if(queue.length === 2){
        if(currentpage === 0) return new MessageActionRow().addComponents(nextPageButton);
        else return new MessageActionRow().addComponents(prevPageButton);
    }
    else if(queue.length >= 3) {
        if(currentpage === 0) return new MessageActionRow().addComponents(nextPageButton, skipToLast);
        else if(currentpage === (queue.length - 1)) return new MessageActionRow().addComponents(skipToFirst, prevPageButton);
        else if((currentpage + 1) === (queue.length - 1)) return new MessageActionRow().addComponents(skipToFirst, prevPageButton, nextPageButton);
        else if((currentpage - 1) === 0) return new MessageActionRow().addComponents(prevPageButton, nextPageButton, skipToLast);
        else return new MessageActionRow().addComponents(skipToFirst, prevPageButton, nextPageButton, skipToLast);
    }
    return null;
}

const generate_current_queue_list = (queue: [Song[]], currentpage: number, guild: Guild, type: "SELECT" | "REMOVE" | "SWAP"): MessageActionRow => {

    const placeHolderText = type === "SELECT" ? `Select a song from Song Queue. Page: ${currentpage + 1}/${queue.length}` : type === "REMOVE" ? `Remove multiple songs from Song Queue. Page: ${currentpage + 1}/${queue.length}` : `Swap places with two songs. Page: ${currentpage + 1}/${queue.length}`;
    const customId = type === "SELECT" ? `selectSongQueue-${guild.id}` : type === "REMOVE" ? `removeSongQueue-${guild.id}` : `swapSongQueue-${guild.id}`;

    const selectMenu = new MessageSelectMenu()
        .setCustomId(`selectSongQueue-${guild.id}`)
        .setPlaceholder("Song Queue")
        .setDisabled(true)

    if(queue.length <= 1 && !checkQueueLength(queue)) 
        return new MessageActionRow()
            .addComponents(selectMenu.addOptions({label: "placeholder", description: "placeholder description", value: "placeholder_value"}))
    
    selectMenu
        .setCustomId(customId)
        .setPlaceholder(placeHolderText)
        .setDisabled(false)
        .addOptions(queue[currentpage].map((q, i) => ({
            label: `${(i+1) + (currentpage * 25)}.) ${q.title}`, 
            description: `${guild.members.cache.get(q.who_queued_id)?.user.username ?? "unknown"} - ${q.length}`, 
            value: `${i}-${q.link}`}))
        )
    type === "REMOVE" && queue[currentpage].length ? selectMenu.setMinValues(1).setMaxValues(queue[currentpage].length) : type === "SWAP" && queue[currentpage].length >= 2 ? selectMenu.setMinValues(1).setMaxValues(2) : ``;
    
    return new MessageActionRow().addComponents(selectMenu);
}

const generate_new_select_buttons = (buttonSelect: boolean, buttonRemove: boolean, buttonSwap: boolean, guild: Guild, queue: [Song[]], currentPage: number, disabled: boolean): MessageActionRow => {
    const queuelength = checkQueueLength(queue);

    const selectButton = new MessageButton()
        .setCustomId(`buttonSelect-${guild.id}`)
        .setLabel("Select Song")
        .setEmoji("✅");
    buttonSelect ? selectButton.setStyle("SUCCESS") : selectButton.setStyle("DANGER");
    if(!queuelength) selectButton.setDisabled(true)
    else disabled ? selectButton.setDisabled(true) : selectButton.setDisabled(false);

    const removeButton = new MessageButton()
        .setCustomId(`buttonRemove-${guild.id}`)
        .setLabel("Remove Songs")
        .setEmoji("❌");
    buttonRemove ? removeButton.setStyle("SUCCESS") : removeButton.setStyle("DANGER");
    if(!queuelength) removeButton.setDisabled(true)
    else disabled ? removeButton.setDisabled(true) : removeButton.setDisabled(false);

    const swapButton = new MessageButton()
        .setCustomId(`buttonSwap-${guild.id}`)
        .setLabel("Swap Songs")
        .setEmoji("🔃");
    buttonSwap ? swapButton.setStyle("SUCCESS") : swapButton.setStyle("DANGER");
    if(queuelength <= 1 || queue[currentPage].length <= 1) swapButton.setDisabled(true)
    else disabled ? swapButton.setDisabled(true) : swapButton.setDisabled(false);
    
    return new MessageActionRow()
        .addComponents(selectButton, removeButton, swapButton)
}

export async function create_seek_readble(readable: internal.Readable, time: number): Promise<internal.Writable | null>{
    if(!readable) return null;
    const command = ffmpeg({ source: readable });
    const writable = new Writable();
    return new Promise((resolve, reject) => {
        command
            .withNoVideo()
            .withAudioCodec('libmp3lame')
            .toFormat('mp3')
            .setDuration(time)
            .on("error", err => {
                console.error(`ffmpeg error: ${err}`);
                reject(null);
            })
            .on("end", () => {
                console.log(`Done with seeking!`);
                resolve(writable);
            })
            .writeToStream(writable, {end: true});
    })
}

export async function create_readable(song: Song): Promise<internal.Readable | null> {
    if(!song) return null;
    return await ytdl(song.link, {
        filter: format => 
               format.container === 'mp4' 
            && format.audioQuality === 'AUDIO_QUALITY_MEDIUM',
        highWaterMark: 1<<25
    });
}

export async function probeAndCreateResource(song: Song): Promise<AudioResource<Song> | null>{
    const readable = await create_readable(song);
    if(!readable) return null;
    return createAudioResource(readable, { metadata: song });
}

export const validate_search = (search_term: string): search_type => {
    if (validateID(search_term)) return "YOUTUBE_PLAYLIST";
    else if(validateURL(search_term)) return "YOUTUBE";
    else return "YOUTUBE_SEARCH";
}

export const getSongInfo = async (search_term: string, type: search_type, author: string): Promise<Song[] | null> => {

    let search = search_term;

    let song: any = {
        title: "",
        link: "",
        length: "",
        unique_id: "", //Probably indexed based on queue
        who_queued_id: author,
        type: "",
        looped: false
    }

    const songs: Song[] = [];

    switch(type){
        case 'YOUTUBE_SEARCH':
            try{
                console.time("search");
                const stringSearch = await ytsr(search, {limit: 1});
                if(!stringSearch.items.length) return null;
                const { url } = stringSearch.items[0] as any;
                if(!url) return null;
                const searchSong = await getBasicInfo(url);
                if(!searchSong) return null;
                const { title, link, duration, details } = process_basic_info(searchSong);
                Object.assign(song, {title, link, length: duration, details, type: type});
                songs.push(song);
                console.timeEnd("search");
            }catch(err){
                console.error(err);
                return null;
            }
        break;

        case 'YOUTUBE':
            try{
                const songInfo: any = await getBasicInfo(search);
                if(!songInfo) return null;
                const { title, link, duration, details } = process_basic_info(songInfo);
                Object.assign(song, {title, link, length: duration, details, type: type});
                songs.push(song);
            }catch(err){
                console.error(err);
                return null;
            }
        break;
            
        case 'YOUTUBE_PLAYLIST':
            try{
                console.time("playlist")
                const parsedId = await getPlaylistID(search);
                if(!parsedId) return null;
                const playList = await ytpl(parsedId);
                if(!playList) return null;
                const { items, continuation } = playList;
                for(const item of items){
                    const { title, shortUrl, duration, durationSec } = item;
                    songs.push({title, link: shortUrl, length: duration as string, details: {lengthSeconds: `${durationSec}`}, looped: false, search_type: "YOUTUBE_PLAYLIST", unique_id: "", who_queued_id: author, playlistname: playList.title});
                }
                console.timeEnd("playlist");
            }
            catch(err){
                console.error(err);
                return null;
            }
        break;

        default:
            return null;
    }

    return songs;
}

export const process_basic_info = (info: any): any => {
    const { videoDetails } = info;
    const { title, lengthSeconds, videoId } = videoDetails;

    let hours = Math.floor(parseFloat(lengthSeconds) / 3600)
    let minutes = (Math.floor((parseFloat(lengthSeconds) / 60)) % 60)
    let seconds = (parseFloat(lengthSeconds) % 60);

    const duration = `${
        hours > 0 
            ? `${`${hours}`.padStart(2, "0")}:${`${minutes}`.padStart(2, "0")}:${`${seconds}`.padStart(2, "0")}` : 
        minutes > 0 
            ? `${`${minutes}`.padStart(2, "0")}:${`${seconds}`.padStart(2, "0")}`: 
        `0:${`${seconds}`.padStart(2, "0")}` }`

    return {
        title: title,
        link: `https://www.youtube.com/watch?v=${videoId}`,
        duration: duration,
        details: videoDetails ?? null
    }
}