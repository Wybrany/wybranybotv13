import { Guild, GuildMember, Invite, Role } from "discord.js";
import Modified_Client from "../client/Client";
import { Autoclass } from "./Autoclass";
import { auto_state } from "../../interfaces/auto.interface";

export class Autokick extends Autoclass {

    public give_roles_back: boolean;
    public previous_roles: Role[];

    public invite_link: Invite;
    public invite_sent: boolean;

    constructor(client: Modified_Client, guild: Guild, target: GuildMember, invite_link: Invite){
        super(client, guild, target, "KICK");

        this.give_roles_back = false;
        this.previous_roles = [...this.target.roles.cache.values()];

        this.invite_link = invite_link;
        this.invite_sent = false;
    }

    async give_back_roles(){
        for(const role of this.previous_roles){
            await this.target.roles.add(role)
                .catch(e => console.error(`give_back_roles: ${e}`));
        }
    }
    
    async auto(){
        if(!this.startNextTroll || !this.guild.members.cache.has(this.target.id)) 
            return await this.start_timer();

        if(this.invite_sent) 
            this.target.send(`${this.invite_link}`)
                .then(() => this.invite_sent = true)
                .catch(async e => {
                    console.error(e);
                    this.stop_timer();
                })
        await this.target.kick(`Autokicked by command.`)
            .catch(async e => {
                console.error(e);
                this.stop_timer();
            })
    }
}