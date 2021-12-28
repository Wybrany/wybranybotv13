import { Message, Permissions, MessageEmbed } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../interfaces/client.interface";

export default class implements Command{
    name = "queue";
    aliases = ["q"];
    category = "music";
    description = "Displays the current queue.";
    usage = "queue";
    permission = Permissions.FLAGS.SEND_MESSAGES;
    developerMode=false;
    params = false;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        const search = args.join(" ");
        
        if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});
        
        const guildQueue = client.player?.getQueue(message.guild.id);
        if(!guildQueue) return message.error({content: `There are no songs currently playing.`, timed: 5000});

        const queueString = guildQueue.songs.map((s, i) => `${i+1}.) ${s.name} | ${s.duration} - ${s.requestedBy?.username ?? "Unknown"}`).join("\n");

        const embed = new MessageEmbed()
        .setTitle(`🎵 Current Queue 🎵`)
            .setDescription(`\`\`\`${queueString}\`\`\``)
            .setColor("DARK_BLUE")
            .setFooter(`Page x/x`)
            .setTimestamp();
    
        message.channel.send({embeds: [embed]});
    }
}