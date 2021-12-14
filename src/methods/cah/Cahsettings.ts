import { Guild, TextChannel, Message, MessageEmbed, MessageActionRow, MessageButton } from "discord.js";
import { CAH_Settings, AvailablePack, AvailablePacks } from "../../interfaces/cah.interface";
import Modified_Client from "../../client/Client";
import { savefiledata } from "../../methods/backup";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

export type embed_state = "MENU" | "PACKS" | "WINSTATE" | "SAVE" | "CLOSE";

export class CAH_SETTINGS implements CAH_Settings {
    public client: Modified_Client;
    public guild: Guild;
    public channel: TextChannel;

    public packs: AvailablePack[];
    public embed: Message | null;

    public currentPage: number;
    public selectedPacks: AvailablePack[];
    public winstate: number;

    constructor(client: Modified_Client, guild: Guild, channel: TextChannel){
        this.client = client;
        this.guild = guild;
        this.channel = channel;

        this.packs = [];
        this.embed = null;

        this.currentPage = 0;
        this.selectedPacks = client.cahsettings.get(this.guild.id)?.packs ?? [];
        this.winstate = client.cahsettings.get(this.guild.id)?.wincondition ?? 10;
    }

    async create_embed() {
        try{
            this.load_packs();
            const embed = generate_embeds("MENU", this.packs, this.selectedPacks, this.winstate, this.currentPage, this.guild);
            const comp = generate_components("MENU", this.packs, this.selectedPacks, this.winstate, this.currentPage, this.guild);
            const message = await this.channel.send({embeds: [embed], components: [comp]});
            if(message) this.embed = message;
        }catch(err){
            console.error(err);
            this.client.cah_settings_embed.delete(this.guild.id);
            return;
        }
    }

    load_packs(){
        const dir = join(process.cwd(), "media/cards_against_humanity/official/packs.json");
        if(!existsSync(dir)) throw new Error(`Can't find ${dir}`);
        const packs = JSON.parse(readFileSync(dir, "utf-8")) as AvailablePacks;
        if(packs && packs?.packs) this.packs = packs.packs;
        else throw Error(`Can't load packs from ${dir}`);
    }

    next_page(){
        if((this.currentPage + 1) > this.packs.length) return;
        else this.currentPage += 1;
        this.update_embed("PACKS");
    }
    prev_page(){
        if((this.currentPage - 1) <= 0) this.currentPage = 0;
        else this.currentPage -= 1;
        this.update_embed("PACKS");
    }
    
    toggle_select_pack(){
        const pack = this.packs[this.currentPage];
        const selectedPacks = this.selectedPacks.map(p => p.id);
        if(selectedPacks.includes(pack.id)) this.selectedPacks.splice(selectedPacks.indexOf(pack.id), 1);
        else this.selectedPacks.push(pack);
        this.update_embed("PACKS");
    }
    update_win_state(state: "PLUS" | "MINUS", amount : 1 | 5){
        switch(state){
            case 'PLUS':
                this.winstate += amount;
            break;
            case 'MINUS':
                if(this.winstate - amount <= 0) this.winstate = 0;
                else this.winstate -= amount; 
            break;
        }
        this.update_embed("WINSTATE");
    }

    save(){
        this.client.cahsettings.set(this.guild.id, {
            guildId: this.guild.id, 
            packs: this.selectedPacks, 
            wincondition: this.winstate
        });
        savefiledata(this.client, this.guild.id);
        this.update_embed("SAVE");
        this.client.cah_settings_embed.delete(this.guild.id);
    }
    cancel(){
        this.update_embed("CLOSE");
        this.client.cah_settings_embed.delete(this.guild.id);
    }

    async update_embed(state: embed_state) {
        try{
            const embed = generate_embeds(state, this.packs, this.selectedPacks, this.winstate, this.currentPage, this.guild);
            if(state === "SAVE" || state === "CLOSE") return await this.embed?.edit({ embeds: [embed], components: []});

            const comp = generate_components(state, this.packs, this.selectedPacks, this.winstate, this.currentPage, this.guild);
            await this.embed?.edit({ embeds: [embed], components: [comp]});
            return;
        }catch(err){
            console.error(err);
            this.client.cah_settings_embed.delete(this.guild.id);
        }
    }
}

const generate_embeds = (state: embed_state, packs: AvailablePack[], selectedPacks: AvailablePack[], winstate: number, currentpage: number, guild: Guild): MessageEmbed => {
    const embed = new MessageEmbed();
    switch(state){
        case 'MENU':
            embed
                .setTitle(`Current Settings for CAH`)
                .setColor(`BLUE`)
                .setTimestamp()
                .setDescription(`
                    These are your current settings:

                    Wincondition: ${winstate}p
                    Selected Packs: ${selectedPacks.length ? selectedPacks.map(p => p.name).join(", ") : `No packs selected.`}
                    Whitecards: ${selectedPacks.length ? selectedPacks.map(p => p.quantity.white).reduce((acc, red) => acc + red) : 0}
                    Blackcards: ${selectedPacks.length ? selectedPacks.map(p => p.quantity.black).reduce((acc, red) => acc + red) : 0}

                    Use the buttons below to navigate your settings.
                `)
        break;
            
        case 'PACKS':

            embed
                .setTitle(`Current pack`)
                .setTimestamp()
                .setDescription(`
                    Packname: ${packs[currentpage].name}
                    Whitecards: ${packs[currentpage].quantity.white}
                    Blackcards: ${packs[currentpage].quantity.black}

                    Use the buttons below to navigate or select packs.
                `)
            selectedPacks.length && selectedPacks.map(p => p.id).includes(packs[currentpage].id) ? embed.setColor(`GREEN`) : embed.setColor(`RED`);
        break;

        case 'WINSTATE':
            embed
                .setTitle(`Current wincondition for CAH`)
                .setColor(`BLUE`)
                .setTimestamp()
                .setDescription(`
                    To win you need to accumulate: ${winstate}p

                    Use the buttons below to change this.
                `)
        break;

        case 'SAVE':
            embed
                .setTitle(`Saved`)
                .setColor(`GREEN`)
                .setTimestamp()
                .setDescription(`
                    You have successfully saved your settings. You can either start playing the game with these settings or change them later.
                `)
        break;

        case 'CLOSE':
            embed
                .setTitle(`Cancelled`)
                .setColor(`RED`)
                .setTimestamp()
                .setDescription(`
                    You have cancelled any new changes. Your previous settings will remain.
                `)
        break;
    }
    return embed;
}

const generate_components = (state: embed_state, packs: AvailablePack[], selectedPacks: AvailablePack[], winstate: number, currentpage: number, guild: Guild): MessageActionRow => {
    const actionRow = new MessageActionRow();

    switch(state){
        case 'MENU':
            const save = new MessageButton().setCustomId(`buttonSaveSettings-${guild.id}`).setLabel(`Save`).setStyle(`SUCCESS`).setEmoji("✅");
            const close = new MessageButton().setCustomId(`buttonCloseSettings-${guild.id}`).setLabel(`Close`).setStyle(`DANGER`).setEmoji("❌");
            const pack = new MessageButton().setCustomId(`buttonChoosePacksSettings-${guild.id}`).setLabel(`Choose Packs`).setStyle(`PRIMARY`);
            const winstate = new MessageButton().setCustomId(`buttonChooseWinStateSettings-${guild.id}`).setLabel(`Choose Wincondition`).setStyle(`PRIMARY`);
            actionRow.addComponents(pack, winstate, save, close);
        break;

        case 'PACKS':
            const select = new MessageButton().setCustomId(`buttonChoosePack-${guild.id}`).setLabel(`Select`).setStyle("SUCCESS").setEmoji("✅");
            const backpack = new MessageButton().setCustomId(`buttonSavePack-${guild.id}`).setLabel(`Back to menu`).setStyle(`PRIMARY`).setEmoji(`↩️`);
            const prevpage = new MessageButton().setCustomId(`buttonPrevPackPage-${guild.id}`).setLabel(`Prev page`).setStyle(`PRIMARY`).setEmoji(`⬅️`);
            const nextpage = new MessageButton().setCustomId(`buttonNextPackPage-${guild.id}`).setLabel(`Next page`).setStyle(`PRIMARY`).setEmoji(`➡️`);

            if(selectedPacks.length && selectedPacks.map(p => p.id).includes(packs[currentpage]?.id)) 
                select.setLabel(`Unselect`).setStyle(`DANGER`).setEmoji("❌");

            if(currentpage === 0) actionRow.addComponents(select, backpack, nextpage);
            else if(currentpage === (packs.length - 1)) actionRow.addComponents(select, backpack, prevpage);
            else actionRow.addComponents(select, backpack, prevpage, nextpage);
        break;

        case 'WINSTATE':
            const backwin = new MessageButton().setCustomId(`buttonSaveWinState-${guild.id}`).setLabel(`Back to menu`).setStyle(`PRIMARY`).setEmoji(`↩️`);
            const plusone = new MessageButton().setCustomId(`buttonPlusOneWin-${guild.id}`).setLabel(`+1`).setStyle(`SUCCESS`);
            const minusone = new MessageButton().setCustomId(`buttonMinusOneWin-${guild.id}`).setLabel(`-1`).setStyle(`DANGER`);
            const plusfive = new MessageButton().setCustomId(`buttonPlusFiveWin-${guild.id}`).setLabel(`+5`).setStyle(`SUCCESS`);
            const minusfive = new MessageButton().setCustomId(`buttonMinusFiveWin-${guild.id}`).setLabel(`-5`).setStyle(`DANGER`);
            actionRow.addComponents(backwin, minusfive, minusone, plusone, plusfive);
        break;
    }
    return actionRow;
}