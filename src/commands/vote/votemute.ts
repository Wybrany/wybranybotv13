import { Message, MessageEmbed, Permissions, MessageButton, MessageActionRow } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";

export default class implements Command{
    name = "votemute";
    aliases = ["vm"];
    category = "vote";
    description = "Create a poll where you can vote to mute someone.";
    usage = "votemute <@mention>";
    permission = Permissions.FLAGS.ADMINISTRATOR;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        const [ target, time ] = args;
        if(!message.guild) return message.reply({content: 'Something went wrong. Please try again later.'});

        const mention = message.mentions.users.first() || message.guild.members.cache.get(target) || null;
        if(!mention) return message.reply({content: "You need to tag a member or provide an id."});

        const member = message.guild.members.cache.get(mention.id);
        if(!member) return message.reply({content: `That user isn't in this server`});

        //const inChannel = member.voice.channel;
        //if(!inChannel) return message.reply({content: "User must be in a voicechannel."});

        const embed = new MessageEmbed()
            .setTitle(`Voting to mute ${member.nickname}.`)
            .setDescription(``)
            .setTimestamp()

        const buttonYes = new MessageButton();
        const buttonNo = new MessageButton();

        const interaction = new MessageActionRow()
            .addComponents(buttonYes, buttonNo);
        
        message.channel.send({embeds: [embed], components: [interaction]});
    }
}