import { Message, MessageEmbed, Collection, GuildMember, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { Survivor, Survivor_List, Offering, Offering_List, Perk, Standard_Survivor_Perks, Exception_Overloader, Item_Addons, Item_Addon } from "../../interfaces/dbd.interface";
import { readFileSync, existsSync } from "fs";
import { shuffle } from "../../methods/shuffle";

export default class implements Command {
    name = "survivor";
    aliases = [];
    category = "dbd";
    description ="Randomises a survivor setup for Dead by Daylight.";
    usage = "_survivor";
    channelWhitelist = ["dbd-bot"];
    permission = Permissions.FLAGS.SEND_MESSAGES;
    guildWhitelist = ["456094195187449868"];

    run = async (client: Modified_Client, message: Message, args: string[]) => { 

        //Parsing
        //Should load these when bot starts instead of every command
        const survivor: Survivor_List = JSON.parse(readFileSync("./media/dbd/survivors.json", "utf8"));
        const items_Addons: Item_Addons = JSON.parse(readFileSync("./media/dbd/items_addons.json", "utf8"));
        const standardPerks: Standard_Survivor_Perks = JSON.parse(readFileSync(`./media/dbd/survivor_perks.json`, "utf8"));
        const offering: Offering_List = JSON.parse(readFileSync(`./media/dbd/map_offerings.json`, "utf8"));
        //const globalSettings = JSON.parse(readFileSync("./dbd/settings/survivorsettings.json", "utf8"));

        let useRandomItemAddons = true;

        const currentSurvivorList = survivor.survivor_list;
        const currentSurvivorPerks = currentSurvivorList
            .map(survivor => survivor.perks)
            .concat(standardPerks.standard_survivor_perks)
            .flat();
        const currentMapOffering = offering.map_offerings;
        const currentItem_Addons = items_Addons.item_list;

        const manualSurvivorExceptions: Survivor[] = [];
        const manualSurvivorItemExceptions: Item_Addon[] = [];
        const manualPerkExceptions: Perk[] = [];
        const manualOfferingExceptions: Offering[] = [];

        const manualSurvivorAdd: Survivor[] = [];
        const manualSurvivorItemAdd: Item_Addon[] = [];
        const manualPerkAdd: Perk[] = [];
        const manualOfferingAdd: Offering[] = [];

        let perkLimit = 4;
        let addonLimit = 2;

        if(args.length){
            for(let temp of args){
                const arg = temp.toLowerCase();
                //Checking for boolean values
                if(arg.includes("!survivor")){
                    manualSurvivorExceptions.push(...currentSurvivorList);
                    continue;
                }
                if(arg.includes("!item")){
                    manualSurvivorItemExceptions.push(...currentItem_Addons);
                    continue;
                }
                if(arg.includes("!addon")){
                    useRandomItemAddons = false;
                    continue;
                }
                if(arg.includes("!perk")){
                    manualPerkExceptions.push(...currentSurvivorPerks);
                    continue;
                }
                if(arg.includes("!map") || arg.includes("!offering")){
                    manualOfferingExceptions.push(...currentMapOffering);
                    continue;
                }
                // Checking for survivor exceptions
                if(arg.includes('!dlc') || arg.includes('!dlcsurvivor') || arg.includes('standardsurvivor')){
                    const noDLCSurvivors = currentSurvivorList.filter(survivor => survivor.type === "DLC");
                    manualSurvivorExceptions.push(...noDLCSurvivors);
                    continue;
                }
                if(arg.includes('dlcsurvivor') || arg.includes('!standardsurvivor')){
                    const DLConly = currentSurvivorList.filter(survivor => survivor.type === "Standard");
                    manualSurvivorExceptions.push(...DLConly);
                    continue;
                }
                if(arg.includes('originalsurvivor') || arg.includes('originalonly')){
                    const originalOnly = currentSurvivorList.filter(survivor => survivor.original === false);
                    manualSurvivorExceptions.push(...originalOnly);
                    continue;
                }
                // Checking for perk exceptions
                if(arg.includes('!dlcperk') || arg.includes('standardperk')){
                    const DLCperks = currentSurvivorList.filter(survivor => survivor.type === "DLC").map(survivor => survivor.perks).flat();
                    manualPerkExceptions.push(...DLCperks);
                    continue;
                }
                if(arg.includes('dlcperk')){
                    const standardTeachable = currentSurvivorList.filter(survivor => survivor.type === "Standard").map(survivor => survivor.perks);
                    const nonTeachables = standardPerks.standard_survivor_perks;
                    const combined = standardTeachable.concat(nonTeachables).flat(2);
                    manualPerkExceptions.push(...combined);
                    continue;
                }
                if(arg.includes("!teachable")){
                    const teachables = currentSurvivorList.map(survivor => survivor.perks).flat();
                    manualPerkExceptions.push(...teachables);
                    continue;
                }

                //Should add item types exceptions, eg. No toolbox, flashlight etc.

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

                //Checking for any specific killer, item, perk or offering exceptions
                if(arg.startsWith("!")){
                    //Matching any survivorname or aliases
                    const matchString = arg.substring(1).toLowerCase().replace(/\-/g, " ");
                    const excludedSurvivor = currentSurvivorList.filter(survivor => survivor.name.toLowerCase().includes(matchString));
                    const excludedSurvivorAliases = currentSurvivorList.filter(survivor => survivor.aliases.map(a => a.toLowerCase()).includes(matchString));
                    if(excludedSurvivor.length) {
                        manualSurvivorExceptions.push(...excludedSurvivor);
                        continue;
                    }
                    else if (excludedSurvivorAliases.length){
                        manualSurvivorExceptions.push(...excludedSurvivorAliases);
                        continue;
                    }
                    //Matching any survivoritem, itemtype or itemaliases.
                    const excludedItem = currentItem_Addons.filter(item => item.name.toLowerCase().includes(matchString))
                    const excludedItemType = currentItem_Addons.filter(item => item.type.toLowerCase().includes(matchString));
                    const excludedItemAliases = currentItem_Addons.filter(item => item.aliases.map(a => a.toLowerCase()).includes(matchString));
                    if(excludedItemType.length){
                        manualSurvivorItemExceptions.push(...excludedItemType);
                        continue;
                    }
                    else if(excludedItem.length){
                        manualSurvivorItemExceptions.push(...excludedItem);
                        continue;
                    }
                    else if(excludedItemAliases.length){
                        manualSurvivorItemExceptions.push(...excludedItemAliases);
                        continue;
                    }
                    //Matching any survivorperk or perkaliases
                    const excludedPerk = currentSurvivorPerks.filter(perk => perk.name.toLowerCase().includes(matchString));
                    const excludedPerkAliases = currentSurvivorPerks.filter(perk => perk.aliases.map(a => a.toLowerCase()).includes(matchString));
                    if(excludedPerk.length) {
                        manualPerkExceptions.push(...excludedPerk);
                        continue;
                    }
                    else if(excludedPerkAliases.length){
                        manualPerkExceptions.push(...excludedPerkAliases);
                        continue;
                    }
                    //Matching any mapoffering or mapaliases
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
                    const includedSurvivor = currentSurvivorList.filter(survivor => survivor.name.toLowerCase().includes(matchString));
                    const includedSurvivorAliases = currentSurvivorList.filter(survivor => survivor.aliases.map(a => a.toLowerCase()).includes(matchString));
                    if(includedSurvivor.length) {
                        manualSurvivorAdd.push(...includedSurvivor)
                        continue;
                    }
                    else if (includedSurvivorAliases.length){
                        manualSurvivorAdd.push(...includedSurvivorAliases);
                        continue;
                    }
                    //Matching any survivoritem, itemtype or itemaliases.
                    const includedItem = currentItem_Addons.filter(item => item.name.toLowerCase().includes(matchString))
                    const includedItemType = currentItem_Addons.filter(item => item.type.toLowerCase().includes(matchString));
                    const includedItemAliases = currentItem_Addons.filter(item => item.aliases.map(a => a.toLowerCase()).includes(matchString));
                    if(includedItemType.length){
                        manualSurvivorItemAdd.push(...includedItemType);
                        continue;
                    }
                    else if(includedItem.length){
                        manualSurvivorItemAdd.push(...includedItem);
                        continue;
                    }
                    else if(includedItemAliases.length){
                        manualSurvivorItemAdd.push(...includedItemAliases);
                        continue;
                    }

                    const includedPerk = currentSurvivorPerks.filter(perk => perk.name.toLowerCase().includes(matchString));
                    const includedPerkAliases = currentSurvivorPerks.filter(perk => perk.aliases.map(a => a.toLowerCase()).includes(matchString));
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

        //Takes the current list, remove any excluded, add any included, and then remove duplicates.
        const filterExceptions: Exception_Overloader = (current, excluded, included) => {
            const exceptions: string[] = excluded.map(e => e.name);
            const currentNames: string[] = current.map(e => e.name);
            const includedNames: string[] = included.map(e => e.name);
            const removeExcluded = currentNames.filter(cur => !exceptions.includes(cur)).concat(includedNames);
            return [...new Set(removeExcluded)];
        }

        const newSurvivorListNames: string[] = filterExceptions(currentSurvivorList, manualSurvivorExceptions, manualSurvivorAdd);
        const newSurvivorList: Survivor[] = currentSurvivorList.filter(survivor => newSurvivorListNames.includes(survivor.name));

        const newSurvivorLoadoutNames: string[] = filterExceptions(currentItem_Addons, manualSurvivorItemExceptions, manualSurvivorItemAdd)
        const newSurvivorLoadout: Item_Addon[] = currentItem_Addons.filter(addon => newSurvivorLoadoutNames.includes(addon.name));

        const newSurvivorPerksNames: string[] = filterExceptions(currentSurvivorPerks, manualPerkExceptions, manualPerkAdd);
        const newSurvivorPerks: Perk[] = currentSurvivorPerks.filter(perk => newSurvivorPerksNames.includes(perk.name));

        const newMapOfferingsNames: string[] = filterExceptions(currentMapOffering, manualOfferingExceptions, manualOfferingAdd);
        const newMapOfferings: Offering[] = currentMapOffering.filter(offering => newMapOfferingsNames.includes(offering.name));

        let survivorNum = 0;
        let ranSurvivor = "";

        //If there are any survivors to randomize, do so. Including addons.
        if(newSurvivorList.length) {
            survivorNum = shuffle(newSurvivorList.length, 1) as number;
            ranSurvivor = newSurvivorList[survivorNum].name;
        }

        let itemNum = 0;
        let addonNum = [];
        let ranItem = "";
        let ranAddons: string[] = [];

        if(newSurvivorLoadout.length){
            itemNum = shuffle(newSurvivorLoadout.length, 1) as number;
            ranItem = newSurvivorLoadout[itemNum].name;
            if(newSurvivorLoadout[itemNum].type !== "Firecracker") {
                addonNum = shuffle(newSurvivorLoadout[itemNum].addons.length, addonLimit) as number[]; 
                ranAddons = addonNum.map(n => newSurvivorLoadout[itemNum].addons[n]);
            }
        }

        let perkNum: number[] = [];
        //let purplePerks = {};
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
        if(newSurvivorPerks.length) {
            if(!(newSurvivorPerks.length >= perkLimit)) perkLimit = newSurvivorPerks.length;
            perkNum = shuffle(newSurvivorPerks.length, perkLimit) as number[];

            sortedPerkList = currentSurvivorPerks.sort(compare);
            //greenPerks = currentSurvivorPerks.filter(perk => perk.color === "GREEN").sort(compare);
            //sortedPerkList = purplePerks.concat(greenPerks);

            for(let index = 0; index < sortedPerkList.length; index += 15){
                chunkArray.push(sortedPerkList.slice(index, index + 15));
            }
    
            perkNum.forEach(n => {
                chunkArray.forEach((chunk, index) => {
                    const mapPerk = chunk.map(perkObject => perkObject.name);
                    if(mapPerk.includes(newSurvivorPerks[n].name)) return pages.push(index + 1)
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

        const replaceTextWithEmoji = (array: string[]) => array.map(t => 
                   t.startsWith("RED")    ? t.replace("RED", "🟥")
                 : t.startsWith("PURPLE") ? t.replace("PURPLE", "🟪")
                 : t.startsWith("GREEN")  ? t.replace("GREEN", "🟩")
                 : t.startsWith("YELLOW") ? t.replace("YELLOW", "🟨")
                 : t.replace("BROWN", "🟫"));

        let survivorItemBorder = "";

        if(ranItem){
            const survivorItemTitle   = `${Array(15).fill("-").join("")}🔦 Item${Array(23).fill("-").join("")}`;
            const replacedItem = replaceTextWithEmoji([ranItem]);
            const itemText = replacedItem.map(i => `${i} ${Array(fillerBorder.length - (i.length + 2)).fill('\xa0').join("")}`)

            survivorItemBorder = `\`${survivorItemTitle}\`\n\`${itemText.join("")}\`\n`;
        }
        let survivorAddonsBorder = "";

        if(useRandomItemAddons && addonLimit !== 0 && ranItem && ranAddons.length){

            const survivorAddonsTitle = `${Array(15).fill("-").join("")}⚙️ Itemaddons${Array(17).fill("-").join("")}`;
            const replacedAddons = replaceTextWithEmoji(ranAddons);
            const addonText = replacedAddons.map(a => `${a} ${Array((fillerBorder.length - (a.length + 2))).fill('\xa0').join("")}`)
            survivorAddonsBorder = `\`${survivorAddonsTitle}\`\n\`${addonText.join("\`\n\`")}\`\n`
        }

        let survivorPerksBorder = "";

        if(perkLimit !== 0 && perkNum.length &&newSurvivorPerks.length){
            const survivorPerksTitle = `${Array(15).fill("-").join("")}📜 Survivorperks${Array(14).fill("-").join("")}`;
            let survivorPerks: {name: string; text: string; page: number}[] = [];
            perkNum.forEach((n, i) => {
                const survivorPerk = newSurvivorPerks[n].name;
                const perkColor = newSurvivorPerks[n].color === "PURPLE" ? `🟪` : `🟪`;
                const addedLength = `${perkColor} ${survivorPerk} ${Array((fillerBorder.length - (`${perkColor} `.length + `${survivorPerk} `.length + `| Page ${pages[i]}`.length + 2))).fill('\xa0').join("")}| Page ${pages[i]} `;
                const constructor = {
                    name: survivorPerk,
                    text: addedLength,
                    page: pages[i]
                }
                return survivorPerks.push(constructor)
            })
            const sortedPerks = survivorPerks.sort(compare);
            survivorPerksBorder = `\`${survivorPerksTitle}\`\n\`${sortedPerks.map(perk => perk.text).join("\`\n\`")}\`\n`
        }

        let mapOfferingBorder = "";

        if(ranOffer){

            const mapOfferingTitle = `${Array(15).fill("-").join("")}🗺️ Mapoffering${Array(16).fill("-").join("")}`;
            const addedLengthRanOffer = `🟩 ${ranOffer} ${Array((fillerBorder.length - (`🟩 ${ranOffer}`.length + 2))).fill('\xa0').join("")}`;

            mapOfferingBorder = `\`${mapOfferingTitle}\`\n\`${addedLengthRanOffer}\`\n`;
        }

        const description = `${survivorItemBorder}${survivorAddonsBorder}${mapOfferingBorder}${survivorPerksBorder}` || "You selected nothing for some reason.";

        const survivorEmbed = new MessageEmbed()
            .setDescription(description)
            .setColor("GREEN")
            .setTimestamp()

        let files = [];

        if(ranSurvivor){
            const survivorTitle = `\`Randomised Survivor: 🔧 ${ranSurvivor} 🔧\``;
            
            survivorEmbed
                .setTitle(survivorTitle)
                .setThumbnail(`attachment://${ranSurvivor.replace(/\s+/g, '')}.png`)

            files.push(`./media/dbd/survivorimg/${ranSurvivor.replace(/\s+/g, '')}.png`);
        }

        //Sending
        await message.author.send({embeds: [survivorEmbed], files}).catch(error => {
            message.reply({content: `I could not DM you. Please check your privacy settings!`});
            console.log(error)
        }); 

            
    }
}