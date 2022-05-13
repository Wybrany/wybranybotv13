import { Message, MessageEmbed, Collection, GuildMember, Permissions } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
import { Killer, Killer_List, Offering, Offering_List, Perk, Standard_Killer_Perks, Exception_Overloader } from "../../types/dbd.interface";
import { readFileSync, existsSync } from "fs";
import { shuffle } from "../../utils/utils";

export default class implements Command {
    name ="killer";
    aliases = [];
    category ="dbd";
    description ="Randomises a killer setup for Dead by Daylight.";
    usage = "killer [param1 [param2 [param3 [...]]]]";
    channelWhitelist = ["dbd-bot"];
    permission = Permissions.FLAGS.SEND_MESSAGES;
    guildWhitelist = ["456094195187449868"];

    run = async (client: Modified_Client, message: Message, args: string[]) => { 
        
        //Parsing
        //Should load these when bot starts instead of every command
        const killers: Killer_List = existsSync("./media/dbd/killers.json") ? JSON.parse(readFileSync("./media/dbd/killers.json", "utf8")) : {};
        const standardPerks: Standard_Killer_Perks = existsSync("./media/dbd/standard_killer_perks.json") ? JSON.parse(readFileSync("./media/dbd/standard_killer_perks.json", "utf8")) : {};
        const offering: Offering_List = existsSync("./media/dbd/map_offerings.json") ? JSON.parse(readFileSync("./media/dbd/map_offerings.json", "utf8")) : {};
        //const globalSettings = existSync("./dbd/settings/killersettings.json") ? JSON.parse(readFileSync("./dbd/settings/killersettings.json", "utf8")) : [];

        if(!Object.entries(killers).length || !Object.entries(standardPerks).length || !Object.entries(offering).length) return message.reply(`Filedata is empty. Please contact an adminstrator.`);
        //Checking for any exceptions
        let useKillerAddons = true;

        const currentKillerList: Killer[] = killers.killer_list;
        const currentKillerPerks: Perk[] = currentKillerList
            .map(killer => killer.perks)
            .concat(standardPerks.standard_killer_perks)
            .flat();
        const currentMapOffering: Offering[] = offering.map_offerings;

        const manualKillerExceptions: Killer[] = [];
        const manualPerkExceptions: Perk[] = [];
        const manualOfferingExceptions: Offering[] = [];

        const manualKillerAdd: Killer[] = [];
        const manualPerkAdd: Perk[] = [];
        const manualOfferingAdd: Offering[] = [];

        let perkLimit = 4;
        let addonLimit = 2;

        if(args.length){
            for(let temp of args){
                const arg = temp.toLowerCase();
                //Checking for boolean values
                if(arg.includes("!killer")){
                    manualKillerExceptions.push(...currentKillerList);
                    continue;
                }
                if(arg.includes("!addon")){
                    useKillerAddons = false;
                    continue;
                }
                if(arg.includes("!perk")){
                    manualPerkExceptions.push(...currentKillerPerks);
                    continue;
                }
                if(arg.includes("!map") || arg.includes("!offering")){
                    manualOfferingExceptions.push(...currentMapOffering);
                    continue;
                }
                // Checking for killer exceptions
                if(args.includes('!dlc') || arg.includes('!dlckiller') || arg.includes('standarkiller')){
                    const noDLCKillers = killers.killer_list.filter(killer => killer.type === "DLC");
                    manualKillerExceptions.push(...noDLCKillers);
                    continue;
                }
                if(arg.includes('dlckiller') || arg.includes('!standardkiller')){
                    const DLConly = killers.killer_list.filter(killer => killer.type === "Standard");
                    manualKillerExceptions.push(...DLConly);
                    continue;
                }
                if(arg.includes('originalkiller') || arg.includes('originalonly')){
                    const originalOnly = killers.killer_list.filter(killer => killer.original === false);
                    manualKillerExceptions.push(...originalOnly);
                    continue;
                }
                // Checking for perk exceptions
                if(arg.includes('!dlcperk') || arg.includes('standardperk')){
                    const DLCperks = killers.killer_list.filter(killer => killer.type === "DLC").map(killer => killer.perks)?.flat();
                    manualPerkExceptions.push(...DLCperks);
                    continue;
                }
                if(arg.includes('dlcperk')){
                    const standardTeachable = killers.killer_list.filter(killer => killer.type === "Standard").map(killer => killer.perks);
                    const nonTeachables = standardPerks.standard_killer_perks;
                    const combined = standardTeachable.concat(nonTeachables).flat(2);
                    manualPerkExceptions.push(...combined);
                    continue;
                }
                if(arg.includes("!teachable")){
                    const teachables = killers.killer_list.map(killer => killer.perks)?.flat();
                    manualPerkExceptions.push(...teachables);
                    continue;
                }
                //Checking for limits
                if(arg.includes("perklimit")){
                    const limit = arg.substring("perklimit".length).replace(/\-/g, "");
                    const filterInt = (value: string) => /^[-+]?(\d+|Infinity)$/.test(value) ? Number(value) : NaN;
                    let convertedLimit = filterInt(limit);
                    if(Number.isNaN(convertedLimit)) continue;
                    perkLimit = convertedLimit > 4 ? 4 : convertedLimit;
                    continue;
                }
                if(arg.includes("addonlimit")){
                    const limit = arg.substring("addonlimit".length).replace(/\-/g, "");
                    const filterInt = (value: string) => /^[-+]?(\d+|Infinity)$/.test(value) ? Number(value) : NaN;
                    let convertedLimit = filterInt(limit);
                    if(Number.isNaN(convertedLimit)) continue;
                    addonLimit = convertedLimit > 2 ? 2 : convertedLimit;
                    continue;
                }
                
                // Should check for addon exceptions, ex. no red addons or a specific addon in mind.
                
                //Checking for any specific killer, perk or offering exceptions
                if(arg.startsWith("!")){
                    const matchString = arg.substring(1).toLowerCase().replace(/\-/g, " ");
                    const excludedKiller = currentKillerList.filter(killer => killer.name.toLowerCase().includes(matchString));
                    const excludedKillerAliases = currentKillerList.filter(killer => killer.aliases.map(a => a.toLowerCase()).includes(matchString));
                    if(excludedKiller.length) {
                        manualKillerExceptions.push(...excludedKiller);
                        continue;
                    }
                    else if (excludedKillerAliases.length){
                        manualKillerExceptions.push(...excludedKillerAliases);
                        continue;
                    }
                    const excludedPerk = currentKillerPerks.filter(perk => perk.name.toLowerCase().includes(matchString));
                    const excludedPerkAliases = currentKillerPerks.filter(perk => perk.aliases.map(a => a.toLowerCase()).includes(matchString));
                    if(excludedPerk.length) {
                        manualPerkExceptions.push(...excludedPerk);
                        continue;
                    }
                    else if(excludedPerkAliases.length){
                        manualPerkExceptions.push(...excludedPerkAliases);
                        continue;
                    }
                    const excludedOffering = currentMapOffering.filter(offer => offer.name.toLowerCase().includes(matchString));
                    const excludedOfferingAliases = currentMapOffering.filter(offer => offer.aliases.map(a => a.toLowerCase()).includes(matchString));
                    if(excludedOffering.length){
                        manualOfferingExceptions.push(...excludedOffering);
                        continue;
                    }
                    else if(excludedOfferingAliases.length){
                        manualOfferingExceptions.push(...excludedOfferingAliases);
                        continue;
                    }

                    continue;
                }
                //Checking for any specific killer, perk or offering inclusion
                if(arg.startsWith("+")){
                    const matchString = arg.substring(1).toLowerCase().replace(/\-/g, " ");
                    const includedKiller = currentKillerList.filter(killer => killer.name.toLowerCase().includes(matchString));
                    const includedKillerAliases = currentKillerList.filter(killer => killer.aliases.map(a => a.toLowerCase()).includes(matchString));
                    if(includedKiller.length) {
                        manualKillerAdd.push(...includedKiller)
                        continue;
                    }
                    else if (includedKillerAliases.length){
                        manualKillerAdd.push(...includedKillerAliases);
                        continue;
                    }
                    const includedPerk = currentKillerPerks.filter(perk => perk.name.toLowerCase().includes(matchString));
                    const includedPerkAliases = currentKillerPerks.filter(perk => perk.aliases.map(a => a.toLowerCase()).includes(matchString));
                    if(includedPerk.length) {
                        manualPerkAdd.push(...includedPerk);
                        continue;
                    }
                    else if(includedPerkAliases.length){
                        manualPerkAdd.push(...includedPerkAliases);
                        continue;
                    }
                    const includedOffering = currentMapOffering.filter(offer => offer.name.toLowerCase().includes(matchString))
                    const includedOfferingAliases = currentMapOffering.filter(offer => offer.aliases.map(a => a.toLowerCase()).includes(matchString));
                    if(includedOffering.length){
                        manualOfferingAdd.push(...includedOffering);
                        continue;
                    }
                    else if(includedOfferingAliases.length){
                        manualOfferingAdd.push(...includedOfferingAliases);
                        continue;
                    }
                    continue;
                }
            }
        }

        //Takes the current killerlist, remove any excluded, add any included, and then remove duplicates.
        const filterExceptions: Exception_Overloader = (current, excluded, included) => {
            const exceptions: string[] = excluded.map(e => e.name);
            const currentNames: string[] = current.map(e => e.name);
            const includedNames: string[] = included.map(e => e.name);
            const removeExcluded = currentNames.filter(cur => !exceptions.includes(cur)).concat(includedNames);
            return [...new Set(removeExcluded)];
        }

        const newKillerNames: string[] = filterExceptions(currentKillerList, manualKillerExceptions, manualKillerAdd);
        const newKillerList: Killer[] = currentKillerList.filter(killer => newKillerNames.includes(killer.name));

        const newKillerPerksNames: string[] = filterExceptions(currentKillerPerks, manualPerkExceptions, manualPerkAdd);
        const newKillerPerks: Perk[] = currentKillerPerks.filter(perk => newKillerPerksNames.includes(perk.name));

        const newMapOfferingsNames: string[] = filterExceptions(currentMapOffering, manualOfferingExceptions, manualOfferingAdd);
        const newMapOfferings: Offering[] = currentMapOffering.filter(offering => newMapOfferingsNames.includes(offering.name));

        //console.log(newMapOfferings.map(m => m.name));

        let killerNum = 0;
        let addonLength = 0;
        let addonNum: number[] = [];
        let ranKiller = "";
        let ranAddons: string[] = [];

        //If there are any killers to randomize, do so. Including addons.
        if(newKillerList.length) {
            killerNum = shuffle(newKillerList.length, 1) as number;
            addonLength = newKillerList[killerNum].addons.length;
            addonNum = shuffle(addonLength, addonLimit) as number[];
            ranKiller = newKillerList[killerNum].name;
            addonNum.forEach(n => ranAddons.push(newKillerList[killerNum].addons[n]));
        }

        let perkNum: number[] = [];
        //let purpleperks = {};
        //let greenPerks = {};
        let sortedPerkList: Perk[];
        let chunkArray: Perk[][] = [];
        let pages: number[] = [];

        //A compare function to being able to sort objects properly by their perk names.
        const compare = (a: any, b: any) => {
            const aUpper = a.name.toUpperCase();
            const bUpper = b.name.toUpperCase();
        
            let comparison = 0;
            if(aUpper > bUpper) comparison = 1;
            else if(aUpper < bUpper) comparison = -1;
            
            return comparison;
        }

        //If there are any perks to randomize, do so. Check for perklimit, sort the pages according to DBD, assign page numbers, and return;
        if(newKillerPerks.length) {
            if(!(newKillerPerks.length >= perkLimit)) perkLimit = newKillerPerks.length;
            perkNum = shuffle(newKillerPerks.length, perkLimit) as number[];

            sortedPerkList = currentKillerPerks.sort(compare);
            //greenPerks = currentKillerPerks.filter(perk => perk.color === "GREEN").sort(compare);
            //sortedPerkList = purplePerks.concat(greenPerks);

            for(let index = 0; index < sortedPerkList.length; index += 15){
                chunkArray.push(sortedPerkList.slice(index, index + 15));
            }
    
            perkNum.forEach(n => {
                chunkArray.forEach((chunk: Perk[], index: number) => {
                    const mapPerk = chunk.map(perkObject => perkObject.name);
                    if(mapPerk.includes(newKillerPerks[n].name)) return pages.push(index + 1)
                })
            })
        }
        
        let offerNum: number;
        let ranOffer = "";

        //If there are any offerings to ranomize, do so.
        if(newMapOfferings.length) {
            offerNum = shuffle(newMapOfferings.length, 1) as number;
            ranOffer = newMapOfferings[offerNum].name;
        }

        //Creates a custom array, with dashes containing a specific length to ensure consitency in line block
        const fillerBorder = `${Array(46).fill('-').join("")}`;

        let killerAddonsBorder = "";

        if(useKillerAddons && addonLimit !== 0 && ranKiller){

            const replaceTextWithEmoji = (array: string[]) => array.map(addon => 
                       addon.startsWith("RED")    ? addon.replace("RED", "🟥")
                     : addon.startsWith("PURPLE") ? addon.replace("PURPLE", "🟪")
                     : addon.startsWith("GREEN")  ? addon.replace("GREEN", "🟩")
                     : addon.startsWith("YELLOW") ? addon.replace("YELLOW", "🟨")
                     : addon.replace("BROWN", "🟫")
                )

            const killerAddonsTitle = `${Array(15).fill("-").join("")}🪓 Killeraddon${Array(16).fill("-").join("")}`;
            const replacedAddons = replaceTextWithEmoji(ranAddons);
            const addonText = replacedAddons.map(a => `${a} ${Array((fillerBorder.length - (a.length + 2))).fill('\xa0').join("")}`)

            killerAddonsBorder = `\`${killerAddonsTitle}\`\n\`${addonText.join("\`\n\`")}\`\n`
        }

        let killerPerksBorder = "";

        if(perkLimit !== 0 && perkNum.length && newKillerPerks.length){
            const killerPerksTitle = `${Array(15).fill("-").join("")}📜 Killerperks${Array(16).fill("-").join("")}`;
            let killerPerks: {name: string; text: string; page: number}[] = [];
            perkNum.forEach((n, i) => {
                const killerPerk = newKillerPerks[n].name;
                const perkColor = newKillerPerks[n].color === "PURPLE" ? `🟪` : `🟪`;
                const addedLength = `${perkColor} ${killerPerk} ${Array((fillerBorder.length - (`${perkColor} `.length + `${killerPerk} `.length + `| Page ${pages[i]}`.length + 2))).fill('\xa0').join("")}| Page ${pages[i]} `;
                const constructor = {
                    name: killerPerk,
                    text: addedLength,
                    page: pages[i]
                }
                return killerPerks.push(constructor)
            })
            const sortedPerks = killerPerks.sort(compare);
            killerPerksBorder = `\`${killerPerksTitle}\`\n\`${sortedPerks.map(perk => perk.text).join("\`\n\`")}\`\n`
        }

        let mapOfferingBorder = "";
        
        if(ranOffer){

            const mapOfferingTitle = `${Array(15).fill("-").join("")}🗺️ Mapoffering${Array(16).fill("-").join("")}`;
            const addedLengthRanOffer = `🟩 ${ranOffer} ${Array((fillerBorder.length - (`🟩 ${ranOffer}`.length + 2))).fill('\xa0').join("")}`;

            mapOfferingBorder = `\`${mapOfferingTitle}\`\n\`${addedLengthRanOffer}\`\n`;
        }

        const description = `${killerAddonsBorder}${mapOfferingBorder}${killerPerksBorder}` || "You selected nothing for some reason."
        const killerEmbed = new MessageEmbed()
            .setDescription(description)
            .setColor("RED")
            .setTimestamp()

        let files = [];

        if(ranKiller){
            const killerTitle = `\`Randomised Killer: 🔪 ${ranKiller} 🔪\``;

            killerEmbed
                .setTitle(killerTitle)
                .setThumbnail(`attachment://${ranKiller.replace(/\s+/g, '')}.png`)
            
            files.push(`./media/dbd/killerimg/${ranKiller.replace(/\s+/g, '')}.png`)
        }
        
        //ATM the exceptions are not working, fix them later
        //Also add discordbuttons to toggle images for perks, maybe addons/items later as well :) 

        //Sending
        await message.author.send({embeds: [killerEmbed], files}).catch(error => {
            message.error({content: `I could not DM you. Please check your privacy settings!`, timed: 10000});
            console.log(error)
        }); 
    }
}