import { VoiceState, VoiceChannel } from "discord.js";
import { Autodisconnect } from "../auto/Autodisconnect";
import { Automove } from "../auto/Automove";
import Modified_Client from "../client/Client";

export const VoicestateUpdate = async (client: Modified_Client, oldState: VoiceState, newState: VoiceState) => {
    if(!newState.member || !client.user) return;
    const newchannel = newState.channel as VoiceChannel | null;

    if(client.music.has(newState.guild.id) && (newState.member.id === client.user.id)){
        if(newchannel || newState.channel?.id) return;
        client.music.delete(newState.guild.id);
        return;
    }

    else if (client.member_troll_list.has(newState.id)) {
        const get_member_troll_list = client.member_troll_list.get(newState.id) as Automove | Autodisconnect | undefined;
        if(!get_member_troll_list) return;
        switch(get_member_troll_list.state){
            case 'MOVE':
            case 'DISCONNECT':
                if(!newchannel || !newchannel.id) return get_member_troll_list.stop_timer();
                if(get_member_troll_list.timerStarted) get_member_troll_list.stop_timer();

                if(get_member_troll_list.state === "MOVE") get_member_troll_list.start_timer(newchannel);
                else get_member_troll_list.start_timer();

                get_member_troll_list.change_troll_state(true);
            break;
            
            case 'MOVE':
            break;

            default:
            break;
        }
    }
}