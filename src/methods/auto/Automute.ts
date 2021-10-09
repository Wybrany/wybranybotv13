import { Guild, GuildMember, Role } from "discord.js";
import Modified_Client from "../client/Client";
import { Autoclass } from "./Autoclass";
import { auto_state } from "../../interfaces/auto.interface";

export class Autodisconnect extends Autoclass {
    constructor(client: Modified_Client, guild: Guild, target: GuildMember){
        super(client, guild, target, "DISCONNECT");
    }
    //This is gonna be a lot of recoding from v12, no clue if this is still possible in v13.
}