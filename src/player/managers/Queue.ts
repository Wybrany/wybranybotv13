import { ButtonBuilder, Guild, GuildChannelResolvable, GuildMember, StageChannel, VoiceChannel } from "discord.js";
import { StreamConnection} from "../voice/StreamConnection";
import { AudioResource,entersState, joinVoiceChannel, StreamType, VoiceConnectionStatus } from "@discordjs/voice";
//@ts-ignore
import ytdl from "discord-ytdl-core";
import { Playlist, Song, Player, Utils, DefaultPlayerOptions, PlayerOptions, PlayOptions, PlaylistOptions, RepeatMode, ProgressBarOptions, ProgressBar, DMPError, DMPErrors, DefaultPlayOptions, DefaultPlaylistOptions, EmbedOptions, Embed, ActionRow, ActionRowOptions } from "..";

export class Queue {
    public player: Player;
    public guild: Guild;
    public connection: StreamConnection | undefined;
    public songs: Song[] = [];
    public isPlaying: boolean = false;
    public data?: any = null;
    public options: PlayerOptions;
    public repeatMode: RepeatMode = RepeatMode.DISABLED;
    public destroyed: boolean = false;
    public shuffled: boolean = false;
    public unshuffledSongs: Song[] = [];

    /**
     * Queue constructor
     * @param {Player} player
     * @param {Guild} guild
     * @param {PlayerOptions} options
     */
    constructor(player: Player, guild: Guild, options?: PlayerOptions) {

        /**
         * Player instance
         * @name Queue#player
         * @type {Player}
         * @readonly
         */

        /**
         * Guild instance
         * @name Queue#guild
         * @type {Guild}
         * @readonly
         */

        /**
         * Queue connection
         * @name Queue#connection
         * @type {?StreamConnection}
         * @readonly
         */

        /**
         * Queue songs
         * @name Queue#songs
         * @type {Song[]}
         */

        /**
         * If Song is playing on the Queue
         * @name Queue#isPlaying
         * @type {boolean}
         * @readonly
         */

        /**
         * Queue custom data
         * @name Queue#data
         * @type {any}
         */

        /**
         * Queue options
         * @name Queue#options
         * @type {PlayerOptions}
         */

        /**
         * Queue repeat mode
         * @name Queue#repeatMode
         * @type {RepeatMode}
         */

        /**
         * If the queue is destroyed
         * @name Queue#destroyed
         * @type {boolean}
         * @readonly
         */

        /**
         * If queue has been shuffled
         * @name Queue#shuffled
         * @type {boolean}
         */

        /**
         * Songs before shuffled
         * @name Queue#unshuffledSongs
         * @type {Song[]}
         */

        this.player = player;

        this.guild = guild;

        this.options = {...DefaultPlayerOptions, ...options};
    }

    /**
     * Joins a voice channel
     * @param {GuildChannelResolvable} _channel
     * @returns {Promise<Queue>}
     */
    async join(channelId: GuildChannelResolvable) {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        if(this.connection)
            return this;
        const channel = this.guild.channels.resolve(channelId) as StageChannel | VoiceChannel;
        if(!channel)
            throw new DMPError(DMPErrors.UNKNOWN_VOICE);
        if (!Utils.isVoiceChannel(channel))
            throw new DMPError(DMPErrors.CHANNEL_TYPE_INVALID);
        let connection = joinVoiceChannel({
            guildId: channel.guild.id,
            channelId: channel.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: this.options.deafenOnJoin
        });
        let _connection: StreamConnection;
        try {
            connection = await entersState(connection, VoiceConnectionStatus.Ready, 15 * 1000);
            _connection = new StreamConnection(connection, channel);
        } catch (err) {
            connection.destroy();
            throw new DMPError(DMPErrors.VOICE_CONNECTION_ERROR);
        }
        this.connection = _connection;

        if (Utils.isStageVoiceChannel(channel)) {
            const _guild = channel.guild as Guild & {
                me?: GuildMember;
            };
            const me = _guild.me ? _guild.me : _guild.members.me!;
            await me.voice.setSuppressed(false).catch(async _ => {
                return await channel!.guild.members.me!.voice.setRequestToSpeak(true).catch(() => null);
            });
        }

        this.connection
            .on('start', (resource) => {
                this.isPlaying = true;
                if (resource?.metadata?.isFirst && resource?.metadata?.seekTime === 0)
                    this.player.emit('songFirst', this, this.nowPlaying);
                else if(resource?.metadata?.seekTime){
                    const seekState = { startSeeking: false, finishedSeeking: true };
                    this.player.emit("seeking", this, seekState);
                }
                else
                    this.player.emit("songPlaying", this, this.songs[0]);
            })
            .on('end', async (resource) => {
                if(this.destroyed){
                    this.player.emit('queueDestroyed', this);
                    return;
                }
                this.isPlaying = false;
                let oldSong = this.songs.shift();
                if (this.songs.length === 0 && this.repeatMode === RepeatMode.DISABLED) {

                    this.player.emit('queueEnd', this);
                    if(this.options.leaveOnEnd)
                        setTimeout(() => {
                            if(!this.isPlaying)
                                this.leave();
                        }, this.options.timeout)
                    return;
                } else {
                    if (this.repeatMode === RepeatMode.SONG) {
                        this.songs.unshift(oldSong!);
                        this.songs[0]._setFirst(false);
                        this.player.emit('songChanged', this, this.songs[0], oldSong);
                        return this.play(this.songs[0] as Song, { immediate: true });
                    } else if (this.repeatMode === RepeatMode.QUEUE) {
                        this.songs.push(oldSong!);
                        this.songs[this.songs.length - 1]._setFirst(false);
                        this.player.emit('songChanged', this, this.songs[0], oldSong);
                        return this.play(this.songs[0] as Song, { immediate: true });
                    }
                    this.player.emit('songChanged', this, this.songs[0], oldSong);
                    return this.play(this.songs[0] as Song, { immediate: true });
                }
            })
            .on('error', (err) => this.player.emit('error', err.message, this));
        return this;
    }

    /**
     * Plays or Queues a song (in a VoiceChannel)
     * @param {Song | string} search
     * @param {PlayOptions} [options=DefaultPlayOptions]
     * @returns {Promise<Song>}
     */
    async play(search: Song | string, options: PlayOptions & { immediate?: boolean, seek?: number, data?: any } = DefaultPlayOptions): Promise<Song> {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        options = Object.assign(
            {} as PlayOptions,
            DefaultPlayOptions,
            options
        );
        let { data } = options;
        delete options.data;
        let song = await Utils.best(search, options, this)
            .catch(error => {
                throw new DMPError(error);
            });
        if(!options.immediate)
            song.data = data;

        let songLength = this.songs.length;
        if(!options?.immediate && songLength !== 0) {
            if(options?.index! >= 0 && ++options.index! <= songLength)
                this.songs.splice(options.index!, 0, song);
            else this.songs.push(song);
            this.player.emit('songAdd', this, song);
            return song;
        } else if(!options?.immediate) {
            song._setFirst();
            if(options?.index! >= 0 && ++options.index! <= songLength)
                this.songs.splice(options.index!, 0, song);
            else this.songs.push(song);
            this.player.emit('songAdd', this, song);
        } else if(options.seek)
            this.songs[0].seekTime = options.seek;

        let quality = this.options.quality;
        song = this.songs[0];
        if(song.seekTime)
            options.seek = song.seekTime;

        let stream = ytdl(song.url, {
            requestOptions: this.player.options.ytdlRequestOptions ?? {},
            opusEncoded: false,
            seek: options.seek ? options.seek / 1000 : 0,
            fmt: 's16le',
            encoderArgs: [],
            quality: quality!.toLowerCase() === 'low' ? 'lowestaudio' : 'highestaudio',
            highWaterMark: 1 << 25,
            filter: 'audioonly'
        })
            .on('error', (error: { message: string; }) => {
                if(!/Status code|premature close/i.test(error.message))
                    this.player.emit('error', error.message === 'Video unavailable' ? 'VideoUnavailable' : error.message, this);
               return;
            });

        const resource: AudioResource<Song> = this.connection.createAudioStream(stream, {
           metadata: song,
           inputType: StreamType.Raw
        });

        setTimeout(_ => {
            this.connection!.playAudioStream(resource)
                .then(__ => {
                    this.setVolume(this.options.volume!);
                })
        });

        return song;
    }

    /**
     * Plays or Queues a playlist (in a VoiceChannel)
     * @param {Playlist | string} search
     * @param {PlaylistOptions} [options=DefaultPlaylistOptions]
     * @returns {Promise<Playlist>}
     */
    async playlist(search: Playlist | string, options: PlaylistOptions & { data?: any } = DefaultPlaylistOptions): Promise<Playlist> {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        options = Object.assign(
            {} as PlaylistOptions & { data?: any },
            DefaultPlaylistOptions,
            options
        );
        let playlist = await Utils.playlist(search, options, this)
            .catch(error => {
                throw new DMPError(error);
            });
        let songLength = this.songs.length;
        this.songs.push(...playlist.songs);
        this.player.emit('playlistAdd', this, playlist);

        if(songLength === 0) {
            playlist.songs[0]._setFirst();
            await this.play(playlist.songs[0], { immediate: true });
        }

        return playlist;
    }

    /**
     * Seeks the current playing Song
     * @param {number} time
     * @returns {boolean}
     */
    async seek(time: number) {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.isPlaying)
            throw new DMPError(DMPErrors.NOTHING_PLAYING);

        if(isNaN(time))
            return;
        if (time < 1)
            time = 0;
        if (time >= this.nowPlaying!.milliseconds)
            return this.skip();
        const seekState = { startSeeking: true, finishedSeeking: false };
        this.player.emit("seeking", this, seekState);
        await this.play(this.nowPlaying!, {
            immediate: true,
            seek: time
        });

        return true;
    }

    /**
     * Skips the current playing Song and returns it
     * @param {number} [index=0]
     * @returns {Song}
     */
    skip(index: number = 0): Song {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        const skippedSong = this.songs[0];
        this.songs.splice(1, index);
        
        this.connection.stop();
        return skippedSong;
    }

    skipTo(index: number): Song {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);

        const skippedSong = this.songs[0];
        this.moveSong(index, 1);
        this.skip();

        return skippedSong;
    }

    replay(): Song {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        
        const currentSong = this.songs[0];
        this.songs.unshift(currentSong);
        const skippedSong = this.skip();
        return skippedSong;
    }

    /**
     * Stops playing the Music and cleans the Queue
     * @returns {void}
     */
    stop(): void {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        if(this.options.leaveOnStop){
            setTimeout(() => {
                this.leave();
            }, this.options.timeout);
        } else {
            this.clearQueue()
            this.skip()
        }
    }

    /**
     * Shuffles the Queue, with a toggle
     * @returns {Song[]}
     */
    shuffle(): Song[]|undefined {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        let currentSong = this.songs.shift();

        if(!this.shuffled) {
            this.unshuffledSongs = this.songs;
            this.songs = Utils.shuffle(this.songs);
            this.songs.unshift(currentSong!);
            this.shuffled = true;
        }
        else {
            const filterPlayedSongs = this.unshuffledSongs.filter(us => this.songs.map(s => s.url).includes(us.url));
            this.songs = filterPlayedSongs;
            this.songs.unshift(currentSong!);
            this.unshuffledSongs = [];
            this.shuffled = false;
        }

        return this.songs;
    }

    reshuffle(): Song[] | undefined {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        
        let shuffledSongs: Song[] | undefined = undefined

        if(!this.shuffled){
            shuffledSongs = this.shuffle();
        } 
        else {
            let currentSong = this.songs.shift();
            const filterPlayedSongs = this.unshuffledSongs.filter(us => this.songs.map(s => s.url).includes(us.url));
            this.songs = filterPlayedSongs;
            this.songs = Utils.shuffle(this.songs);
            this.songs.unshift(currentSong);
            this.shuffled = true;
        }

        return shuffledSongs;
    }

    /**
     * Pause/resume the current Song
     * @param {boolean} [state=true] Pause state, if none it will pause the Song
     * @returns {boolean}
     */
    setPaused(state: boolean = true): boolean|undefined {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        if(!this.isPlaying)
            throw new DMPError(DMPErrors.NOTHING_PLAYING);

        const pauseState = this.connection.setPauseState(state);
        this.player.emit("paused", this, pauseState);
        return pauseState;
    }

    /**
     * Remove a Song from the Queue
     * @param {number} index
     * @returns {Song|undefined}
     */
    remove(index: number): Song|undefined {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        return this.songs.splice(index, 1)[0];
    }

    /**
     * Swaps places with two songs in the queue.
     * @param {number} index1
     * @param {number} index2
     * @returns {Song[]|undefined}
     */
    swapSongs(index1: number, index2: number): Song[] | undefined {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(this.songs[index1].isFirst || this.songs[index2].isFirst || this.songs.length < index1 || this.songs.length < index2)
            throw new DMPError(DMPErrors.INVALID_SWAP);
        
        [[this.songs[index1], this.songs[index2]] = [this.songs[index2], this.songs[index1]]]
        return this.songs;
    }

    moveSong(indexOfSongToMove: number, positionInQueueToMove: number): Song[] | undefined {
        const [ index1, index2 ] = [ indexOfSongToMove, positionInQueueToMove ]
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(this.songs[index1].isFirst || this.songs[index2].isFirst || this.songs.length < index1 || this.songs.length < index2 || index1 <= 0 || index2 <= 0)
            throw new DMPError(DMPErrors.INVALID_MOVE);
        
        const removedSong = this.songs.splice(index1, 1)[0];
        this.songs.splice(index2, 0, removedSong);

        return this.songs;
    }

    /**
     * Gets the current volume
     * @type {number}
     */
    get volume(): number {
        if (!this.connection)
            return DefaultPlayerOptions.volume!;
        return this.connection.volume;
    }

    /**
     * Gets the paused state of the player
     * @type {boolean}
     */
    get paused(): boolean {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        if(!this.isPlaying)
            throw new DMPError(DMPErrors.NOTHING_PLAYING);

        return this.connection.paused;
    }

    /**
     * Sets the current volume
     * @param {number} volume
     * @returns {boolean}
     */
    setVolume(volume: number) {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);

        this.options.volume = volume;
        return this.connection.setVolume(volume);
    }

    /**
     * Returns current playing song
     * @type {?Song}
     */
    get nowPlaying(): Song | undefined {
        return this.connection?.resource?.metadata ?? this.songs[0];
    }

    /**
     * Clears the Queue
     * @returns {void}
     */
    clearQueue() {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        let currentlyPlaying = this.songs.shift();
        this.songs = [ currentlyPlaying! ];
    }

    /**
     * Sets Queue repeat mode
     * @param {RepeatMode} repeatMode
     * @returns {boolean}
     */
    setRepeatMode(repeatMode: RepeatMode): boolean {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        if (![RepeatMode.DISABLED, RepeatMode.QUEUE, RepeatMode.SONG].includes(repeatMode))
            throw new DMPError(DMPErrors.UNKNOWN_REPEAT_MODE);
        if (repeatMode === this.repeatMode)
            return false;
        this.repeatMode = repeatMode;
        return true;
    }

    /**
     * Creates Progress Bar class
     * @param {ProgressBarOptions} [options]
     * @returns {ProgressBar}
     */
    createProgressBar(options?: ProgressBarOptions): ProgressBar {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.isPlaying)
            throw new DMPError(DMPErrors.NOTHING_PLAYING);

        return new ProgressBar(this, options);
    }

    /**
     * Creates Embed class
     * @param {EmbedOptions} [options]
     * @returns {Embed}
     */
    createMessageEmbed(options?: EmbedOptions): Embed {
        return new Embed(this, options);
    }
    
    /**
     * Creates ActionRow class
     * @param {EmbedOptions} [options]
     * @returns {Embed}
     */
    createMessageButtons(options?: ActionRowOptions): ActionRow {
        return new ActionRow(this, options);
    }
    //This function helps avoiding not modifing the queue itself. Like with Array.prototype.splice.
    /**
     * Returns a chunk from songs array.
     * @param {start} [number] Indexposition on where to start.
     * @param {end} [number] How many elements after start should be returned.
     * @returns {Song[]}
     */
    getQueueFromIndex(start: number, end: number): Song[]{
        return this.songs.filter((s, i) => ((i >= start) && (i < (start + end))))
    }

    /**
     * Skips to a song to an index, without removing the songs inbetween.
     * @param {index} [number] Indexposition on where to start.
     * @returns {?Song[]}
     */
    playSongFromIndex(index: number): Song[] | undefined {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        if(index <= 1 || index >= this.songs.length)
            index = 1;
        const song = this.songs.splice(index, 1);
        this.songs.splice(1, 0, song[0]);
        this.connection.stop();
        return this.songs;
    }

    nextSong(index: number = 1): Song | undefined {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        const nextSong = this.songs?.[index];
        return nextSong;
    }

    /**
     * Set's custom queue data
     * @param {any} data
     * @returns {void}
     */
    setData(data: any): void {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        this.data = data;
    }

    /**
     * Disconnects the player
     * @returns {void}
     */
    leave(): void {
        this.destroyed = true;
        this.connection?.leave();
        this.player.deleteQueue(this.guild.id);
    }

}
