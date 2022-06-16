import { Guild, Interaction, TextChannel } from "discord.js";
import { MusicChannel, MusicEmbedInterface, MusicOptions, QueuePageState } from "../types/music.interface";
import Modified_Client from "../client/Client";
import { EmbedState, ButtonSelectState, RepeatMode, EmbedOptions, Queue } from "discord-music-player";

export default class MusicEmbed implements MusicEmbedInterface{

    private guild: Guild;
    private musicChannel: MusicChannel;

    public currentQueuePage: number = 0;
    public selectState: ButtonSelectState = ButtonSelectState.SELECT;

    public previousTime: number = 0;
    public timeout: NodeJS.Timeout | null = null;

    constructor(guild: Guild, musicChannel: MusicChannel){
        this.guild = guild;
        this.musicChannel = musicChannel;
    }

    async stop(client: Modified_Client, interaction: Interaction){
        if(!interaction || !interaction.guild) return;
        const guildQueue = client.player?.getQueue(interaction.guild?.id);
        if(!guildQueue) return;
        guildQueue.stop();
        if(guildQueue.isPlaying) await this.updateEmbed(client, EmbedState.STOPPED, {actionRowOptions: {disabled: true}});
    }

    async skip(client: Modified_Client, interaction: Interaction, index?: number){
        if(!interaction || !interaction.guild) return; 
        const guildQueue = client.player?.getQueue(interaction.guild?.id);
        if(guildQueue) guildQueue.playSongFromIndex(index ?? 0);
    }

    async toggle_pause(client: Modified_Client, interaction: Interaction){
        if(!interaction || !interaction.guild) return;
        const guildQueue = client.player?.getQueue(interaction.guild?.id);
        if(!guildQueue) return;
        if(guildQueue.paused) guildQueue.setPaused(false);
        else guildQueue.setPaused(true);
        if(guildQueue.isPlaying) await this.updateEmbed(client, EmbedState.NOWPLAYING);
    }

    async swap_songs(client: Modified_Client, interaction: Interaction, songs: number[]){
        if(!interaction || !interaction.guild || songs.length !== 2) return;
        const guildQueue = client.player?.getQueue(interaction.guild?.id);
        if(!guildQueue) return;
        const [ index1, index2 ] = songs;
        guildQueue.swapSongs(index1, index2);
        if(guildQueue.isPlaying) await this.updateEmbed(client, EmbedState.NOWPLAYING);
    }

    async remove_songs(client: Modified_Client, interaction: Interaction, songs: number[]){
        if(!interaction || !interaction.guild) return;
        const guildQueue = client.player?.getQueue(interaction.guild?.id);
        if(!guildQueue) return;
        for(const song of songs){
            guildQueue.remove(song);
        }
        if(guildQueue.isPlaying) await this.updateEmbed(client, EmbedState.NOWPLAYING);
    }

    async toggle_shuffle(client: Modified_Client, interaction: Interaction){
        if(!interaction || !interaction.guild) return;
        const guildQueue = client.player?.getQueue(interaction.guild?.id);
        if(!guildQueue) return;
        guildQueue.shuffle();
        if(guildQueue.isPlaying) await this.updateEmbed(client, EmbedState.NOWPLAYING);
    }

    async toggle_loop(client: Modified_Client, interaction: Interaction){
        if(!interaction || !interaction.guild) return;
        const guildQueue = client.player?.getQueue(interaction.guild?.id);
        if(!guildQueue) return;

        switch(guildQueue.repeatMode){
            case RepeatMode.DISABLED:
                guildQueue.setRepeatMode(RepeatMode.SONG);
            break;

            case RepeatMode.SONG:
                guildQueue.setRepeatMode(RepeatMode.QUEUE);
            break;

            case RepeatMode.QUEUE:
                guildQueue.setRepeatMode(RepeatMode.DISABLED);
            break;
        }

        if(guildQueue.isPlaying) await this.updateEmbed(client, EmbedState.NOWPLAYING);
    }

    async queue_page(client: Modified_Client, state: QueuePageState, interaction: Interaction){
        if(!interaction || !interaction.guild) return;
        const guildQueue = client.player?.getQueue(interaction.guild?.id);
        if(!guildQueue || !guildQueue.songs.length) return;

        const queuePages = Math.ceil(guildQueue.songs.length / 25);

        switch(state){
            case QueuePageState.FIRST:
                if(this.currentQueuePage === 0) return; 
                this.currentQueuePage = 0;
            break;

            case QueuePageState.NEXT:
                if((this.currentQueuePage + 1) > (queuePages - 1) || this.currentQueuePage === (queuePages - 1)) return;
                this.currentQueuePage += 1;
            break;

            case QueuePageState.PREV:
                if(this.currentQueuePage === 0 || (this.currentQueuePage - 1) < 0) return;
                this.currentQueuePage -= 1;
            break;

            case QueuePageState.LAST:
                if(this.currentQueuePage === (queuePages - 1)) return; 
                this.currentQueuePage = queuePages - 1;
            break;
        }
        if(interaction) await this.updateEmbed(client, EmbedState.NOWPLAYING);
    }

    async queue_state(client: Modified_Client, state: ButtonSelectState, interaction: Interaction){
        if(!interaction || !interaction.guild) return;

        const queue = client.player?.getQueue(interaction.guild.id);
        if(!queue) return;

        switch(state){
            case ButtonSelectState.SELECT:
                this.selectState = ButtonSelectState.SELECT;
            break;

            case ButtonSelectState.REMOVE:
                if(!queue.songs.length) return;
                this.selectState = ButtonSelectState.REMOVE;
            break;

            case ButtonSelectState.SWAP:
                if(queue.songs.length <= 1 ) return;
                this.selectState = ButtonSelectState.SWAP;
            break;
        }

        if(queue.isPlaying) await this.updateEmbed(client, EmbedState.NOWPLAYING);
    }

    async updateEmbed(client: Modified_Client, state: EmbedState, options?: MusicOptions): Promise<void>{
        if(!this.musicChannel) return;
        if(!this.musicChannel.embedid || !this.musicChannel.channelid) return;
        try{
            let guildQueue = client.player?.getQueue(this.guild.id);
            if(!guildQueue) guildQueue = client.player?.createQueue(this.guild.id);
            const embedOptions = { progressBarOptions: {arrow: "🔘", block: "▬", whitespace: false, time: true, size: 25}} as EmbedOptions;
            const { embed } = guildQueue!.createMessageEmbed({embedState: state, ...embedOptions, ...options?.embedOptions ?? {}});
            const { buttons } = guildQueue!.createMessageButtons({currentQueuePage: this.currentQueuePage, selectState: this.selectState, ...options?.actionRowOptions ?? {}});

            const channel = this.guild.channels.cache.get(this.musicChannel.channelid) as TextChannel | undefined;
            const message = channel?.messages.cache.get(this.musicChannel.embedid) ?? await channel?.messages.fetch(this.musicChannel.embedid);
            if(message) await message.edit({embeds: [embed], components: [...buttons]});
        }catch(e){
            console.error(e);
        }
    }
    
    updateEveryTick = (client: Modified_Client, queue: Queue, state: EmbedState) => {
        if(
            !queue.isPlaying ||
            !queue.nowPlaying ||
            !queue.connection ||
            !queue.paused 
        ) {
            console.log(`Exiting`);
            if(this.timeout) clearInterval(this.timeout);
            return;
        }
        console.log(`Here`)
        const { connection } = queue;
        const { milliseconds, seekTime } = queue.nowPlaying;
        const size = 25;
        const currentTime = seekTime + connection!.time;
        
        this.timeout = setTimeout(() => {
            console.log(currentTime);
        }, 5000);
    } 
}