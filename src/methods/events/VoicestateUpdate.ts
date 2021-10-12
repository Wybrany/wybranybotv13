import { VoiceState, VoiceChannel } from "discord.js";
import { Autokick_Interface } from "src/interfaces/auto.interface";
import Modified_Client from "../client/Client";

export const VoicestateUpdate = async (client: Modified_Client, oldState: VoiceState, newState: VoiceState) => {
    if(newState.id !== client.user?.id) return;
    const newchannel = newState.channel as VoiceChannel | null;
    if(!newchannel || !newState.channel?.id){
        if(client.music.has(newState.guild.id)) {
            client.music.delete(newState.guild.id);
            return;
        }
    }
}