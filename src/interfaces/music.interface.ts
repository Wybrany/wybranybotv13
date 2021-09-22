import { Guild } from "discord.js";

export interface MusicChannel {
    guildid: string;
    channelid: string;
    embedid: string;
    buttons: EmbedButtons;
}

export interface EmbedButtons {
    playbutton: string;
    pausebutton: string;
    skipbutton: string;
}

export interface MusicConstructorInterface {

    guild: Guild;
    queue: Song[] | [];

    play: () => void;
    stop: () => void;
    pause: () => void;
    resume: () => void;
    seek: () => void;
    add_queue: () => void;
    remove_queue: () => void;
    show_queue: () => void;
    update_embed: () => void;
}

export interface Song {
    unique_id: string;
    title: string;
    link: string;
    length: string;
    who_queued_id: string;
    details: VideoDetails;
}

export interface VideoDetails {
    title: string;
    description: string;
    lengthSeconds: string;
    viewCount: string;
    category: string;
    publishDate: string;
    ownerChannelName: string;
    likes: number;
    dislikes: number;
    videoId: string,
    media: {
        song: string;
        category: string;
        artist: string;
        album: string;
    }
    author: {
        name: string;
        user: string;
        channel_url: string;
    }
}