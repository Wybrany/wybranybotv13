import { Guild, GuildMember, Role } from "discord.js";
import Modified_Client from "../client/Client";

export type auto_state = "KICK" | "MUTE" | "DISCONNECT" | "NAME" | "MOVE";

export class Autoclass {
    public client: Modified_Client;
    public guild: Guild;
    public target: GuildMember;

    public previousRoles: Role[];
    public give_role: boolean;

    public timeout: NodeJS.Timeout | null;
    public startNextTroll: boolean;
    public timerStarted: boolean;
    public random: boolean;
    public randomInterval: number | null;

    public state: auto_state;

    constructor(client: Modified_Client, guild: Guild, target: GuildMember, state: auto_state){
        this.client = client;
        this.guild = guild;
        this.target = target;

        this.previousRoles = [...target.roles.cache.values()];
        this.give_role = false;

        this.timeout = null;
        this.startNextTroll = false;
        this.timerStarted = false;
        this.random = false;
        this.randomInterval = null;

        this.state = state;
    }

    change_troll_state(state: boolean){
        this.startNextTroll = state;
    }

}