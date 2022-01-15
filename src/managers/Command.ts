import { Command } from "src/types/client.interface";
import Client from "../client/Client";
import { readdirSync } from "fs";
import { join, dirname } from "path";

export const Load_Commands = (client: Client) => {
    const basePath = join(dirname(require.main!.filename), "commands")
    readdirSync(basePath).forEach(async dir => {
        const commandDir = join(basePath, dir);
        const commands = readdirSync(commandDir).filter(f => f.endsWith(".js") || f.endsWith(".ts"));
        for(const file of commands){
            if(!file) return;
            const pull = await import(join(commandDir, file));
            const command = new pull.default() as Command;
            if(command.name) 
                client.commands.set(command.name, command);
            if(Array.isArray(command.aliases) && command.aliases && command.aliases.length) 
                command.aliases.forEach(alias => client.aliases.set(alias, command.name));
        }
    });
}