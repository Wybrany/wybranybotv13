import { Guild, GuildMember } from "discord.js";
import Modified_Client from "../client/Client";
import { auto_state, Autoclass_Interface } from "../types/auto.interface";

export const getRandomTimer = (time_ms: number) => {
    const random_ms = Math.floor(Math.random() * (time_ms));
    if(time_ms < 1000 || random_ms < 1000) return 1000;
    return random_ms;
}

export class Autoclass implements Autoclass_Interface {
    public client: Modified_Client;
    public guild: Guild;
    public target: GuildMember;

    public timer: number;
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

        this.timer = 5000;
        this.timeout = null;
        this.startNextTroll = false;
        this.timerStarted = false;

        this.random = false;
        this.randomInterval = null;

        this.state = state;
    }

    add_random_interval(time_ms: number){
        this.randomInterval = time_ms;
        this.random = true;
    }

    change_troll_state(state: boolean){
        this.startNextTroll = state;
    }

    stop_timer(){
        if(this.timeout) clearTimeout(this.timeout)
        this.startNextTroll = false;
        this.timerStarted = false;
    }

    async start_timer(){
        if(this.random) this.timer = this.randomInterval ? getRandomTimer(this.randomInterval) : 5000;
        this.timerStarted = true;
        this.timeout = setTimeout(() => this.auto(), this.timer)
    }

    async auto(){
        //Do something.
    }

}