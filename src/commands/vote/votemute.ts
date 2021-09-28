import { Message, MessageEmbed, Permissions, MessageButton, MessageActionRow, VoiceChannel } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { Vote } from "../../interfaces/vote.interface";
import { Vote_Class } from "../../methods/vote/vote";

export default class implements Command{
    name = "votemute";
    aliases = ["vm"];
    category = "vote";
    description = "Create a poll where you can vote to mute someone.";
    usage = "votemute <@mention>";
    permission = Permissions.FLAGS.SEND_MESSAGES;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        
        const [ target, time ] = args;
        if(!message.guild || !client.user) return message.reply({content: 'Something went wrong. Please try again later.'});
        if(!message.guild.members.cache.get(message.author.id)?.voice.channel)
            return message.reply({content: 'You must be in a voicechannel to use this command.'});
        
        const mention = message.mentions.users.first() || message.guild.members.cache.get(target) || null;
        if(!mention) return message.reply({content: "You need to tag a member or provide an id."});

        const member = message.guild.members.cache.get(mention.id);
        if(!member) return message.reply({content: `That user isn't in this server`});

        if(client.currentVote.size && client.currentVote.has(member.id)) return message.reply({content: `**${member.user.tag}** already has a pending vote.`});

        const inChannel = member.voice.channel as VoiceChannel | null;
        if(!inChannel) return message.reply({content: "User must be in a voicechannel."});

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