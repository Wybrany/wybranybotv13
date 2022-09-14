import { Guild, GuildMember, Role } from "discord.js";
import Modified_Client from "../client/Client";
import { Autoclass } from "./Autoclass";

export class Autodisconnect extends Autoclass {
    constructor(client: Modified_Client, guild: Guild, target: GuildMember){
        super(client, guild, target, "DISCONNECT");
    }

    async auto(){
        if(!this.startNextTroll || !this.guild.members.cache.has(this.target.id)) 
            return await this.start_timer();
            
        await this.target.voice.setChannel(null)
            .catch(async e => {
                console.error(e);
                this.stop_timer();
            });
    }
}