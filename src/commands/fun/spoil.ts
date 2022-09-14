import { Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command {
    name = "spoil";
    aliases = [];
    category ="fun";
    description ="Spoils a string, either char by char, word by word or an entire sentence";
    usage =`_spoil <char | word | sentence> <text>`;
    permission = PermissionFlagsBits.SendMessages;
    guildWhitelist = ["456094195187449868"];
    developerMode = true;
    params = true;
    
    run = async (client: Modified_Client, message: Message, args: string[]) => {

        message.delete();
        const [ usage, ...spoil] = args;

        if(!usage || !spoil.length)
            return message.error({content: "You are missing arguments. Usage: command <char | word | sentence> <text>", timed: 7500});

        switch(usage){
            case 'word':
                const newWord = spoil.map(arg => `||${arg}||`).join("|| ||")
                message.channel.send({content: newWord});
            break;
            case 'char':
                const newChar = spoil
                    .map(word => word.split('').map(char => `||${char}||`).join(""))
                    .join("|| ||");
                message.channel.send({content: newChar});
            break;

            case 'sentence':
                const newSentence = args.join(" ")
                message.channel.send({content: `||${newSentence}||`});
            break;

            default:
                message.error({content: `The type you submitted did not match anything. You can use "char", "word" or "sentance".`, timed: 7500});
            break;

        } 
    }
}