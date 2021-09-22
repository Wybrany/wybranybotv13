import { Guild } from "discord.js";
import { MusicConstructorInterface, Song, VideoDetails } from "../../interfaces/music.interface";
import ytsr from "ytsr";
import ytdl, { validateURL, validateID, getBasicInfo } from "ytdl-core-discord";

export class MusicConstructor implements MusicConstructorInterface {
    public guild: Guild
    public queue: Song[];

    constructor(guild: Guild){
        this.guild = guild
        this.queue = [];
    }

    play(){
        
    }
    stop(){ 

    }
    pause(){

    }
    resume(){

    }
    seek(){

    }
    add_queue(){

    }
    remove_queue(){

    }
    show_queue(){
        
    }
    update_embed(){

    }
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