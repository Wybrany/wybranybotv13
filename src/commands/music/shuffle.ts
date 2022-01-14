import { Message, Permissions } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "shuffle";
    aliases = [];
    category = "music";
    description = "This command toggles a shuffle on this queue.";
    usage = "shuffle";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = false;
    
    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});

        const guildQueue = client.player?.getQueue(message.guild.id);
        if(!guildQueue) return message.error({content: `There are no songs currently playing.`, timed: 5000});
        guildQueue.shuffle();
        const content = `Successfully ${guildQueue.shuffled ? `shuffled` : `unshuffled`} the queue.`;
        message.success({content, timed: 5000});
    }
}