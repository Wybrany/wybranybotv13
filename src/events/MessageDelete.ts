import { PartialMessage, Message } from "discord.js";
import Modified_Client from "../client/Client";
import { savefiledata } from "../methods/backup";

export const MessageDelete = async(client: Modified_Client, message: Message | PartialMessage) => {
    if(!message.id || !message.guild) return;
    if(message.id === message.guild.musicChannel?.embedid){
        message.guild.musicChannel = null;
        message.guild.musicEmbed = null;
        savefiledata(client, message.guild.id);
    }
}