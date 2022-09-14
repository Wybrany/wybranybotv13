import { Message, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ActionRowBuilder, VoiceChannel, GuildMember, ButtonStyle, ComponentType } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
import { Vote_Class } from "../../managers/vote";

export default class implements Command {
    name = "votemute";
    aliases = ["vm"];
    category = "vote";
    description = "Create a poll where you can vote to mute someone.";
    usage = "votemute <@mention>";
    permission = PermissionFlagsBits.SendMessages;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        
        let [ target, time = "60000" ] = args;
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
        if(!members.length || members.length <= 2) return message.error({content: "You have to be atleast 3 users in a voicechannel to use this command.", timed: 5000});

        const embed = new EmbedBuilder()
            .setTitle(`Voting to mute ${member.user.tag}.`)
            .setThumbnail(member.user.displayAvatarURL())
            .setDescription(`Vote "YES" or "NO" if you want to mute this user.\n\n1/${members.length} has voted.`)
            .setTimestamp();

        const buttonYes = new ButtonBuilder()
            .setCustomId(`buttonYes-${member.user.id}`)
            .setLabel("Yes")
            .setStyle(ButtonStyle.Success);

        const buttonNo = new ButtonBuilder()
            .setCustomId(`buttonNo-${member.user.id}`)
            .setLabel("No")
            .setStyle(ButtonStyle.Danger);

        const interaction = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(buttonYes, buttonNo);

        const newMessage = await message.channel.send({embeds: [embed], components: [interaction]});
        const newVote = new Vote_Class(member, members, newMessage, embed, buttonYes, buttonNo, interaction);
        client.currentVote.set(member.id, newVote);

        const collector = newMessage.createMessageComponentCollector({componentType: ComponentType.Button, time: parseFloat(time) ?? 60000});

        collector.on('collect', i => {
            const [ type, id ] = i.customId.split("-");
            if(client.currentVote.has(i.user.id) || !client.currentVote.size) return;
            const currentVote = client.currentVote.get(id);
            const answer = type === "buttonNo" ? "NO" : "YES"
            const getVote = currentVote?.getVote(i.member as GuildMember);
            if(!getVote) currentVote?.addVote(client, i.member as GuildMember, answer);
            else if(getVote.vote !== answer) currentVote?.updateVote(i.member as GuildMember, answer);
            
            if(currentVote?.currentVotes.length === currentVote?.members.length)
                collector.stop();
        });

        collector.on('end', (collected) => {
            client.currentVote.get(member.id)?.checkVotes(client);
        })
    }
}