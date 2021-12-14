import { Guild, Interaction, MessageOptions, MessageActionRow } from "discord.js";
import Modified_Client from "../client/Client";
import { Song } from "discord-music-player";

export type MusicButtons = 
    "buttonPlayPause" | 
    "buttonSkip" | 
    "buttonStop" | 
    "buttonLoop" |
    "buttonShuffle" |
    "buttonSelect" |
    "buttonRemove" |
    "buttonSwap" |
    "buttonFirstPageQueue" |
    "buttonNextPageQueue" | 
    "buttonPrevPageQueue" |
    "buttonLastPageQueue";

export type QueuePageState = "FIRST" | "NEXT" | "PREV" | "LAST";
export type SelectStates = "SELECT" | "REMOVE" | "SWAP";
export type embedStates = "NOWPLAYING" | "STOPPED" | "CHANGING" | "SEEKING"

export interface MusicChannel {
    guildid: string;
    channelid: string;
    embedid: string;
}

export interface MusicEmbedInterface {
    guild: Guild;
    musicChannel: MusicChannel | null;

    currentQueuePage: number;
    unshuffledQueue: Song[];

    select: boolean;
    remove: boolean;
    swap: boolean;

    shuffle: boolean;
    loop: boolean;

    stop(client: Modified_Client, interaction: Interaction): Promise<void>;
    skip(client: Modified_Client, interaction: Interaction): Promise<void>;
    toggle_pause(client: Modified_Client, interaction: Interaction): Promise<void>;
    swap_songs(client: Modified_Client, interaction: Interaction, songs: number[]): Promise<void>;
    remove_songs(client: Modified_Client, interaction: Interaction, songs: number[]): Promise<void>;
    toggle_shuffle(client: Modified_Client, interaction: Interaction): Promise<void>;
    toggle_loop(client: Modified_Client, interaction: Interaction): Promise<void>;
    queue_page(client: Modified_Client, state: QueuePageState, interaction: Interaction): Promise<void>;
    queue_state(client: Modified_Client, state: SelectStates, interaction: Interaction): Promise<void>;
    updateEmbed(client: Modified_Client, state: embedStates): Promise<void>;
    generateMusicEmbeds(client: Modified_Client, state: embedStates): MessageOptions | null;
    generateQueueButtons(queue: Song[], currentpage: number, guild: Guild): MessageActionRow | null;
    generateSelectButtons(buttonSelect: boolean, buttonRemove: boolean, buttonSwap: boolean, guild: Guild, queue: Song[], currentPage: number, disabled: boolean): MessageActionRow;
    generateCurrentQueueList(queue: Song[], currentpage: number, guild: Guild, type: SelectStates): MessageActionRow;
    generateMusicButtons(paused: boolean, loop: boolean, shuffle: boolean, queue: Song[], guild: Guild, disabled: boolean): MessageActionRow;
    generate_progress_bar(song: Song): string;
}