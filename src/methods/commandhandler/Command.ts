import Client from "../client/Client";
import { readdirSync } from "fs";
import ascii from "ascii-table";

const table = new ascii().setHeading("File", "Status");

module.exports = (client: Client) => {
    readdirSync("./commands/").forEach(dir => {
        const commands = readdirSync(`./commands/${dir}`).filter(f => f.endsWith(".js"));
        for(let file of commands){

            const pull = require(`../commands/${dir}/${file}`);

            if (pull.name){
                client.commands.set(pull.name, pull);
                table.addRow(`${file}`, '✅');
            } else {
                table.addRow(`${file}`, '❌');
                continue;
            }
            if(pull.aliases && Array.isArray(pull.aliases)) 
                pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
        }
    });

    console.log(table.toString());
}