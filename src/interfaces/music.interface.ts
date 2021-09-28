import { AudioPlayer, AudioResource } from "@discordjs/voice";
import { Guild, Interaction, VoiceChannel } from "discord.js";

export type MusicButtons = 
    "buttonPlayPause" | 
    "buttonSkip" | 
    "buttonStop" | 
    "buttonLoop" |
    "buttonShuffle" |
    "buttonSelect" |
    "buttonRemove" |
    "buttonSwap"

export interface MusicChannel {
    guildid: string;
    channelid: string;
    embedid: string;
    buttons: EmbedButtons;
    songqueue: SelectSongQueue;
    selectButtons: SelectButtons;
}

export interface SelectButtons {
    selectButton: string;
    removeButton: string;
    swapButton: string;
}

export interface SelectSongQueue{
    songqueue: string;
}

export interface EmbedButtons {
    playpausebutton: string;
    stopbutton: string;
    skipbutton: string;
    loopbutton: string;
    shufflebutton: string;
}

export type embed_state = "NOWPLAYING" | "PAUSED" | "STOPPED"  | "QUEUE" | "SHUFFLE" | "LOOP" | "CHANGING" | "SEEKING"

export interface MusicConstructorInterface {

    guild: Guild
    musicChannel: MusicChannel;
    queue: Song[];

    select: boolean;
    remove: boolean;
    swap: boolean;

    shuffle: boolean;
    loop: boolean;
    paused: boolean;

    seeking: boolean;
    seek_time: number;

    channel: VoiceChannel | null;
    player: AudioPlayer | null;
    current_song: Song | null;
    resource: AudioResource<Song> | null;

    play: () => void;
    stop: (interaction?: Interaction, leave?: boolean) => void;
    toggle_pause: (interaction: Interaction) => void;
    seek: (time_s: number) => void;
    skip: (interaction: Interaction) => void;
    shift: (index: number) => void;
    toggle_loop: (interaction: Interaction) => void;
    toggle_shuffle: (interaction: Interaction) =>  void;
    add_queue: (song: Song) => void;
    swap_songs: (song1: number, song2: number) => void;
    remove_queue: (index: number, updateEmbed: boolean) => void;
    queue_state: (state: "SELECT" | "REMOVE" | "SWAP", interaction?: Interaction) => void;
    update_embed: (state: embed_state) => void;
    get_current_channel: () => VoiceChannel | null;
    set_current_channel: (channel: VoiceChannel) => void;
}

export interface Song {
    unique_id: string;
    title: string;
    link: string;
    length: string;
    who_queued_id: string;
    looped: boolean;
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