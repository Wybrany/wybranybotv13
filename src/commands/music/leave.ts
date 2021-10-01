import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";
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
        if(!message.guild || !message.member || !client.user) return deleteMessage(`Something went wrong. Please try again later.`, message);

        if (!message.member.voice.channel) 
            return deleteMessage("You need to be in a voice channel to summon me.", message);
        
        const connection = getVoiceConnection(message.guild.id);
        if(connection) {
            const music = client.music.get(message.guild.id);
            if(music) music?.stop(undefined, true);
            else connection.destroy();
        }
    }
}