import { PartialMessage, Message } from "discord.js";
import Modified_Client from "../methods/client/Client";
import { savefiledata } from "../methods/backup";

export const MessageDelete = async(client: Modified_Client, message: Message | PartialMessage) => {
    if(!client.music.size || !client.guildsettings.size || !message.id || !message.guild) return;
    if(!client.guildsettings.has(message.guild.id)) return;

    const guildSettings = client.guildsettings.get(message.guild.id);
    if(guildSettings?.musicChannel?.embedid === message.id){
        if(!client.music.has(message.guild.id)) return;
        client.music.get(message.guild.id)?.stop();
        client.music.delete(message.guild.id);

        if(guildSettings) client.guildsettings.set(message.guild.id, {...guildSettings, musicChannel: null});
        else client.guildsettings.set(message.guild.id, {guildid: message.guild.id, musicChannel: null});
        savefiledata(client, message.guild.id);
    }
}