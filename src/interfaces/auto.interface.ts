import { Guild, GuildMember } from "discord.js";
import Modified_Client from "../methods/client/Client";

export type auto_state = "KICK" | "MUTE" | "DISCONNECT" | "NAME" | "MOVE";

export interface Autoclass_Interface {
    client: Modified_Client;
    guild: Guild;
    target: GuildMember;

    timer: number;
    timeout: NodeJS.Timeout | null;
    startNextTroll: boolean;
    timerStarted: boolean;

    random: boolean;
    randomInterval: number | null;

    state: auto_state;

    add_random_interval: (time_ms: number) => void;
    change_troll_state: (state: boolean) => void;
    stop_timer: () => void;
    start_timer: () => Promise<void>;
    auto: () => Promise<void>;
}

export interface Autoname_Interface extends Autoclass_Interface {
    
}

export interface Autodisconnect_Interface extends Autoclass_Interface {
    
}

export interface Automove_Interface extends Autoclass_Interface {
    
}

export interface Automute_Interface extends Autoclass_Interface {
    
}

export interface Autokick_Interface extends Autoclass_Interface {
    
}