import { Guild, VoiceChannel, Interaction, GuildChannel, TextChannel, MessageButton, MessageActionRow, MessageSelectMenu, Message } from "discord.js";
import { 
    joinVoiceChannel, 
    getVoiceConnection, 
    createAudioPlayer, 
    NoSubscriberBehavior, 
    createAudioResource, 
    AudioResource,
    AudioPlayer,
    AudioPlayerStatus,
} from "@discordjs/voice";
import { MusicChannel, MusicConstructorInterface, Song, VideoDetails } from "../../interfaces/music.interface";
import ytsr from "ytsr";
import ytdl, { validateURL, getBasicInfo } from "ytdl-core-discord";
import { createReadStream } from "fs";
import Modified_Client from "../../methods/client/Client";

export class MusicConstructor implements MusicConstructorInterface {

    public client: Modified_Client;
    public guild: Guild
    public musicChannel: MusicChannel;
    public queue: Song[];

    public shuffle: boolean;
    public loop: boolean;
    public paused: boolean;

    public channel: VoiceChannel | null;
    public player: AudioPlayer | null;
    public current_song: Song | null;

    constructor(client: Modified_Client,guild: Guild, musicChannel: MusicChannel){
        this.client = client;
        this.guild = guild;
        this.musicChannel = musicChannel;
        this.queue = [];

        this.shuffle = false;
        this.loop = false;
        this.paused = false;

        this.current_song = null;
        this.channel = null;
        this.player = null;
    }

    async play(): Promise<void>{
        let connection = getVoiceConnection(this.guild.id);
        if(!connection && this.channel) connection = joinVoiceChannel({
            channelId: this.channel.id,
            guildId: this.guild.id,
            adapterCreator: this.channel.guild.voiceAdapterCreator
        });
        if(!connection || !this.queue.length) return this.stop();

        this.current_song = this.queue.shift() as Song;
        console.log("play ", this.current_song ? true : false)
        if(!this.current_song?.link) return this.play();

        const resource = await probeAndCreateResource(this.current_song);
        
        this.player = createAudioPlayer({
            debug: true,
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause
            }
        });

        this.player.on("error", err => {
            console.error(err);
            this.play();
        })

        this.player.on("stateChange", (oldState, newState) => {
            switch(newState.status){
                case AudioPlayerStatus.Playing: 
                    console.log('The audio player has started playing!');
                    if(oldState.status !== AudioPlayerStatus.Paused) this.update_embed("NOWPLAYING");
                break;

                case AudioPlayerStatus.Idle:
                    console.log('Player is idle!');
                    this.current_song = null;
                    if(this.queue.length) this.update_embed("CHANGING");
                    this.play();
                break;
            }
        })

        if(connection && this.player && resource) {
            //console.log(resource, this.player, connection);
            connection.subscribe(this.player);
            this.player.play(resource);
        }
    }
    stop(interaction?: Interaction){ 
        const connection = getVoiceConnection(this.guild.id);
        if(!connection) return;
        connection.destroy();
        if(interaction){
            //Do embed stuff since a user manually stopped
            return this.update_embed("STOPPED");
        }
    }
    skip(interaction?: Interaction){
        if(this.player) {
            if(!this.queue.length) this.update_embed("STOPPED");
            return this.player.stop();
        }
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
    seek(){

    }
    shift(index: number){
        const song = this.queue.splice(index, 1)[0];
        if(song) {
            this.update_embed("CHANGING");
            this.queue.unshift(song);
            this.skip();
        }
    }
    add_queue(song: Song){
        if(!song) return;
        console.log(this.queue.length, this.current_song ? true : false)
        if(!this.player && !this.queue.length && !this.current_song){
            this.queue.push(song);
            return this.play();
        }else {
            this.queue.push(song);
            this.update_embed("QUEUE");
        }
    }
    remove_queue(song: Song){
        if(song.link === this.current_song?.link && this.queue.some(s => s.link !== song.link)) this.skip();
        this.queue = this.queue.filter(s => s.link !== song.link);
        this.update_embed("QUEUE");
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
        const [ buttonRows, selectMenu ] = message.components;
        const [ buttonPlayPause, buttonSkip, buttonStop, buttonLoop, buttonShuffle ] = buttonRows.components;
        const [ queue ] = selectMenu.components;
        switch(state){
            case 'NOWPLAYING':
                const npEmbed = embed
                    //Description could have a progressbar that updates, add an image as an album cover maybe
                    .setTitle(`Now playing: `)
                    .setDescription(`\`\`\`ini\n▶️ ${this.current_song?.title ?? "Unkown"} | ${this.current_song?.length ?? "Unknown"}\n\nProgress bar\n\n${this.queue.length === 1 ? `${this.queue.length} song remaining.` : `${this.queue.length} songs remaining.`}\`\`\``)
                    .setColor("DARK_GREEN")
                    .setFooter(`Requested by: ${this.guild.members.cache.get(this.current_song?.who_queued_id ?? "")?.user.username ?? "Unknown"}`)
                    .setTimestamp()
                const nowPlayingQueue = new MessageSelectMenu().setCustomId(`selectSongQueue-${this.guild.id}`).setPlaceholder(`Song Queue`);
                this.queue.length
                    ? nowPlayingQueue.addOptions(this.queue.map((q, i) => ({
                        label: `${i+1}.) ${q.title}`, 
                        description: `${this.guild.members.cache.get(q.who_queued_id)?.user.username ?? "unknown"} - ${q.length}`, 
                        value: `${i}-${q.link}`}))) 
                    : nowPlayingQueue.addOptions({label: "placeholder", description: "placeholder description", value: "placeholder_value"}).setDisabled(true);
                const nowPlayingComp = new MessageActionRow().addComponents(
                        buttonPlayPause.setDisabled(false), buttonSkip.setDisabled(false), buttonStop.setDisabled(false), buttonLoop.setDisabled(false), buttonShuffle.setDisabled(false)
                    );
                await message.edit({embeds: [npEmbed], components: [nowPlayingComp, new MessageActionRow().addComponents(nowPlayingQueue)]});
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
                await message.edit({embeds: [pEmbed], components: [newComp, selectMenu]})
            break;
                
            case 'STOPPED':
                const stEmbed = embed
                    .setTitle(`Idle - Not playing anything`)
                    .setDescription(`
                    Use ${prefix ?? process.env.PREFIX}help music to display all available commands.
                    
                    To play something, use the play command as usual! The buttons below will help you navigate through songs easier.
                    
                    You can pause/resume, skip and stop the bot. You can also toggle Loop and shuffle with the buttons! 
                    
                    The Song Queue will show up songs queued up to 25 songs. If you select any of the songs in the queue, you will play that song! Do note that the current song will be skipped.
                
                    If the buttons are not to your liking, you can always use the usual commands.
                    `)
                    .setColor("BLUE")
                    .setFooter(``)
                    .setTimestamp()
                    const newbuttonRows = new MessageActionRow().addComponents(buttonRows.components.map(comp => comp.setDisabled(true)));
                    const newQueue = new MessageActionRow().addComponents(queue.setDisabled(true));
                await message.edit({embeds: [stEmbed], components: [newbuttonRows, newQueue]})
            break;

            case 'QUEUE':
                const queueEmbed = embed
                //Description could have a progressbar that updates, add an image as an album cover maybe
                    .setTitle(`Now playing: `)
                    .setDescription(`\`\`\`ini\n▶️ ${this.current_song?.title ?? "Unkown"} | ${this.current_song?.length ?? "Unknown"}\n\nProgress bar\n\n${this.queue.length === 1 ? `${this.queue.length} song remaining.` : `${this.queue.length} songs remaining.`}\`\`\``)
                    .setColor("DARK_GREEN")
                    .setFooter(`Requested by: ${this.guild.members.cache.get(this.current_song?.who_queued_id ?? "")?.user.username ?? "Unknown"}`)
                    .setTimestamp()
                const updatedQueue = new MessageSelectMenu().setCustomId(`selectSongQueue-${this.guild.id}`).setPlaceholder(`Song Queue`);
                this.queue.length 
                    ? updatedQueue.addOptions(this.queue.map((q, i) => ({
                        label: `${i+1}.) ${q.title}`, 
                        description: `${this.guild.members.cache.get(q.who_queued_id)?.user.username ?? "unknown"} - ${q.length}`, 
                        value: `${i}-${q.link}`}))) 
                    : updatedQueue.addOptions({label: "placeholder", description: "placeholder description", value: "placeholder_value"}).setDisabled(true);
                await message.edit({embeds: [embed], components: [buttonRows, new MessageActionRow().addComponents(updatedQueue)]})
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
                await message.edit({embeds: [embed], components: [newShuComp, selectMenu]})
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
            await message.edit({embeds: [embed], components: [newLoopComp, selectMenu]})
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
                await message.edit({embeds: [changingEmbed], components: [changingButtons, changingQueue]});
            break;

            default:

            break;
        }
    }
}

const createEmbedAndComponents = () => {
    
}


type embed_state = "NOWPLAYING" | "PAUSED" | "STOPPED"  | "QUEUE" | "SHUFFLE" | "LOOP" | "CHANGING"

export async function probeAndCreateResource(song: Song): Promise<AudioResource<Song>>{
    console.time("probeAndCreateResource");
    const readable = await ytdl(song.link, {
        filter: format => 
               format.container === 'mp4' 
            && format.audioQuality === 'AUDIO_QUALITY_MEDIUM'
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
    const duration = `${hours > 0 ? `${hours}:${`${minutes}`.padStart(2, "0")}:${seconds}` : `${minutes > 0}` ? `${minutes}:${seconds}`: `0:${seconds}` }`
    Object.assign(song, {title, link: `https://www.youtube.com/watch?v=${videoId}`, length: duration, details: songInfo.videoDetails });
    console.timeEnd("getSongInfo");
    return song as Song;
}