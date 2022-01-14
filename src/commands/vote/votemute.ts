import { Message, MessageEmbed, Permissions, MessageButton, MessageActionRow, VoiceChannel } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
import { Vote } from "../../types/vote.interface";
import { Vote_Class } from "../../managers/vote";

export default class implements Command{
    name = "votemute";
    aliases = ["vm"];
    category = "vote";
    description = "Create a poll where you can vote to mute someone.";
    usage = "votemute <@mention>";
    permission = Permissions.FLAGS.SEND_MESSAGES;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        
        const [ target, time ] = args;
        if(!message.guild || !client.user) return message.error({content: 'Something went wrong. Please try again later.', timed: 5000});
        if(!message.guild.members.cache.get(message.author.id)?.voice.channel)
            return message.error({content: 'You must be in a voicechannel to use this command.', timed: 5000});
        
        const mention = message.mentions.users.first() || message.guild.members.cache.get(target) || null;
        if(!mention) return message.error({content: "You need to tag a member or provide an id.", timed: 5000});

        const member = message.guild.members.cache.get(mention.id);
        if(!member) return message.error({content: `That user isn't in this server`, timed: 5000});

        if(client.currentVote.size && client.currentVote.has(member.id)) return message.error({content: `**${member.user.tag}** already has a pending vote.`, timed: 5000});

        const inChannel = member.voice.channel as VoiceChannel | null;
        if(!inChannel) return message.error({content: "User must be in a voicechannel.", timed: 5000});

        const members = [...inChannel.members.values()].filter(m => m.id !== member.id || m.id !== client.user?.id);
        
        const embed = new MessageEmbed()
            .setTitle(`Voting to mute ${member.user.tag}.`)
            .setThumbnail(member.user.displayAvatarURL())
            .setDescription(`Vote "YES" or "NO" if you want to mute this user.\n\n0/${members.length} has voted.`)
            .setTimestamp();

        const buttonYes = new MessageButton()
            .setCustomId(`buttonYes-${member.user.id}`)
            .setLabel("Yes")
            .setStyle("SUCCESS");

        const buttonNo = new MessageButton()
            .setCustomId(`buttonNo-${member.user.id}`)
            .setLabel("No")
            .setStyle("DANGER");

        const interaction = new MessageActionRow()
            .addComponents(buttonYes, buttonNo);

        const newMessage = await message.channel.send({embeds: [embed], components: [interaction]});
        const newVote = new Vote_Class(member, members, newMessage, embed, buttonYes, buttonNo, interaction);
        client.currentVote.set(member.id, newVote);
        client.currentVote.get(member.id)?.startTimer(client);
    }
}