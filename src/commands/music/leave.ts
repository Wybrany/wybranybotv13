import { Message, Permissions } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
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
        if(!message.guild || !message.member || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});

        if (!message.member.voice.channel) 
            return message.error({content: "You need to be in a voice channel to summon me.", timed: 5000});
        
        const connection = getVoiceConnection(message.guild.id);
        if(connection) connection.destroy();
    }
}