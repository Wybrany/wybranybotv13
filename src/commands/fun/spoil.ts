import { Message, MessageEmbed, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";

export default class implements Command {
    name = "spoil";
    aliases = [];
    category ="fun";
    description ="Spoils a string, either char by char, word by word or an entire sentence";
    usage =`_spoil <char | word | sentence> <text>`;
    permission =  Permissions.FLAGS.SEND_MESSAGES;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        message.delete();
        const [ usage, ...spoil] = args;

        if(!usage || !spoil.length)
            return message.reply({content: "You are missing arguments. Usage: command <char | word | sentence> <text>"});

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
                message.reply({content: `The type you submitted did not match anything. You can use "char", "word" or "sentance".`});
            break;

        } 
    }
}