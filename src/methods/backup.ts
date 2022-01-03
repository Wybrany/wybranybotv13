import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import Modified_Client from "../client/Client";
import { join } from "path";
import { Guildsettings } from "../interfaces/guildsettings.interface";
import MusicEmbed from "./music/MusicEmbed";

const backupPath = join(process.cwd(), "./backup");

export const savefiledata = (client: Modified_Client, guildid: string) => {
    try{
        const availableGuildfolders = readdirSync(backupPath);
        const guildFolderPath = join(backupPath, guildid);
        if(!availableGuildfolders.includes(guildid)){
            mkdirSync(guildFolderPath);
            console.log(`Creating new guildfolder => ${guildFolderPath}`);
        }
        const guild = client.guilds.cache.get(guildid);
        if(!guild) return console.error(`Can't find guild when saving.`);
        const newData = {
            guildid: guildid,
            prefix: guild?.prefix ?? null,
            musicChannel: guild?.musicChannel ?? null,
            cahsettings: guild.cahsettings ?? null
        }
        const filePath = join(guildFolderPath, "guilddata.json");
        writeFileSync(filePath, JSON.stringify(newData, null, "\t"));
        console.log(`Writing new data to => ${filePath}`);
    }catch(e){
        console.error(`Something went wrong with saving data ${e}`);
    }
}

export const loadfiledata = (client: Modified_Client) => {

    if(!existsSync(backupPath))
        mkdirSync(backupPath);

    const availableGuildFolder = readdirSync(backupPath);
    if(!availableGuildFolder.length) return console.log(`There are no guildfolders to load!`);

    for(const guildid of availableGuildFolder){
        const finalPath = join(backupPath, guildid, "guilddata.json");
        if(!existsSync(finalPath)) {
            console.warn(`Missing file while loading => ${finalPath}`);
            continue;
        }
        const data: Guildsettings = JSON.parse(readFileSync(finalPath, "utf-8"));
        const guild = client.guilds.cache.get(guildid) || client.guilds.cache.find(g => g.id === guildid);
        if(!guild) {
            console.error(`Can't find guild => ${guildid} when loading data.`);
            continue;
        }
        guild.prefix = data?.prefix ?? process.env.PREFIX as string;
        guild.musicChannel = data?.musicChannel ?? null;
        guild.cahsettings = data?.cahsettings ?? null;
        if(guild.musicChannel && guild.musicChannel.embedid) {
            //Should also check later whether the message actually exist or not.
            guild.musicEmbed = new MusicEmbed(guild, guild.musicChannel);
        }
    }
    console.log(`Successfully loaded some guilddata.`);
}