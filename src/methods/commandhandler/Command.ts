import { Command } from "src/interfaces/client.interface";
import Client from "../../client/Client";
import { readdirSync } from "fs";
//Fix declaration for this module later.
//import ascii from "ascii-table";

export const Load_Commands = (client: Client, base_path: string) => {
    readdirSync(`./${base_path}/commands/`).forEach(async dir => {
        const commands = readdirSync(`./${base_path}/commands/${dir}`).filter(f => f.endsWith(".js") || f.endsWith(".ts"));
        for(const file of commands){
            if(!file) return;
            const pull = await import(`../../commands/${dir}/${file}`);
            const command: Command = new pull.default();
            if(command.name) 
                client.commands.set(command.name, command);
            if(Array.isArray(command.aliases) && command.aliases && command.aliases.length) 
                command.aliases.forEach(alias => client.aliases.set(alias, command.name));
        }
    });
}