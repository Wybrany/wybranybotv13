import { Message } from "discord.js";

export const deleteMessage = async(content: string, message: Message, time_ms: number = 3000): Promise<void> => {
    const sentMessage = await message.channel.send({content});
    setTimeout(() => sentMessage.delete(), time_ms);
}