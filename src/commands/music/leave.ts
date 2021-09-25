import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { getVoiceConnection } from "@discordjs/voice";

export default class implements Command{
    name = "leave";
    aliases = [];
    category = "music";
    description = "Leaves the current voicechannel ";
    usage = "leave";
    permission = Permissions.FLAGS.SEND_MESSAGES;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !message.member) return;

        if (!message.member.voice.channel) 
            return message.reply({content: "You need to be in a voice channel to summon me."});
        
        const connection = getVoiceConnection(message.guild.id);
        if(connection) {
            const music = client.music.get(message.guild.id);
            if(music) music?.stop(undefined, true);
            else connection.destroy();
        }
    }
}