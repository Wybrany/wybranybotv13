import { Guild, TextChannel, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { CAH_Settings, AvailablePack, AvailablePacks } from "../types/cah.interface";
import Modified_Client from "../client/Client";
import { savefiledata } from "./backup";
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
        this.selectedPacks = guild.cahsettings?.packs ?? [];
        this.winstate = guild.cahsettings?.wincondition ?? 10;
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
        this.guild.cahsettings = {
            guildId: this.guild.id, 
            packs: this.selectedPacks, 
            wincondition: this.winstate
        };
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

const generate_embeds = (state: embed_state, packs: AvailablePack[], selectedPacks: AvailablePack[], winstate: number, currentpage: number, guild: Guild): EmbedBuilder => {
    const embed = new EmbedBuilder();
    switch(state){
        case 'MENU':
            embed
                .setTitle(`Current Settings for CAH`)
                .setColor(`Blue`)
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
            selectedPacks.length && selectedPacks.map(p => p.id).includes(packs[currentpage].id) ? embed.setColor(`Green`) : embed.setColor(`Red`);
        break;

        case 'WINSTATE':
            embed
                .setTitle(`Current wincondition for CAH`)
                .setColor(`Blue`)
                .setTimestamp()
                .setDescription(`
                    To win you need to accumulate: ${winstate}p

                    Use the buttons below to change this.
                `)
        break;

        case 'SAVE':
            embed
                .setTitle(`Saved`)
                .setColor(`Green`)
                .setTimestamp()
                .setDescription(`
                    You have successfully saved your settings. You can either start playing the game with these settings or change them later.
                `)
        break;

        case 'CLOSE':
            embed
                .setTitle(`Cancelled`)
                .setColor(`Red`)
                .setTimestamp()
                .setDescription(`
                    You have cancelled any new changes. Your previous settings will remain.
                `)
        break;
    }
    return embed;
}

const generate_components = (state: embed_state, packs: AvailablePack[], selectedPacks: AvailablePack[], winstate: number, currentpage: number, guild: Guild): ActionRowBuilder<ButtonBuilder> => {
    const actionRow = new ActionRowBuilder<ButtonBuilder>();

    switch(state){
        case 'MENU':
            const save = new ButtonBuilder().setCustomId(`buttonSaveSettings-${guild.id}`).setLabel(`Save`).setStyle(ButtonStyle.Success).setEmoji("✅");
            const close = new ButtonBuilder().setCustomId(`buttonCloseSettings-${guild.id}`).setLabel(`Close`).setStyle(ButtonStyle.Danger).setEmoji("❌");
            const pack = new ButtonBuilder().setCustomId(`buttonChoosePacksSettings-${guild.id}`).setLabel(`Choose Packs`).setStyle(ButtonStyle.Primary);
            const winstate = new ButtonBuilder().setCustomId(`buttonChooseWinStateSettings-${guild.id}`).setLabel(`Choose Wincondition`).setStyle(ButtonStyle.Primary);
            actionRow.addComponents(pack, winstate, save, close);
        break;

        case 'PACKS':
            const select = new ButtonBuilder().setCustomId(`buttonChoosePack-${guild.id}`).setLabel(`Select`).setStyle(ButtonStyle.Success).setEmoji("✅");
            const backpack = new ButtonBuilder().setCustomId(`buttonSavePack-${guild.id}`).setLabel(`Back to menu`).setStyle(ButtonStyle.Primary).setEmoji(`↩️`);
            const prevpage = new ButtonBuilder().setCustomId(`buttonPrevPackPage-${guild.id}`).setLabel(`Prev page`).setStyle(ButtonStyle.Primary).setEmoji(`⬅️`);
            const nextpage = new ButtonBuilder().setCustomId(`buttonNextPackPage-${guild.id}`).setLabel(`Next page`).setStyle(ButtonStyle.Primary).setEmoji(`➡️`);

            if(selectedPacks.length && selectedPacks.map(p => p.id).includes(packs[currentpage]?.id)) 
                select.setLabel(`Unselect`).setStyle(ButtonStyle.Danger).setEmoji("❌");

            if(currentpage === 0) actionRow.addComponents(select, backpack, nextpage);
            else if(currentpage === (packs.length - 1)) actionRow.addComponents(select, backpack, prevpage);
            else actionRow.addComponents(select, backpack, prevpage, nextpage);
        break;

        case 'WINSTATE':
            const backwin = new ButtonBuilder().setCustomId(`buttonSaveWinState-${guild.id}`).setLabel(`Back to menu`).setStyle(ButtonStyle.Primary).setEmoji(`↩️`);
            const plusone = new ButtonBuilder().setCustomId(`buttonPlusOneWin-${guild.id}`).setLabel(`+1`).setStyle(ButtonStyle.Success);
            const minusone = new ButtonBuilder().setCustomId(`buttonMinusOneWin-${guild.id}`).setLabel(`-1`).setStyle(ButtonStyle.Danger);
            const plusfive = new ButtonBuilder().setCustomId(`buttonPlusFiveWin-${guild.id}`).setLabel(`+5`).setStyle(ButtonStyle.Success);
            const minusfive = new ButtonBuilder().setCustomId(`buttonMinusFiveWin-${guild.id}`).setLabel(`-5`).setStyle(ButtonStyle.Danger);
            actionRow.addComponents(backwin, minusfive, minusone, plusone, plusfive);
        break;
    }
    return actionRow;
}