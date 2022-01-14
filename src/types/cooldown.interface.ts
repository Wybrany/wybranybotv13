import { Message } from "discord.js";

export interface Cooldown{
    guildid: string;
    commandremaining: number;
    timer_started: boolean;
    sent_warning_message: boolean;

    add_commandremaining: () => void;
    sub_commandremaining: () => void;
    is_on_cooldown: () => boolean;
    change_warning_message: (value: boolean) => void;
    send_warning_message: (message: Message) => void;
    start_timer: () => void;
}