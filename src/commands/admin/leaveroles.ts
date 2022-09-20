import { Guild, Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "leaveroles";
    aliases = ["leaverole"];
    category = "admin";
    description = "Handle saved roles of kicked/banned members. Options consists of Remove, Add, Update";
    usage = "leaveroles <option> < Name | ID | Mention>";
    permission = PermissionFlagsBits.Administrator;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {
        try{
            await message.delete();
            if(!message.guild.memberLeave)
                return message.error({content: `This command seems to be broken. Contact my daddy :). Reason: No memberLeave class is defined.`, timed: 10000});
            
            const [ option, target ] = args;
            if(!option || !target) 
                return message.error({content: `You need to give me an option (Remove, Add or Update) followed by a user (Name, ID or Mention).`, timed: 10000})

            const member = message.mentions.members.first() || message.guild.members.cache.get(target) || message.guild.members.cache.find(member => (target.trim().toLowerCase() === member.user.username.toLowerCase()) || (member.id === target)) || null;
            if(!member)
                return message.error({content: `I can't find the member you're looking for. Please give me a Name, ID or Mention of the member.`, timed: 10000});

            let response: { success: boolean, type: string } = null;
            switch(option.toLowerCase()){
                case "remove":
                case "delete":
                    response = message.guild.memberLeave.removeLeavingMemberFromCommand(member.id, true);
                break;

                case "add":
                    response = message.guild.memberLeave.addLeavingMemberFromCommand({executor: message.member, target: member});
                break;

                case "update":
                    response = message.guild.memberLeave.updateLeavingMemberFromCommand({ executor: message.member, target: member});
                break;

                default:
                    return message.error({content: `You need to give me an option (Remove, Add or Update) followed by a user (Name, ID or Mention).`, timed: 10000});
            }
            if(response.success) message.success({content: `I have successfully **${response.type}** roles for **${member.user.username}**`, timed: 5000});
            else message.error({content: `This command failed to execute. Reason: ${response.type}`, timed: 10000});

        }catch(e){
            return message.error({content: "Something went wrong. Please try again later...", timed: 5000});
        }
    }
}