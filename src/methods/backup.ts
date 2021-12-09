import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import Modified_Client from "./client/Client";
import { join } from "path";
import { Guildsettings } from "../interfaces/guildsettings.interface";

const backupPath = "./backup";

export const savefiledata = (client: Modified_Client, guildid: string) => {
    try{
        const availableGuildfolders = readdirSync(backupPath);
        const guildFolderPath = join(backupPath, guildid);
        if(!availableGuildfolders.includes(guildid)){
            mkdirSync(guildFolderPath);
            console.log(`Creating new guildfolder => ${guildFolderPath}`);
        }
        const settings = client.guildsettings.get(guildid);
        const cahsettings = client.cahsettings.get(guildid);
        const newData = {
            guildid: guildid,
            prefix: settings?.prefix ?? null,
            musicChannel: settings?.musicChannel ?? null,
            cahsettings: cahsettings ?? null
        }
        const filePath = join(guildFolderPath, "guilddata.json");
        writeFileSync(filePath, JSON.stringify(newData, null, "\t"));
        console.log(`Writing new data to => ${filePath}`);
    }catch(e){
        console.error(`Something went wrong with saving data ${e}`);
    }
}

export const loadfiledata = (client: Modified_Client) => {
    const availableGuildFolder = readdirSync(backupPath);
    if(!availableGuildFolder.length) return console.log(`There are no guildfolders to load!`);

    for(const guildid of availableGuildFolder){
        const finalPath = join(backupPath, guildid, "guilddata.json");
        if(!existsSync(finalPath)) {
            console.warn(`Missing file while loading => ${finalPath}`);
            continue;
        }
        const data: Guildsettings = JSON.parse(readFileSync(finalPath, "utf-8"));
        const { prefix = `${process.env.PREFIX as string}`, musicChannel = null, cahsettings = null } = data;
        const newData = {
             guildid,
             prefix
        }
        if(musicChannel !== null) Object.assign(newData, {musicChannel});
        if(cahsettings !== null) client.cahsettings.set(guildid, cahsettings);
        client.guildsettings.set(guildid, newData);
    }
    console.log(`Successfully loaded some guilddata.`);
}