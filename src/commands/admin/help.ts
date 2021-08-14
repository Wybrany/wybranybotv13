import { Message, Permissions, MessageEmbed, Collection, GuildMember } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";

const ownerId = process.env.OWNERID as string;

export default class implements Command {
    name = "help";
    aliases = [];
    category = "admin";
    description = "Returns all available commands, depending on permission, to the user. Alternatively, returning description/usage of a specific command.";
    usage = "help [command]";

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        const command = args.join(" ");
        if(!command) return getAllCommands(client, message);
        else return getCommand(client, message, command);
    }
}

function getAllCommands(client: Modified_Client, message: Message){

    const title = `Available commands for: **${message.author.tag}**`;
    const member = message.guild?.members.cache.get(message.author.id);

    const allCommandsEmbed = new MessageEmbed()
        .setColor("BLUE")
        .setTitle(title)
        .setTimestamp();

    const getCommands = (commands: Collection<string, Command>, message: GuildMember) => {

        return commands.filter(command => message.member?.permissions.has(command?.permission))

        const availableCommands = [];
        commands.forEach((command, key) => {
            const commandPermission = command.permission ? command.permission : "SEND_MESSAGES";
            const commandDeveloperMode = command.developerMode ? true : false;
            const commandOwnerOnly = command.ownerOnly ? true : false;

            if(!message.member.hasPermission(commandPermission) || (commandDeveloperMode == true && message.author.id != ownerID) || (commandOwnerOnly == true && message.author.id != ownerID)) return;
            availableCommands.push(command);
        })
        return availableCommands;
    }

    const getAvailableCommands = await getCommands(client.commands, member);

    const categories = readdirSync("./commands");

    const filterCommandsByCategory = (commands) => {

        const filteredCommands = [];

        for(let category of categories){
            const filter = commands.filter(c => c.category.toLowerCase() === category.toLowerCase());
            if(!filter.length) continue;
            filteredCommands.push({category: category, commands: filter})
        }
        return filteredCommands;
    }

    const getFilteredCommands = filterCommandsByCategory(getAvailableCommands);
    let info = "";
    for(let chunk of getFilteredCommands){
        const category = `${chunk.category.toUpperCase()}`
        const categoryBorder = `${Array(10).fill("-").join("")}${category}${Array(15 - category.length).fill("-").join("")}`
        //const correctionFactor = 14;
        //const whitespaceLength = ((title.length / 2) - (categoryBorder.length / 2) + correctionFactor);
        //const whitespace = `${Array(whitespaceLength).fill('\xa0').join("")}`
        const parsedCommand = chunk.commands.map(c => `\`- ${c.name}${Array(categoryBorder.length - c.name.length - 2).fill('\xa0').join("")}\``).join("\n");
        if(!parsedCommand) continue;
        info += `\`${categoryBorder}\`\n${parsedCommand}\n`
        //allCommandsEmbed.addField(`**${chunk.category.toUpperCase()}**`, `${parsedCommand}`);
    }

    info += `\nUse _help <command> to see more information.`
    allCommandsEmbed.setDescription(`${info}`);
    message.channel.send({embed: allCommandsEmbed});

    return;
    allCommandsEmbed.addField(`Commands`, getCommands(client.commands));
    message.channel.send({embed: allCommandsEmbed})
}

function getCommand(client, message, input){
    const commandEmbed = new MessageEmbed()
    const cmd = client.commands.get(input.toLowerCase()) || client.commands.get(client.aliases.get(input.toLowerCase()));

    let info = `No information found for command **${input.toLowerCase()}**`;

    if (!cmd) {
        message.channel.send(commandEmbed.setColor("RED").setDescription(info));
        return false;
    } 

    const commandPermission = cmd.permission ? cmd.permission : "SEND_MESSAGES";
    const commandDeveloperMode = cmd.developerMode ? true : false;
    const commandOwnerOnly = cmd.ownerOnly ? true : false;

    if(!message.member.hasPermission(commandPermission) || commandDeveloperMode == true && message.author.id != ownerID || commandOwnerOnly == true && message.author.id != ownerID){
        info = `You don't have permission to view: **${cmd.name}**`
        message.channel.send(commandEmbed.setColor("RED").setDescription(info));
        return false;
    }
    if (cmd.name) info = `**Command**: ${cmd.name}`;
    if (cmd.aliases) info += `\n**Aliases**: ${cmd.aliases.map(a => `"${a}"`).join(", ")}`;
    if (cmd.category) info += `\n**Category**: ${cmd.category}`;
    if (cmd.description) info += `\n**Description**: ${cmd.description}`;
    if (cmd.usage) info += `\n**Usage**: ${cmd.usage}`
    commandEmbed.addField("**Syntax**", `<> = required\n[] = optional\n| = or`)
    //embed.setFooter(`Syntax: <> = required, [] = optional, || = or`);

    return message.channel.send(commandEmbed.setColor("GREEN").setDescription(info));
}