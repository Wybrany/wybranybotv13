import { Guild, VoiceChannel } from "discord.js";
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
import { MusicConstructorInterface, Song, VideoDetails } from "../../interfaces/music.interface";
import ytsr from "ytsr";
import ytdl, { validateURL, getBasicInfo } from "ytdl-core-discord";

export class MusicConstructor implements MusicConstructorInterface {
    public guild: Guild
    public queue: Song[];
    public channel: VoiceChannel | null;
    public player: AudioPlayer | null;

    constructor(guild: Guild){
        this.guild = guild;
        this.queue = [];

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
        if(!connection) return this.stop();
        if(!this.queue.length) this.stop();

        const song = <Song>this.queue.shift();
        if(!song?.link) return this.play();

        const resource = await probeAndCreateResource(song);

        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause
            },
        });

        this.player.on("error", err => {
            console.error(err);
            this.play();
        })

        this.player.on(AudioPlayerStatus.Playing, () => {
            console.log('The audio player has started playing!');
        })

        this.player.on(AudioPlayerStatus.Idle, () => {
            console.log('Player is idle!');
            this.play();
        })

        this.player.on("stateChange", (olds, news) => {
        })

        if(connection && this.player && resource) {
            console.log(resource, this.player, connection);
            connection.subscribe(this.player);
            this.player.play(resource);
        }
    }
    stop(){ 
        const connection = getVoiceConnection(this.guild.id);
        if(!connection) return;
        connection.destroy();
    }
    pause(){
        if(this.player) this.player.pause();
    }
    resume(){
        if(this.player) this.player.unpause();
    }
    seek(){

    }
    add_queue(song: Song){
        if(!song) return;
        if(!this.queue.length){
            this.queue.push(song);
            return this.play();
        }
        this.queue.push(song);
    }
    remove_queue(song: Song){

    }
    update_embed(){

    }
    get_current_channel(): VoiceChannel | null{
        return this.channel;
    }
    set_current_channel(channel: VoiceChannel){
        this.channel = channel;
        if(this.channel === null) this.stop();
    }
}

export async function probeAndCreateResource(song: Song): Promise<AudioResource<Song>>{
    const readable = await ytdl(song.link);
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