import { Message } from "discord.js";

const delayFunction = async (time_ms: number) => new Promise(promise => setTimeout(promise, time_ms));
const maxCommands = parseInt(process.env.MAX_COMMANDS as string, 10) as number || 2;

export class Guild_used_command_recently{
    public guildid: string;
    public commandremaining: number;
    public timer_started: boolean;
    public sent_warning_message: boolean;

    constructor(guildid: string){
        this.guildid = guildid;
        this.commandremaining = maxCommands;
        this.timer_started = false;
        this.sent_warning_message = false;
    }
    add_commandremaining(){
        if(this.commandremaining < maxCommands) this.commandremaining++;
    }
    sub_commandremaining(){
        if(this.commandremaining > 0) this.commandremaining--;
    }
    is_on_cooldown(){
        return this.commandremaining === 0 ? true : false
    }
    change_warning_message(value: boolean){
        this.sent_warning_message = value;
    }
    async send_warning_message(message: Message){
        if(!this.sent_warning_message){
            this.sent_warning_message = true;
            return message.warn({content: `You are on cooldown. You may only use ${maxCommands} commands per ${maxCommands * 5} seconds. Rechargerate is at 1 command per 5 sec.`, timed: 5000});
        }
    }
    async start_timer(){
        this.sub_commandremaining();
        this.timer_started = true;
        while(this.commandremaining < maxCommands){
            await delayFunction(5000);
            this.add_commandremaining();
        }
        this.timer_started = false;
    }
}