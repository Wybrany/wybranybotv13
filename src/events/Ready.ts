import Modified_Client from "../client/Client";
import { loadfiledata } from "../managers/backup"

export const Ready = (client: Modified_Client) => {
    console.log(`Successfully Logged in as ${client.user?.username}! (${client.user?.id})\nCurrently serving: ${client.guilds.cache.size} servers.`);
    client.user?.setActivity({name: "Something"});
    loadfiledata(client);
}