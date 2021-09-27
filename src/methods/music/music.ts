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
import { MusicChannel, MusicConstructorInterface, Song, VideoDetails, embed_state } from "../../interfaces/music.interface";
import ytsr from "ytsr";
import ytdl, { validateURL, getBasicInfo } from "ytdl-core-discord";
import Modified_Client from "../../methods/client/Client";
import { shuffle } from "../shuffle";

export class MusicConstructor implements MusicConstructorInterface {

    public client: Modified_Client;
    public guild: Guild
    public musicChannel: MusicChannel;
    public queue: Song[];

    public select: boolean;
    public remove: boolean;
    public swap: boolean;

    public shuffle: boolean;
    public loop: boolean;
    public paused: boolean;

    public seeking: boolean;
    public channel: VoiceChannel | null;
    public player: AudioPlayer | null;
    public current_song: Song | null;
    public resource: AudioResource<Song> | null;

    constructor(client: Modified_Client,guild: Guild, musicChannel: MusicChannel){
        this.client = client;
        this.guild = guild;
        this.musicChannel = musicChannel;
        this.queue = [];

        //Songqueue state
        this.select = true;
        this.remove = false;
        this.swap = false;

        this.shuffle = false;
        this.loop = false;
        this.paused = false;

        this.seeking = false;
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
        if(!connection || !this.queue.length) return this.stop(undefined, true);

        let current_song: Song | null = null;
        if(this.shuffle){
            const randomIndex = shuffle(this.queue.length, 1) as number;
            current_song = this.queue.splice(randomIndex, 1)[0];
        }else current_song = this.queue.shift() as Song;

        if(!current_song?.link) return this.play();

        let interval: NodeJS.Timeout | null = null;
        let resource = null;
        if(this.seeking){
            resource = null;
            //Do something
        }
        else resource = await probeAndCreateResource(current_song);

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            this.stop(undefined, true);
        })

        const player = createAudioPlayer({
            debug: true,
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause
            }
        });
        player.on("error", err => {
            console.log(`Error`)
            console.error(err);
            this.play();
        })
        player.on("stateChange", (oldState, newState) => {
            switch(newState.status){
                case AudioPlayerStatus.Playing: 
                    console.log('The audio player has started playing!');
                    if(oldState.status !== AudioPlayerStatus.Paused) {
                        this.update_embed("NOWPLAYING");
                        let previousCheck = 0;
                        interval = setInterval(() => {
                            const duration = update_every_tick(this.player as AudioPlayer);
                            if(duration > previousCheck) {
                                previousCheck = duration;
                                this.update_embed("NOWPLAYING");
                            }
                        }, 5000)
                    }
                break;
                
                case AudioPlayerStatus.Idle:
                    console.log('Player is idle!');
                    if(interval) clearInterval(interval);
                    if(this.loop) {
                        const currentSong = this.current_song as Song;
                        Object.assign(currentSong, {looped: true});
                        this.queue.push(currentSong);
                    }
                    this.current_song = null;
                    if(this.queue.length) this.update_embed("CHANGING");
                    this.play();
                break;
            }
        })
        //console.log(connection, this.player, this.resource)
        if(connection && player && resource) {
            this.current_song = current_song;
            this.player = player;
            this.resource = resource;
            connection.subscribe(this.player);
            this.player.play(this.resource);
        }
    }
    stop(interaction?: Interaction, leave?: boolean){ 
        const connection = getVoiceConnection(this.guild.id);
        if(!connection) return;
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
            return this.update_embed("PAUSED")
        }
        else if(this.player && !this.paused) {
            this.player.pause();
            this.paused = true;
            return this.update_embed("PAUSED");
        }
        else return;
    }
    async seek(time_s: number){
        if(!this.current_song) return;
        /*const readable = await ytdl(this.current_song.link, {
            filter: format => 
                   format.container === 'mp4' 
                && format.audioQuality === 'AUDIO_QUALITY_MEDIUM',
            highWaterMark: 1<<25
        });
        const output = new WriteStream()
        
        const stream = new FfmpegCommand({ source: readable })
            .withNoVideo()
            .setStartTime(time_s)
            .withAudioCodec('libmp3lame')
            .toFormat('mp3')
            .output(output)
            .run();

        const readStream = */

        //const resource = createAudioResource(output, { metadata: this.current_song })
    }
    shift(index: number){
        const song = this.queue.splice(index, 1)[0];
        if(song) {
            this.update_embed("CHANGING");
            this.queue.unshift(song);
            this.skip();
        }
    }
    async add_queue(song: Song): Promise<void>{
        if(!song) return;
        //console.log(this.player, this.queue.length, this.current_song?.title)
        if(!this.player && !this.queue.length && !this.current_song){
            this.queue.push(song);
            return await this.play();
        }else {
            this.queue.push(song);
            this.update_embed("QUEUE");
        }
    }
    swap_songs(song1: number, song2: number){
        [this.queue[song1], this.queue[song2]] = [this.queue[song2], this.queue[song1]];
        this.update_embed("QUEUE");
    }
    remove_queue(index: number, updateEmbed: boolean){
        //if(song.link === this.current_song?.link && this.queue.some(s => s.link !== song.link)) this.skip();
        //this.queue = this.queue.filter(s => s.link !== song.link);
        this.queue.splice(index, 1);
        if(updateEmbed) this.update_embed("QUEUE");
    }
    queue_state(state: "SELECT" | "REMOVE" | "SWAP", interaction?: Interaction){
        switch(state){
            case 'SELECT':
                this.select = true;
                this.remove = false;
                this.swap = false;
            break;

            case 'REMOVE':
                if(!this.queue.length) return;
                this.select = false;
                this.remove = true;
                this.swap = false;
            break;

            case 'SWAP':
                if(this.queue.length <= 1 ) return;
                this.select = false;
                this.remove = false;
                this.swap = true;

            break;
            default: return;
        }
        if(interaction && this.player) this.update_embed("QUEUE");
        
    }
    get_current_channel(): VoiceChannel | null{
        return this.channel;
    }
    set_current_channel(channel: VoiceChannel){
        this.channel = channel;
        if(this.channel === null) this.stop();
    }
    toggle_shuffle(interaction: Interaction){
        if(this.player && this.shuffle){
            this.shuffle = false;
            this.update_embed("SHUFFLE");
        }
        else if(this.player && !this.shuffle){
            this.shuffle = true;
            this.update_embed("SHUFFLE");
        }
        else return;
    }
    toggle_loop(interaction: Interaction){
        if(this.player && this.loop){
            this.loop = false;
            //const songsWithoutLoop = this.queue.filter(song => !song.looped);
            //this.queue = songsWithoutLoop;
            this.update_embed("LOOP");
        }
        else if(this.player && !this.loop){
            this.loop = true;
            this.update_embed("LOOP");
        }
        else return;
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
        const [ buttonRows, selectMenu, selectButtons ] = message.components;
        const [ buttonPlayPause, buttonSkip, buttonStop, buttonLoop, buttonShuffle ] = buttonRows.components;
        const [ queue ] = selectMenu.components;
        const [ selectButton, removeButton, swapButton ] = selectButtons.components;
        switch(state){
            case 'NOWPLAYING':
                const npprogressBar = generate_progress_bar(this.player as AudioPlayer);
                const npEmbed = embed
                    //Description could have a progressbar that updates, add an image as an album cover maybe
                    .setTitle(`🎵 Now playing 🎵 `)
                    .setDescription(`\`\`\`ini\n▶️ ${this.current_song?.title ?? "Unkown"} | ${this.current_song?.length ?? "Unknown"}\n\n${npprogressBar}\n\n${this.queue.length === 1 ? `${this.queue.length} song remaining.` : `${this.queue.length} songs remaining.`}\`\`\``)
                    .setColor("DARK_GREEN")
                    .setFooter(`Requested by: ${this.guild.members.cache.get(this.current_song?.who_queued_id ?? "")?.user.username ?? "Unknown"}`)
                    .setTimestamp()
                const npPlaceHolderText = this.select ? `Select a song from Song Queue` : this.remove ? `Remove multiple songs from Song Queue` : `Swap places with two songs`;
                const npCustomId = this.select ? `selectSongQueue-${this.guild.id}` : this.remove ? `removeSongQueue-${this.guild.id}` : `swapSongQueue-${this.guild.id}`;
                const nowPlayingQueue = new MessageSelectMenu().setCustomId(npCustomId).setPlaceholder(npPlaceHolderText);
                this.remove && this.queue.length ? nowPlayingQueue.setMinValues(1).setMaxValues(this.queue.length) : this.swap && this.queue.length >= 1 ? nowPlayingQueue.setMinValues(1).setMaxValues(2) : ``;
                this.queue.length
                    ? nowPlayingQueue.addOptions(this.queue.map((q, i) => ({
                        label: `${i+1}.) ${q.title}`, 
                        description: `${this.guild.members.cache.get(q.who_queued_id)?.user.username ?? "unknown"} - ${q.length}`, 
                        value: `${i}-${q.link}`}))) 
                    : nowPlayingQueue.addOptions({label: "placeholder", description: "placeholder description", value: "placeholder_value"}).setDisabled(true);
                const nowPlayingComp = new MessageActionRow().addComponents(
                        buttonPlayPause.setDisabled(false), buttonSkip.setDisabled(false), buttonStop.setDisabled(false), buttonLoop.setDisabled(false), buttonShuffle.setDisabled(false)
                    );
                const nowplayingSelectButtons = this.queue.length 
                    ? generate_new_select_buttons(this.select, this.remove, this.swap, this.guild, false, this.queue.length)
                    : generate_new_select_buttons(this.select, this.remove, this.swap, this.guild, true)
                await message.edit({embeds: [npEmbed], components: [nowPlayingComp, new MessageActionRow().addComponents(nowPlayingQueue), nowplayingSelectButtons]});
            break;
            
            case 'PAUSED':
                const pEmbed = this.paused ? embed.setColor("DARK_RED") : embed.setColor("DARK_GREEN");
                const newPause = new MessageButton()
                    .setCustomId(`buttonPlayPause-${this.guild.id}`)
                    .setStyle("PRIMARY")
                    .setEmoji("⏯️")
                this.paused ? newPause.setLabel("Resume").setStyle("DANGER") : newPause.setLabel("Pause").setStyle("PRIMARY");
                const newComp = new MessageActionRow().addComponents(
                        newPause.setDisabled(false), buttonSkip.setDisabled(false), buttonStop.setDisabled(false), buttonLoop.setDisabled(false), buttonShuffle.setDisabled(false)
                    );
                await message.edit({embeds: [pEmbed], components: [newComp, selectMenu, selectButtons]})
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
                    const newbuttonRows = new MessageActionRow().addComponents(buttonRows.components.map(comp => comp.setDisabled(true)));
                    const newQueue = new MessageActionRow().addComponents(queue.setDisabled(true));
                    const stoppedSelectButtons = generate_new_select_buttons(true, false, false, this.guild, true);

                await message.edit({embeds: [stEmbed], components: [newbuttonRows, newQueue, stoppedSelectButtons]})
            break;

            case 'QUEUE':
                const qprogressBar = generate_progress_bar(this.player as AudioPlayer);
                const queueEmbed = embed
                //Description could have a progressbar that updates, add an image as an album cover maybe
                    .setTitle(`🎵 Now playing 🎵`)
                    .setDescription(`\`\`\`ini\n▶️ ${this.current_song?.title ?? "Unkown"} | ${this.current_song?.length ?? "Unknown"}\n\n${qprogressBar}\n\n${this.queue.length === 1 ? `${this.queue.length} song remaining.` : `${this.queue.length} songs remaining.`}\`\`\``)
                    .setColor("DARK_GREEN")
                    .setFooter(`Requested by: ${this.guild.members.cache.get(this.current_song?.who_queued_id ?? "")?.user.username ?? "Unknown"}`)
                    .setTimestamp()
                const placeHolderText = this.select ? `Select a song from Song Queue` : this.remove ? `Remove multiple songs from Song Queue` : `Swap places with two songs`;
                const customId = this.select ? `selectSongQueue-${this.guild.id}` : this.remove ? `removeSongQueue-${this.guild.id}` : `swapSongQueue-${this.guild.id}`;
                const updatedQueue = new MessageSelectMenu().setCustomId(customId).setPlaceholder(placeHolderText);
                this.remove && this.queue.length ? updatedQueue.setMinValues(1).setMaxValues(this.queue.length) : this.swap && this.queue.length >= 1 ? updatedQueue.setMinValues(1).setMaxValues(2) : ``;
                this.queue.length
                    ? updatedQueue.addOptions(this.queue.map((q, i) => ({
                        label: `${i+1}.) ${q.title}`, 
                        description: `${this.guild.members.cache.get(q.who_queued_id)?.user.username ?? "unknown"} - ${q.length}`, 
                        value: `${i}-${q.link}`}))) 
                    : updatedQueue.addOptions({label: "placeholder", description: "placeholder description", value: "placeholder_value"}).setDisabled(true);
                const queueSelectButtons = generate_new_select_buttons(this.select, this.remove, this.swap, this.guild, false, this.queue.length);
                await message.edit({embeds: [queueEmbed], components: [buttonRows, new MessageActionRow().addComponents(updatedQueue), queueSelectButtons]});
            break;
            
            case 'SHUFFLE':
                const newShuffle = new MessageButton()
                    .setCustomId(`buttonShuffle-${this.guild.id}`)
                    .setLabel(`Shuffle`)
                    .setEmoji("🔀")
                this.shuffle ? newShuffle.setStyle("SUCCESS") : newShuffle.setStyle("DANGER");
                const newShuComp = new MessageActionRow().addComponents(
                    buttonPlayPause.setDisabled(false), buttonSkip.setDisabled(false), buttonStop.setDisabled(false), buttonLoop.setDisabled(false), newShuffle.setDisabled(false)
                    );
                //Should update queue later as well for the new "shuffled" queue;
                await message.edit({embeds: [embed], components: [newShuComp, selectMenu, selectButtons]})
            break;
                
            case 'LOOP':
                const newLoop = new MessageButton()
                    .setCustomId(`buttonLoop-${this.guild.id}`)
                    .setLabel(`Loop`)
                    .setEmoji("🔄")
                this.loop ? newLoop.setStyle("SUCCESS") : newLoop.setStyle("DANGER");
                const newLoopComp = new MessageActionRow().addComponents(
                    buttonPlayPause.setDisabled(false), buttonSkip.setDisabled(false), buttonStop.setDisabled(false), newLoop.setDisabled(false), buttonShuffle.setDisabled(false)
                );
            //Should update queue later as well for the new "shuffled" queue;
            await message.edit({embeds: [embed], components: [newLoopComp, selectMenu, selectButtons]})
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
                const changingSelectButtons = generate_new_select_buttons(this.select, this.remove, this.swap, this.guild, true);
                await message.edit({embeds: [changingEmbed], components: [changingButtons, changingQueue, changingSelectButtons]});
            break;

            default:

            break;
        }
    }
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
    console.log(progress_based_on_40);
    const progressBar = new Array(40).fill("▬");
    progressBar[progress_based_on_40] = "🔘"
    return progressBar.join("");
}

const generate_new_select_buttons = (buttonSelect: boolean, buttonRemove: boolean, buttonSwap: boolean, guild: Guild, disabled: boolean, queuelength?: number): MessageActionRow => {
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
    if(queuelength ? queuelength as number <= 1 : queuelength === 0) swapButton.setDisabled(true)
    else disabled ? swapButton.setDisabled(true) : swapButton.setDisabled(false);
    
    return new MessageActionRow()
        .addComponents(selectButton, removeButton, swapButton)
}

export async function probeAndCreateResource(song: Song): Promise<AudioResource<Song>>{
    console.time("probeAndCreateResource");
    const readable = await ytdl(song.link, {
        filter: format => 
               format.container === 'mp4' 
            && format.audioQuality === 'AUDIO_QUALITY_MEDIUM',
        highWaterMark: 1<<25
    });
    //const chooseFormats = ytdl.chooseFormat(info.formats.filter(f => f.container === "mp4"), { quality: '134'});
    //const audioOnly = ytdl.filterFormats(chooseFormats, 'audioonly')
    //const readable = createReadStream('./media/soundboard/beko/33333.mp3')
    console.timeEnd("probeAndCreateResource");
    return createAudioResource(readable, { metadata: song });
}

export const getSongInfo = async (search_term: string, author: string): Promise<Song | null> => {

    console.time("getSongInfo");
    const validate = validateURL(search_term);
    let song: any = {
        title: "",
        link: "",
        length: "",
        unique_id: "", //Probably indexed based on queue
        who_queued_id: author,
        looped: false
    }
    let search = search_term;
    if(!validate){
        const stringSearch = await ytsr(search_term, {limit: 1});
        if(!stringSearch.items.length)
            return null;
        const { url } = <any>stringSearch.items[0];
        search = url;
    }
    
    const songInfo: any = await getBasicInfo(search);
    if(!songInfo) return null;
    const { title, lengthSeconds, videoId  } = <VideoDetails>songInfo.videoDetails;
    
    let hours = Math.floor(parseFloat(lengthSeconds) / 3600)
    let minutes = (Math.floor((parseFloat(lengthSeconds) / 60)) % 60)
    let seconds = (parseFloat(lengthSeconds) % 60);
    //console.log(hours, minutes, seconds);
    const duration = `${
        hours > 0 
            ? `${`${hours}`.padStart(2, "0")}:${`${minutes}`.padStart(2, "0")}:${`${seconds}`.padStart(2, "0")}` : 
        minutes > 0 
            ? `${`${minutes}`.padStart(2, "0")}:${`${seconds}`.padStart(2, "0")}`: 
        `0:${`${seconds}`.padStart(2, "0")}` }`

    Object.assign(song, {title, link: `https://www.youtube.com/watch?v=${videoId}`, length: duration, details: songInfo.videoDetails });
    console.timeEnd("getSongInfo");
    return song as Song;
}