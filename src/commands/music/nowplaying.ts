import { Message, MessageEmbed, Permissions } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "nowplaying";
    aliases = ["np"];
    category = "music";
    description = "Shows the current track playing.";
    usage = "nowplaying";
    permission = Permissions.FLAGS.SEND_MESSAGES;
    developerMode=false;
    params = false;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        const search = args.join(" ");
        
        if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});
        
        const guildQueue = client.player?.getQueue(message.guild.id);
        if(!guildQueue || !guildQueue.isPlaying) return message.error({content: `There are no songs currently playing.`, timed: 5000});

        const progressBar = guildQueue.createProgressBar({size: 25, block: "▬", arrow: "🔘", time: true, whitespace: false}) ?? "No progressbar available."

        const embed = new MessageEmbed()
            .setTitle(`🎵 Now playing 🎵`)
            .setDescription(`\n▶️ ${guildQueue.nowPlaying?.name ?? "Unkown Title"} | ${guildQueue.nowPlaying?.duration ?? "Unknown Duration"}\n\n${progressBar}\n\n${guildQueue.songs.length === 1 ? `${guildQueue.songs.length} song remaining.` : `${guildQueue.songs.length} songs remaining.`}`)
            .setColor("DARK_GREEN")
            .setFooter(`Requested by: ${guildQueue.nowPlaying?.requestedBy?.username ?? "Unknown user"}`)
            .setTimestamp();

        guildQueue.paused ? embed.setColor("DARK_RED").setTitle(`Track currently paused.`) : embed.setColor("DARK_GREEN");
        
        message.channel.send({embeds: [embed]});
    }
}