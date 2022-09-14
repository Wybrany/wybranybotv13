import { EmbedBuilder } from "discord.js";
import { Queue, EmbedOptions, DefaultEmbedOptions, DMPErrors, DMPError, EmbedState, Utils, DefaultProgressBarOptions } from "..";

class Embed {

    private queue: Queue;
    options: EmbedOptions = DefaultEmbedOptions;
    embed!: EmbedBuilder;

    /**
     * ProgressBar constructor
     * @param {Queue} queue
     * @param {EmbedOptions} [options=DefaultEmbedOptions]
     */
    constructor(queue: Queue, options: EmbedOptions = DefaultEmbedOptions){

        /**
         * Guild instance
         * @name Embed#guild
         * @type {Guild}
         * @private
         */
        
        /**
         * Embed options
         * @name Embed#options
         * @type {EmbedOptions}
         */

        /**
         * Created embed with current options
         * @name Embed#embed
         * @type {MessageEmbed}
         */

        this.queue = queue;

        this.options = Object.assign(
            {} as EmbedOptions,
            this.options,
            options
        );
        //Always want to create the embed, but if there is no music playing, we give an empty embed.
        if((!this.queue || queue.destroyed || !queue.connection || !queue.isPlaying) && this.options.embedState === EmbedState.NOWPLAYING) 
            this.options.embedState = EmbedState.STOPPED;
        
        this.create();
    }

    /**
     * Creates the Embed
     * @private
     */
    private create(): void {
        const messageEmbed = new EmbedBuilder()
            .setColor(this.options.colorOverwrite ?? "DarkBlue")
        if(this.options?.timestamp ?? true) messageEmbed.setTimestamp();

        switch(this.options.embedState){
            case EmbedState.NOWPLAYING:
                const progressBarOptions = {...DefaultProgressBarOptions, ...this.options?.progressBarOptions ?? {}}
                const progress = this.queue.createProgressBar(progressBarOptions);
                const playtime_ms = this.queue?.songs?.map(s => s?.milliseconds ?? 0).reduce((acc, red) => acc + red, 0) ?? 0;
                const playbackTime = Utils.msToTime(playtime_ms);
                messageEmbed
                    .setTitle(this.options?.title ?? "🎵 Now playing 🎵")
                    .setDescription(this.options?.description ?? `▶️ ${this.queue.nowPlaying?.name ?? "Unknown track."}\n\n${progress.prettier}\n\nTracks remaining: ${this.queue.songs.length} | [${playbackTime}]`)
                    .setFooter({text: this.options?.footer ?? `Requested by: ${this.queue.nowPlaying?.requestedBy?.tag ?? "Unknown requester."}`})
                    .setColor(this.options?.colorOverwrite ?? (this.queue.paused ? "DarkRed" : "DarkGreen"));
            break;

            case EmbedState.CHANGING:
                messageEmbed
                    .setTitle(this.options?.title ?? "Changing song...")
                    .setDescription(this.options?.description ?? `I am currently changing song. Please wait...`);
            break;

            case EmbedState.SEEKING:
                messageEmbed
                    .setTitle(this.options?.title ?? "Currently seeking...")
                    .setDescription(this.options?.description ?? `Please wait while I'm seeking.`)
            break;

            case EmbedState.STOPPED:
                messageEmbed
                    .setTitle(this.options?.title ?? "Idle")
                    .setDescription(this.options?.description ?? "Nothing is currently playing. Start playing today!");
            break;
        }

        this.embed = messageEmbed;
    }
}

export { Embed };