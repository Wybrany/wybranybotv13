import { Interaction } from "discord.js";
import Modified_Client from "../client/Client";
import { EmbedState, ButtonSelectState, EmbedOptions, ActionRowOptions } from "discord-music-player";

export enum QueuePageState {
    FIRST,
    PREV,
    NEXT,
    LAST
}

export interface MusicOptions {
    embedOptions?: EmbedOptions;
    actionRowOptions?: ActionRowOptions;
}

export interface MusicChannel {
    guildid: string;
    channelid: string;
    embedid: string;
}

export interface MusicEmbedInterface {
    currentQueuePage: number;
    selectState: ButtonSelectState;

    stop(client: Modified_Client, interaction: Interaction): Promise<void>;
    skip(client: Modified_Client, interaction: Interaction, index?: number): Promise<void>;
    toggle_pause(client: Modified_Client, interaction: Interaction): Promise<void>;
    swap_songs(client: Modified_Client, interaction: Interaction, songs: number[]): Promise<void>;
    remove_songs(client: Modified_Client, interaction: Interaction, songs: number[]): Promise<void>;
    toggle_shuffle(client: Modified_Client, interaction: Interaction): Promise<void>;
    toggle_loop(client: Modified_Client, interaction: Interaction): Promise<void>;
    queue_page(client: Modified_Client, state: QueuePageState, interaction: Interaction): Promise<void>;
    queue_state(client: Modified_Client, state: ButtonSelectState, interaction: Interaction): Promise<void>;
    updateEmbed(client: Modified_Client, state: EmbedState, options?: MusicOptions): Promise<void>;
}