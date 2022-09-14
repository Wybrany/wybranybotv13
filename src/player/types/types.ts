import {AudioPlayerError, AudioResource } from "@discordjs/voice";
import {ButtonStyle, ColorResolvable, User} from "discord.js";
import { Song, Queue, Playlist } from "..";

/**
 * Player options
 * @typedef {object} PlayerOptions
 * @param {boolean} [leaveOnEnd=true] If it should leave on end
 * @param {boolean} [leaveOnStop=true] If it should leave on stop
 * @param {boolean} [leaveOnEmpty=true] If it should leave on empty voice channel
 * @param {boolean} [deafenOnJoin=false] If it should deafen on join
 * @param {number} [timeout=0] Voice channel leave timeout
 * @param {number} [volume=100] Player volume
 * @param {string} [quality=high] Player quality
 * @param {string} [localAddress] Custom ipv4/ipv6 address
 * @param {string} [ytdlRequestOptions] Custom YTDL Request Options object
 */
export interface PlayerOptions {
    leaveOnEnd?: boolean,
    leaveOnStop?: boolean,
    leaveOnEmpty?: boolean,
    deafenOnJoin?: boolean,
    timeout?: number,
    volume?: number,
    quality?: 'low'|'high',
    localAddress?: string,
    ytdlRequestOptions?: object,
}

/**
 * Play options
 * @typedef {object} PlayOptions
 * @param {string} [uploadDate] Search sort by Upload date
 * @param {string} [duration] Search sort by Duration
 * @param {string} [sortBy=relevance] Search sort by Sort by
 * @param {boolean} [timecode=false] If url with timecode (?t=) provided, will play from that moment
 * @param {number} [index] If the index was provided, it will add the song after the provided index in the Queue
 * @param {User} [requestedBy] The User who requested the Song
 * @param {string} [localAddress] Custom ipv4/ipv6 address
 */
export interface PlayOptions {
    uploadDate?: 'hour'|'today'|'week'|'month'|'year',
    duration?: 'short'|'long',
    sortBy?: 'relevance'|'date'|'view count'|'rating',
    timecode?: boolean,
    index?: number;
    requestedBy?: User,
    localAddress?: string
};

/**
 * Playlist options
 * @typedef {object} PlaylistOptions
 * @param {number} [maxSongs=-1] Max songs
 * @param {User} [requestedBy] The User who requested the Song
 * @param {boolean} [shuffle=false] If it should shuffle the Songs
 * @param {number} [index] If the index was provided, it will add all songs of the playlist after the provided index in the Queue
 * @param {string} [localAddress] Custom ipv4/ipv6 address
 */
export interface PlaylistOptions {
    maxSongs?: number,
    requestedBy?: User,
    shuffle?: boolean,
    index?: number,
    localAddress?: string
};

/**
 * @typedef {object} ProgressBarOptions
 * @property {boolean} [time=true] If it should add time near the ProgressBar
 * @property {number} [size=20] Bar size
 * @property {string} [block==] Bar block
 * @property {string} [arrow=>] Bar ending
 */
export interface ProgressBarOptions {
    time?: boolean;
    size?: number;
    block?: string;
    arrow?: string;
}

/**
 * Raw Song object
 * @typedef {object} RawSong
 * @property {string} name
 * @property {string} author
 * @property {string} url
 * @property {string} thumbnail
 * @property {string} duration
 * @property {boolean} isLive
 */
export interface RawSong {
    name: string,
    author: string,
    url: string,
    thumbnail: string,
    duration: string,
    isLive: boolean
    seekTime?: number;
}

/**
 * Raw Playlist object
 * @typedef {object} PlayerOptions
 * @property {string} name
 * @property {string} author
 * @property {string} url
 * @property {Song[]} songs
 * @property {string} type
 */
export interface RawPlaylist {
    name: string,
    author: string,
    url: string,
    songs: Song[],
    type: 'playlist'|'album'
}

/**
 * The queue repeat mode.
 * Following modes exists:
 * - `OFF` = 0
 * - `SONG`  = 1
 * - `QUEUE` = 2
 * @typedef {number} RepeatMode
 */
export enum RepeatMode {
    DISABLED,
    SONG,
    QUEUE ,
}

/**
 * Emitted when StreamConnection started
 * @event StreamConnection#start
 * @param {AudioResource<Song>} AudioResource AudioResource
 */

/**
 * Emitted when StreamConnection ended
 * @event StreamConnection#end
 * @param {AudioResource<Song>} AudioResource AudioResource
 */

/**
 * Emitted when there was an error with the StreamConnection
 * @event StreamConnection#error
 * @param {AudioPlayerError} error AudioPlayerError
 */

export interface StreamConnectionEvents {
    start: [AudioResource<Song>];
    end: [AudioResource<Song>];
    error: [AudioPlayerError];
}

export interface RawApplePlaylist {
    name: string
    type: 'playlist'|'album'
    author: string
    tracks: { artist: string, title: string }[]
}

/**
 * Player options
 * @typedef {object} PlayerOptions
 * @param {boolean} [leaveOnEnd=true] If it should leave on end
 * @param {boolean} [leaveOnStop=true] If it should leave on stop
 * @param {boolean} [leaveOnEmpty=true] If it should leave on empty voice channel
 * @param {boolean} [deafenOnJoin=false] If it should deafen on join
 * @param {number} [timeout=0] Voice channel leave timeout
 * @param {number} [volume=100] Player volume
 * @param {string} [quality=high] Player quality
 * @param {string} [localAddress] Custom ipv4/ipv6 address
 * @param {string} [ytdlRequestOptions] Custom YTDL Request Options object
 */
export interface PlayerOptions {
    leaveOnEnd?: boolean,
    leaveOnStop?: boolean,
    leaveOnEmpty?: boolean,
    deafenOnJoin?: boolean,
    timeout?: number,
    volume?: number,
    quality?: 'low'|'high',
    localAddress?: string,
    ytdlRequestOptions?: object,
}

/**
 * Play options
 * @typedef {object} PlayOptions
 * @param {string} [uploadDate] Search sort by Upload date
 * @param {string} [duration] Search sort by Duration
 * @param {string} [sortBy=relevance] Search sort by Sort by
 * @param {boolean} [timecode=false] If url with timecode (?t=) provided, will play from that moment
 * @param {number} [index] If the index was provided, it will add the song after the provided index in the Queue
 * @param {User} [requestedBy] The User who requested the Song
 * @param {string} [localAddress] Custom ipv4/ipv6 address
 */
export interface PlayOptions {
    uploadDate?: 'hour'|'today'|'week'|'month'|'year',
    duration?: 'short'|'long',
    sortBy?: 'relevance'|'date'|'view count'|'rating',
    timecode?: boolean,
    index?: number;
    requestedBy?: User,
    localAddress?: string
};

/**
 * Playlist options
 * @typedef {object} PlaylistOptions
 * @param {number} [maxSongs=-1] Max songs
 * @param {User} [requestedBy] The User who requested the Song
 * @param {boolean} [shuffle=false] If it should shuffle the Songs
 * @param {string} [localAddress] Custom ipv4/ipv6 address
 */
export interface PlaylistOptions {
    maxSongs?: number,
    requestedBy?: User,
    shuffle?: boolean,
    localAddress?: string
};

/**
 * @typedef {object} ProgressBarOptions
 * @property {boolean} [time=true] If it should add time near the ProgressBar
 * @property {number} [size=20] Bar size
 * @property {string} [block==] Bar block
 * @property {string} [arrow=>] Bar ending
 * @property {string} [whitespace=true] Whitespace after arrow. Otherwise replace with blocks.
 */
export interface ProgressBarOptions {
    time?: boolean;
    size?: number;
    block?: string;
    arrow?: string;
    whitespace?: boolean;
}

/**
 * Embed states
 * Following modes exists:
 * - `NOWPLAYING` = 0
 * - `STOPPED`  = 1
 * - `PAUSED` = 2
 * - `CHANGING` = 3
 * @typedef {number} RepeatMode
 */
export enum EmbedState {
    NOWPLAYING,
    STOPPED,
    CHANGING,
    SEEKING
}

/**
 * @typedef {object} EmbedOptions
 * @property {EmbedState} [embedState=EmbedState.NOWPLAYING] Current state of the player
 */
export interface EmbedOptions {
    embedState?: EmbedState;
    progressBarOptions?: ProgressBarOptions;
    colorOverwrite?: ColorResolvable;
    description?: string;
    title?: string;
    footer?: string;
    timestamp?: boolean;
}

/**
 * Default player options object
 * @typedef {PlayerOptions}
 * @param {boolean} [leaveOnEnd=true] If it should leave on end
 * @param {boolean} [leaveOnStop=true] If it should leave on stop
 * @param {boolean} [leaveOnEmpty=true] If it should leave on empty voice channel
 * @param {boolean} [deafenOnJoin=false] If it should deafen on join
 * @param {number} [timeout=0] Voice channel leave timeout
 * @param {number} [volume=100] Player volume
 * @param {string} [quality=high] Player quality
 */
export const DefaultPlayerOptions: PlayerOptions = {
    leaveOnEnd: true,
    leaveOnStop: true,
    leaveOnEmpty: true,
    deafenOnJoin: false,
    timeout: 0,
    volume: 100,
    quality: 'high',
};

/**
 * Default play options object
 * @typedef {PlayOptions}
 * @param {string} [sortBy=relevance] Search sort by Sort by
 * @param {boolean} [timecode=false] If url with timecode (?t=) provided, will play from that moment
 */
export const DefaultPlayOptions: PlayOptions = {
    sortBy: 'relevance',
    timecode: false
};

/**
 * Default playlist options object
 * @typedef {PlaylistOptions}
 * @param {number} [maxSongs=-1] Max songs
 * @param {boolean} [shuffle=false] If it should shuffle the Songs
 */
export const DefaultPlaylistOptions: PlaylistOptions = {
    maxSongs: -1,
    shuffle: false,
};

/**
 * Default progress bar options object
 * @typedef {ProgressBarOptions}
 * @param {boolean} [time=true] If it should add time near the ProgressBar
 * @param {number} [size=20] Bar size
 * @param {string} [block==] Bar block
 * @param {string} [arrow=>] Bar ending
 * @param {boolean} [whitespace=true] Whitespace after arrow. Otherwise replace with blocks.
 */
export const DefaultProgressBarOptions: ProgressBarOptions = {
    time: true,
    size: 20,
    block: '=',
    arrow: '>',
    whitespace: true
}

/**
 * Default embed options object
 * @typedef {EmbedOptions}
 * @param {EmbedState} [embedState=EmbedState.NOWPLAYING] Current state of the player
 */
export const DefaultEmbedOptions: EmbedOptions = {
    embedState: EmbedState.NOWPLAYING,
    progressBarOptions: {
        ...DefaultProgressBarOptions,
        whitespace: false
    }
}

/**
 * Raw Song object
 * @typedef {object} RawSong
 * @property {string} name
 * @property {string} author
 * @property {string} url
 * @property {string} thumbnail
 * @property {string} duration
 * @property {boolean} isLive
 */
export interface RawSong {
    name: string,
    author: string,
    url: string,
    thumbnail: string,
    duration: string,
    isLive: boolean
    seekTime?: number;
}

/**
 * Raw Playlist object
 * @typedef {object} PlayerOptions
 * @property {string} name
 * @property {string} author
 * @property {string} url
 * @property {Song[]} songs
 * @property {string} type
 */
export interface RawPlaylist {
    name: string,
    author: string,
    url: string,
    songs: Song[],
    type: 'playlist'|'album'
}

/**
 * Emitted when channel was empty
 * @event Player#channelEmpty
 * @param {Queue} queue Queue
 */

/**
 * Emitted when a song was added to the queue
 * @event Player#songAdd
 * @param {Queue} queue Queue
 * @param {Song} song Song
 */

/**
 * Emitted when a playlist was added to the queue
 * @event Player#playlistAdd
 * @param {Queue} queue Queue
 * @param {Playlist} playlist Playlist
 */

/**
 * Emitted when there was no more music to play
 * @event Player#queueEnd
 * @param {Queue} queue Queue
 */

/**
 * Emitted when the queue was destroyed
 * @event Player#queueDestroyed
 * @param {Queue} queue Queue
 */

/**
 * Emitted when a song changed
 * @event Player#songChanged
 * @param {Queue} queue Queue
 * @param {Song} newSong Song
 * @param {Song} oldSong Song
 */

/**
 * Emitted when a first song in the queue started playing
 * @event Player#songFirst
 * @param {Queue} queue Queue
 * @param {Song} song Song
 */

/**
 * Emitted when someone disconnected the bot from the channel
 * @event Player#clientDisconnect
 * @param {Queue} queue Queue
 */

/**
 * Emitted when deafenOnJoin is true and the bot was undeafened
 * @event Player#clientUndeafen
 * @param {Queue} queue Queue
 */

/**
 * Emitted when there was an error with the Player
 * @event Player#error
 * @param {string} error Error string
 * @param {Queue} queue Queue
 */

/**
 * Emitted when player is paused or unpaused.
 * @event Player#paused
 * @param {Queue} queue Queue
 * @param {boolean} paused Playing state
 */

/**
 * Emitted when a resourse has a seek parameter and is loading, and when the track starts playing at seeked timestamp.
 * @event Player#seeking
 * @param {Queue} queue Queue
 * @param {SeekState} seekState What state has been emitted. Starting or finishing.
 */

/**
 * Emitted when the player starts playing, does not emit when {Player#seeking} or {Player#songFirst} is emitted.
 * @event Player#songPlaying
 * @param {Queue} queue Queue
 * @param {Song} Song What state has been emitted. Starting or finishing.
 */

export interface PlayerEvents {
    channelEmpty: [queue: Queue];
    songAdd: [queue: Queue, song: Song];
    playlistAdd: [queue: Queue, playlist: Playlist];
    queueEnd: [queue: Queue];
    queueDestroyed: [queue: Queue];
    songChanged: [queue: Queue, newSong: Song, oldSong: Song];
    songFirst: [queue: Queue, song: Song];
    clientDisconnect: [queue: Queue];
    clientUndeafen: [queue: Queue];
    error: [error: string, queue: Queue];
    paused: [queue: Queue, paused: boolean];
    seeking: [queue: Queue, seekState: SeekState];
    songPlaying: [queue: Queue, song: Song];

}

/**
 * Emitted when StreamConnection started
 * @event StreamConnection#start
 * @param {AudioResource<Song>} AudioResource AudioResource
 */

/**
 * Emitted when StreamConnection ended
 * @event StreamConnection#end
 * @param {AudioResource<Song>} AudioResource AudioResource
 */

/**
 * Emitted when there was an error with the StreamConnection
 * @event StreamConnection#error
 * @param {AudioPlayerError} error AudioPlayerError
 */

export interface SeekState {
    startSeeking: boolean; 
    finishedSeeking: boolean;
}

export interface StreamConnectionEvents {
    start: [AudioResource<Song>];
    end: [AudioResource<Song>];
    error: [AudioPlayerError];
}

export interface RawApplePlaylist {
    name: string
    type: 'playlist'|'album'
    author: string
    tracks: { artist: string, title: string }[]
}

export enum ButtonSelectState {
    SELECT,
    REMOVE,
    SWAP
}

export enum SelectMenuNames {
    SELECT = "selectMenuSelect",
    REMOVE = "selectMenuRemove",
    SWAP = "selectMenuSwap"
}

export enum ButtonNames {
    PLAYPAUSE = "buttonPlayPause",
    SKIP = "buttonSkip",
    STOP = "buttonStop",
    LOOP = "buttonLoop",
    SHUFFLE = "buttonShuffle",
    SELECT = "buttonSelect",
    REMOVE = "buttonRemove",
    SWAP = "buttonSwap",
    FIRSTQUEUEPAGE = "buttonFirstPageQueue",
    NEXTQUEUEPAGE = "buttonNextPageQueue",
    PREVQUEUEPAGE = "buttonPrevPageQueue",
    LASTQUEUEPAGE = "buttonLastPageQueue"
}

export const DefaultButtonLabels = {
    buttonPlayPause: "Pause",
    buttonSkip: "Skip",
    buttonStop: "Stop",
    buttonLoop: "Loop",
    buttonShuffle: "Shuffle",
    buttonSelect: "Select",
    buttonRemove: "Remove",
    buttonSwap: "Swap",
    buttonFirstPageQueue: "First",
    buttonNextPageQueue: "Next",
    buttonPrevPageQueue: "Prev",
    buttonLastPageQueue: "Last"
}

export const DefaultButtonEmojis = {
    buttonPlayPause: "⏯️",
    buttonSkip: "⏭️",
    buttonStop: "⏹️",
    buttonLoop: "🔁",
    buttonShuffle: "🔀",
    buttonSelect: "✅",
    buttonRemove: "❌",
    buttonSwap: "🔃",
    buttonFirstPageQueue: "⏮️",
    buttonNextPageQueue: "▶️",
    buttonPrevPageQueue: "◀️",
    buttonLastPageQueue: "⏭️"
}

export interface ButtonOptions {
    customId: ButtonNames;
    style: ButtonStyle;
    disabled: boolean;
    label?: string;
    emoji?: string;
}

export const DefaultButtonOptions: ButtonOptions = {
    customId: ButtonNames.PLAYPAUSE,
    style: ButtonStyle.Primary,
    disabled: true
}

export interface ActionRowOptions {
    selectState?: ButtonSelectState;
    currentQueuePage?: number;
    disabled?: boolean;
}

export const DefaultActionRowOptions: ActionRowOptions = {
    selectState: ButtonSelectState.SELECT,
    currentQueuePage: 0,
    disabled: false
}