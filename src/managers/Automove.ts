import { ChannelType, Guild, GuildChannel, GuildMember, VoiceChannel } from "discord.js";
import Modified_Client from "../client/Client";
import { Autoclass, getRandomTimer } from "./Autoclass";
import { shuffle } from "../utils/utils";

export class Automove extends Autoclass {
    constructor(client: Modified_Client, guild: Guild, target: GuildMember){
        super(client, guild, target, "MOVE");
    }

    async start_timer(current_channel?: GuildChannel){
        if(!current_channel) return console.error(`I got no current channel in automove.`);
        if(this.random) this.timer = this.randomInterval ? getRandomTimer(this.randomInterval) : 5000;
        this.timerStarted = true;
        this.timeout = setTimeout(() => this.auto(current_channel), this.timer);
    }

    async auto(current_channel?: GuildChannel){
        if(!current_channel) return this.stop_timer();
        if(!this.startNextTroll || !this.guild.members.cache.has(this.target.id)) 
            return await this.start_timer(current_channel);
        
        const voiceChannels = [...this.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice && c.id !== current_channel.id).values()] as VoiceChannel[];
        const randomChannelIndex = shuffle(voiceChannels.length, 1) as number;
        await this.target.voice.setChannel(voiceChannels[randomChannelIndex].id)
            .catch(async e => {
                console.error(e);
                this.stop_timer();
            })
    }
}