import { Button, Queue, RepeatMode, Utils } from "../../player/index";
import { Message, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "queue";
    aliases = ["q"];
    category = "music";
    description = "Displays the current queue.";
    usage = "queue";
    permission = PermissionFlagsBits.SendMessages;
    developerMode=false;
    params = false;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});
        
        const guildQueue = client.player?.getQueue(message.guild.id);
        if(!guildQueue) return message.error({content: `There are no songs currently playing.`, timed: 5000});

        let page = 0;
        const embed = generateEmbed(guildQueue, page);
        
        const nextPageButton = new ButtonBuilder()
            .setCustomId(`QueueNextCommandButton-${message.guild.id}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji("▶️");

        const prevPageButotn = new ButtonBuilder()
            .setCustomId(`QueuePrevCommandButton-${message.guild.id}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji("◀️");

        const actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(prevPageButotn, nextPageButton);
        const embedMessage = await message.channel.send({embeds: [embed], components: [actionRow]});
        const collector = embedMessage.createMessageComponentCollector({time: 120000});

        collector.on("collect", i => {
            const [ button ] = i.customId.split("-");
            const queueLength = Math.ceil(guildQueue.songs.length / 10);
            switch(button){
                case 'QueueNextCommandButton':
                    if(page >= (queueLength - 1)) page = queueLength - 1;
                    else page++;
                break;

                case 'QueuePrevCommandButton':
                    if(page <= 0) page = 0;
                    else page--;
                break;
            }
            let embed = generateEmbed(guildQueue, page);
            embedMessage.edit({embeds: [embed], components: [actionRow]});
        })

        collector.on("end", async i => {
            embedMessage.delete().catch(_ => _);
        });
    }
}

const generateEmbed = (guildQueue: Queue, page: number) => {
    const queueLength = Math.ceil(guildQueue.songs.length / 10);
    const songs = guildQueue.getQueueFromIndex((1 + (10 * page)), 10);
    const queueString = songs.map((s, i) => `${(i + 1) + (page*10)}.) [${s.name}](${s.url}) | \`${s.duration} - ${s.requestedBy?.username ?? "Unknown"}\``).join("\n\n");
    const songLoop = guildQueue.repeatMode === RepeatMode.SONG ? `✅` : `❌`;
    const queueLoop = guildQueue.repeatMode === RepeatMode.QUEUE ? `✅` : `❌`;
    const shuffled = guildQueue.shuffled ? `✅` : `❌`;

    const songsInMs = (songs?.length && songs.length !== 0) && (songs.map(s => s.milliseconds).reduce((acc, red) => (acc + red), 0) ?? 0);
    const duration = (songs?.length && songs.length !== 0) && Utils.msToTime(songsInMs);

    const displaySongs = (songs?.length && songs.length !== 0) && `
        *Up Next*
        ${queueString}\n
        **${songs.length} songs in queue | ${duration}**
    `;

    return new EmbedBuilder()
        .setTitle(`🎵 Current Queue 🎵`)
        .setDescription(`
            *Now Playing:*
            [${guildQueue.nowPlaying?.name}](${guildQueue.nowPlaying?.url}) | \`${guildQueue.nowPlaying?.duration ?? "Unknown"} - ${guildQueue.nowPlaying?.requestedBy?.username ?? "Unknown"}\`\n
            ${displaySongs}
        `)
        .setColor("DarkBlue")
        .setFooter({text: `Page ${page + 1}/${queueLength}. Song loop: ${songLoop} | Queue loop: ${queueLoop} | Shuffled: ${shuffled}`})
        .setTimestamp();
}