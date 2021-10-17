import { Guild, GuildMember, Role } from "discord.js";
import Modified_Client from "../client/Client";
import { Autoclass } from "./Autoclass";
import { auto_state } from "../../interfaces/auto.interface";

export class Autoname extends Autoclass {

    public nickname: string;

    constructor(client: Modified_Client, guild: Guild, target: GuildMember, nickname: string){
        super(client, guild, target, "NAME");

        this.nickname = nickname || "Pappas lilla ängel";
    }

    async auto(){
        await this.target.setNickname(this.nickname, `Autonickname by command`)
        .catch(e => {
            console.error(e);
        })
    }    
}