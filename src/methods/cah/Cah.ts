import { CategoryChannel, Guild, GuildChannelCreateOptions, GuildMember, Interaction, Message, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, OverwriteResolvable, TextChannel } from "discord.js";
import { PlayerConstructor, Game, Deck, BlackCard, Gamestate, CurrentSettings, Pack, Selected_Cards, AvailablePack, Update_Embed, Player_Cards_State } from "../../interfaces/cah.interface";
import { readFileSync } from "fs";
import { join } from "path";
import { shuffle } from "../shuffle";
import Modified_Client from "../../client/Client";


export class CAHGame implements Game {

    public wincondition: number;
    public packs: AvailablePack[];
    public client: Modified_Client;
    public guild: Guild;
    public members: GuildMember[];

    public deck: Deck | null;
    public players: PlayerConstructor[];
    public selected_cards: Selected_Cards[];

    public currentcardzar: PlayerConstructor | null;
    public blackcard: BlackCard | null;
    public gamestate: Gamestate;
    public roundWon: PlayerConstructor | null;

    public roundTimeLimit: number;
    public timer: NodeJS.Timeout | null;

    constructor(client: Modified_Client, guild: Guild, members: GuildMember[], settings: CurrentSettings){

        //Settings
        this.wincondition = settings.wincondition;
        this.packs = settings.packs;
        this.client = client;
        this.guild = guild;
        this.members = members;

        this.deck = null;
        this.players = [];
        this.selected_cards = [];

        this.currentcardzar = null;
        this.blackcard = null;
        this.gamestate = "SETUP";
        this.roundWon = null;

        this.roundTimeLimit = 90000;
        this.timer = null;
    }

    async start(): Promise<boolean>{
        this.load_deck();
        if(!this.deck || !this.deck.deckblackcards.length || !this.deck.deckwhitecards.length) return false;
        for(const member of this.members){
            const player = await this.player_join(member);
            if(!player) continue;
            this.players.push(player);
        }
        if(this.members.length !== this.players.length) return false;
        //Select a random player and assign cardzhar
        this.currentcardzar = this.select_cardczar();
        this.select_blackcard();
        this.gamestate = "SELECT";
        //Update all players embeds with state SELECT and activate their buttons so we can start the game :).
        for(const player of this.players){
            await this.update_embed("SELECT", player);
        }
        console.log(this.players.map(p => p.previous_roles));
        return true;
    }

    async stop(command?: boolean){
        this.gamestate = "GAMEOVER";
        //Update the game with gameover texts.
        for(const player of this.players){
            try{
                const member = this.guild.members.cache.get(player.member.id);
                if(member && player.previous_roles.length) await member.roles.add(player.previous_roles);
                await player.channel.delete();
            }catch(err){
                console.error(err);
            }
        }
        if(command) return;
        //Should also create a txtfile that logs everything, send this as well when possible.
        const embed = new MessageEmbed()
            .setTitle(`Game over!`)
            .setDescription(`
                ${this.roundWon?.member.user.username} has won this round of CAH!

                Scoreboard:
                ${this.players.map(p => `${p.member.user.username} - ${p.points}p`).join("\n")}
            `)
            .setColor(`RANDOM`)
            .setTimestamp();
        try{
            const cahLobby = this.guild.channels.cache.find(c => c.name === "cah-lobby") as TextChannel | null;
            if(cahLobby) await cahLobby.send({embeds: [embed]});
            this.client.cahgame.delete(this.guild.id);   
        }catch(err){
            console.error(err)
        }
    }

    async create_channel(player: GuildMember, parent: CategoryChannel): Promise<TextChannel | null>{
        const permissions: OverwriteResolvable[] = [
            {
                id: this.guild.roles.everyone.id,
                deny: ['VIEW_CHANNEL']
            },
            {
                id: player.id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
            }
        ]

        const options: GuildChannelCreateOptions = {
            type: "GUILD_TEXT",
            parent: parent.id,
            permissionOverwrites: permissions,
            reason: `Created by bot for CAH-game`
        }

        try{
            return await this.guild.channels.create(`Player-${player.user.username}`, options) as TextChannel;
        }catch(err){
            console.error(err);
            return null;
        }

    }

    async create_embed(player: GuildMember, channel: TextChannel): Promise<Message | null>{
        const embed = new MessageEmbed()
            .setTitle(`Game-embed for ${player.user.username}`)
            .setDescription(`Please wait while the game is being created for other players...`)
            .setColor(`BLUE`)
            .setTimestamp();
        try{
            return await channel.send({embeds: [embed]});
        }catch(err){
            console.error(err)
            return null;
        }
    }

    load_deck(){
        const packs_path = join(process.cwd(), "media/cards_against_humanity/official/packs");
        const packs: Pack[] = [];
        for(const pack of this.packs){
            const pack_path = join(packs_path, `${pack.id}.json`);
            const file = JSON.parse(readFileSync(pack_path, "utf-8")) as Pack;
            packs.push(file);
        }
        this.deck = {
            packnames: packs.map(p => p.pack.name),
            deckblackcards: packs.map(p => p.black).flat(),
            deckwhitecards: packs.map(p => p.white).flat()
        }
    }

    give_cards(amount: number): string[] | null {
        console.log(this.deck?.deckwhitecards)
        if(!this.deck || !this.deck.deckwhitecards.length) return null;
        const randomIndex = shuffle(this.deck.deckwhitecards.length, amount);
        if(amount === 1) return this.deck.deckwhitecards.splice(randomIndex as number, 1);
        const indexAsArray = randomIndex as number[];
        const sortIndexArray = indexAsArray.sort((a,b) => b - a);
        const whiteCards: string[] = [];
        for(const index of sortIndexArray){
            const card = this.deck.deckwhitecards.splice(index, 1)[0];
            whiteCards.push(card);
        }
        console.log(this.deck.deckwhitecards);
        console.log(whiteCards);
        return whiteCards;
    }

    select_cardczar(){
        if(!this.currentcardzar) return this.currentcardzar = this.players[0];
        const indexOfCurrentCzar = this.players.map(p => p.member.id).indexOf(this.currentcardzar?.member.id);
        if(indexOfCurrentCzar === (this.players.length - 1)) return this.currentcardzar = this.players[0];
        return this.currentcardzar = this.players[indexOfCurrentCzar + 1];
    }

    select_blackcard(){
        if(!this.deck || !this.deck?.deckblackcards) return this.stop();
        const randomIndex = shuffle(this.deck.deckblackcards.length, 1) as number;
        this.blackcard = this.deck.deckblackcards.splice(randomIndex, 1)[0];
    }

    choose_winner(member: GuildMember){
        const player = this.players.find(p => p.member.id === member.id);
        if(player) {
            player.points++;
            this.roundWon = player;
            if(player.points >= this.wincondition) return this.stop()
        }
        if(!this.deck?.deckblackcards.length) return this.stop();
        for(const player of this.players){
            player.replacedcards = false;
            player.ready = false;
            this.replace_cards("REMOVE", player.selected_cards_indexes, player.member);
            player.selected_cards_indexes = [];
            player.selected_white_cards = [];
            player.player_cards_state = "SELECT";
            this.update_embed("ROUNDWON", player);
        }
        setTimeout(() => {
            this.gamestate = "SELECT";
            this.selected_cards = [];
            this.currentcardzar = this.select_cardczar();
            this.roundWon = null;
            this.select_blackcard();
            if(!this.blackcard) return this.stop();
            for(const player of this.players){
                this.update_embed("SELECT", player);
                if(!player.whiteCards.length || player.whiteCards.length < this.blackcard.pick) player.ready = true;
            }
        }, 6000)
    }

    check_if_all_selected(): boolean{
        const players_ready = this.players.filter(p => p.ready && p.member.id !== this.currentcardzar?.member.id);
        if(players_ready.length === this.selected_cards.length && players_ready.length === (this.players.length - 1)) return true;
        return false;
    }

    async player_join(member: GuildMember): Promise<PlayerConstructor | null>{
        const parent = this.guild.channels.cache.find(c => c.name === "CAH-game") as CategoryChannel | null;
        if(!parent) return null;
        const channel = await this.create_channel(member, parent);
        if(!channel) return null;
        const message = await this.create_embed(member, channel);
        if(!message) return null;
        let whiteCards = this.give_cards(10);
        if(!whiteCards) return null;
        const roles_with_administrator = [...member.roles.cache?.values()]?.filter(r => r.permissions.has("ADMINISTRATOR")) ?? [];
        if(roles_with_administrator.length) member.roles.remove(roles_with_administrator, `Removing for CAH.`);
        return { member, guild: this.guild, channel, message, previous_roles: roles_with_administrator, 
            player_cards_state: "SELECT", ready: false, selected_cards_indexes: [], selected_white_cards: [], points: 0, replacedcards: false, whiteCards }
    }

    async player_leave(member: GuildMember): Promise<boolean> {
        const player = this.players.find(p => p.member.id === member.id);
        if(!player) return false;
        this.players.splice(this.players.map(p => p.member.id).indexOf(player.member.id), 1);
        if(this.selected_cards.some(c => c.player.member.id === player.member.id)) this.selected_cards.splice(this.selected_cards.map(c => c.player.member.id).indexOf(player.member.id), 1);
        if(player.member.id === this.currentcardzar?.member.id){
            this.currentcardzar = this.select_cardczar();
            if(this.selected_cards.some(c => c.player.member.id === this.currentcardzar?.member.id)){
                this.selected_cards.splice(this.selected_cards.map(c => c.player.member.id).indexOf(player.member.id))
                const player_index = this.players.findIndex(p => p.member.id === this.currentcardzar?.member.id);
                if(player_index !== -1){
                    this.players[player_index].selected_cards_indexes = [];
                    this.players[player_index].selected_white_cards = [];
                    this.players[player_index].ready = false;
                }
            }
        }
        if(this.guild.channels.cache.has(player.channel.id)) {
            try{
                await player.channel.delete();
            }catch(err){
                console.error(err);
            }
        }
        if(this.check_if_all_selected()){
            for(const player of this.players){
                await this.update_embed("VOTE", player);
            }
            this.gamestate = "VOTE";
        }
        else {
            for(const player of this.players){
                await this.update_embed("SELECT", player);
            }
        }
        return true;
    }

    push_player_cards(member: GuildMember){
        const player = this.players.find(p => p.member.id === member.id);
        if(!player) return;
        const selected_index = this.selected_cards.findIndex(p => p.player.member.id === player.member.id);
        if(selected_index === -1) this.selected_cards.push({ player, cards: player.selected_white_cards });
        else this.selected_cards[selected_index] = { player, cards: player.selected_white_cards };
        console.log(this.selected_cards);
    }

    toggle_ready(member: GuildMember){
        const player = this.players.find(p => p.member.id === member.id);
        //When I toggle ready, I should push in the new cards in selected_cards 
        //Replace them if necessary.
        if(!player?.selected_cards_indexes.length || !player.selected_white_cards.length) return;

        this.push_player_cards(member);

        if(player && player.ready) player.ready = false;
        if(player && !player.ready) player.ready = true;

        if(this.check_if_all_selected()){
            for(const player of this.players){
                this.update_embed("VOTE", player);
            }
            this.gamestate = "VOTE";
        } 
        else {
            for(const player of this.players){
                this.update_embed("SELECT", player);
            }
        }
    }

    change_player_cards_state(member: GuildMember, state: Player_Cards_State, interaction: Interaction){
        const player_index = this.players.findIndex(p => p.member.id === member.id);
        if(player_index === -1 || !this.blackcard) return;

        if((this.players[player_index].selected_cards_indexes.length || this.players[player_index].selected_white_cards.length) && state === "SWAP"){
            if(this.blackcard.pick === 2 && state === "SWAP") return this.select_cards("SWAP", this.players[player_index].selected_cards_indexes, member, interaction);
            else if(this.blackcard.pick >= 3 && state === "SWAP") this.players[player_index].player_cards_state = state;
        }
        else if(state === "REMOVE" && !this.players[player_index].replacedcards) this.players[player_index].player_cards_state = state;
        else this.players[player_index].player_cards_state = state;

        this.update_embed("SELECT", this.players[player_index]);
    }
    
    replace_cards(state: Player_Cards_State, cards: number[], member: GuildMember, interaction?: Interaction) {
        const player_index = this.players.findIndex(p => p.member.id === member.id);
        if(player_index === -1) return;
        for(const card of cards){
            this.players[player_index].whiteCards.splice(card, 1);
        }
        const newCards = this.give_cards(10 - this.players[player_index].whiteCards.length);
        if(newCards) this.players[player_index].whiteCards.push(...newCards);
    }

    select_cards(state: Player_Cards_State, cards: number[], member: GuildMember, interaction?: Interaction) {
        const player_index = this.players.findIndex(p => p.member.id === member.id);
        if(player_index === -1) return console.log("NO PLAYER IN SELECT_CARDS_BEFORE");
        switch(state){
            case 'SELECT':
                if(cards.length !== this.blackcard?.pick) return;
                const whiteCards = this.players[player_index].whiteCards.filter((c, i) => cards.includes(i));
                this.players[player_index].selected_cards_indexes = cards;
                this.players[player_index].selected_white_cards = whiteCards;
                if(this.players[player_index].ready) this.push_player_cards(member);
            break;

            case 'REMOVE':
                if(this.players[player_index].replacedcards || this.players[player_index].ready) return;
                if(cards.some(c => this.players[player_index].selected_cards_indexes.includes(c))) return;
                this.players[player_index].replacedcards = true;
                this.players[player_index].player_cards_state = "SELECT";
                this.replace_cards("SELECT", cards, member, interaction);
            break;

            case 'SWAP':
                if(!this.players[player_index].selected_cards_indexes.length || !this.players[player_index].selected_white_cards.length || !this.blackcard) return;
                if(this.blackcard.pick >= 3){
                    const [ card1, card2 ] = cards;
                    const player_cselection = this.players[player_index].selected_white_cards;
                    [[player_cselection[card1], player_cselection[card2]] = [player_cselection[card2], player_cselection[card1]]];
                    this.players[player_index].selected_white_cards = player_cselection;
                } else if(this.blackcard.pick === 2) {
                    const player_cselection = this.players[player_index].selected_white_cards;
                    [[player_cselection[0], player_cselection[1]] = [player_cselection[1], player_cselection[0]]];
                    this.players[player_index].selected_white_cards = player_cselection;
                }
            break;
        }
        //Check if selection is over, otherwise update this embed.
        this.update_embed("SELECT", this.players[player_index]);
    }

    async update_embed(state: Update_Embed, player: PlayerConstructor){
        const embed = generate_embeds(state, player, this.players, this.blackcard as BlackCard, this.selected_cards, this.roundWon as PlayerConstructor, this.currentcardzar as PlayerConstructor);
        const select_menu = generate_select_menu(state, player, this.currentcardzar as PlayerConstructor, this.selected_cards as Selected_Cards[], this.blackcard as BlackCard);
        const buttons = generate_buttons(state, player, this.currentcardzar as PlayerConstructor, this.blackcard as BlackCard, this.deck as Deck);
        console.log(`Updating embed for ${player.member.user.username} to ${state}`)
        try{
            await player.message.edit({embeds: [embed], components: [select_menu, buttons]});
        }catch(err){
            console.error(err);
        }
    }
}

const generate_embeds = (state: Update_Embed, player: PlayerConstructor, players: PlayerConstructor[], blackcard: BlackCard, selected_cards: Selected_Cards[], roundWon: PlayerConstructor, czar: PlayerConstructor): MessageEmbed => {
    const embed = new MessageEmbed();
    switch(state){
        case 'SELECT':
            embed
                .setTitle(`Playingfield for ${player.member.user.username}`)
                .setColor(`RANDOM`)
                .setDescription(`

                    Cardzar: ${czar.member.user.username}

                    Current blackcard: 
                    Text: ${blackcard.content}
                    Pick: ${blackcard.pick}

                    Scoreboard:
                    ${players.map(p => `${p.member.user.username} - ${p.points}p - ${p.ready ? `✅` : `❌`}`).join("\n")}
                    ${player.member.id !== czar.member.id ? `
                    Your Whitecards:
                    ${player.whiteCards.map((card, i) => `${i+1}.) ${card}`).join("\n")}
                    ` : ``}
                    ${player.selected_white_cards.length ? `
                    You have selected:
                    ${player.selected_white_cards.map((c, i) => `${i+1}.) ${c}`).join("\n") ?? ""}
                    ` : `There are no whitecards remaining.`}
                `)
                .setFooter(`Time remaining: XXs`)
                .setTimestamp();
        break;

        case 'VOTE':
            embed
                .setTitle(`${czar.member.user.username} is now voting.`)
                .setColor(`BLUE`)
                .setDescription(`
                    Cardzar: ${czar.member.user.username}

                    Current blackcard: 
                    Text: ${blackcard.content}
                    Pick: ${blackcard.pick}

                    ${selected_cards.length ? 
                    `
                    Selected cards:
                    ${selected_cards.map((c, i) => `Selection #${i+1}\n ||${c.cards.join("||\n||")}||`).join("\n\n")}  
                    `
                        : `Something went wrong with getting your selected cards..`}
                `)
                .setFooter(`Time remaining: XXs`)
                .setTimestamp();
        break;

        case 'ROUNDWON':
            embed
                .setTitle(`A winner has been chosen!`)
                .setColor(`GREEN`)
                .setDescription(`
                    ${roundWon.member.user.username} has won this round with his cards.

                    Cards:
                    ${selected_cards.find(p => p.player.member.id === roundWon.member.id)?.cards.map((c, i) => `${i+1}.) ${c}`).join("\n") ?? `Failed to load cards...`}
                `)
                .setFooter(``)
                .setTimestamp();
        break;

        case 'PAUSE':
            embed
                .setTitle(`Game has been paused...`)
                .setColor(`RED`)
                .setDescription(`Please wait. Pause will be resumed shortly.`)
                .setTimestamp();
        break;

        case 'GAMEOVER':
            embed
                .setTitle(`GAME OVER!`)
                .setColor(`RED`)
                .setDescription(`
                    ${roundWon.member.user.username} has won this game!

                    Scoreboard:
                    ${players.map(p => `${p.member.user.username} - ${p.points}p`)}
                `)
                .setTimestamp();
        break;
    }
    return embed;
}

const generate_select_menu = (state: Update_Embed, player: PlayerConstructor, czar: PlayerConstructor, selected_cards: Selected_Cards[], blackCard: BlackCard): MessageActionRow => {
    const actionrow = new MessageActionRow();
    const select_menu = new MessageSelectMenu();
    switch(state){
        case 'SELECT':
            //Return a temporary disabled menu if the amount of cards left is less than the pick.
            //Normally this shouldn't happen at all, but just in case. 
            if(player.whiteCards.length < blackCard.pick) 
                return actionrow.addComponents(select_menu.setCustomId(`disabled-menu`).setPlaceholder(`Can't pick`).setDisabled(true).addOptions({label: `disabled`, value: `disabled`}));
            select_menu
                .setCustomId(`WhiteCardsSelect-${player.guild.id}`)
                .setPlaceholder(`${player.player_cards_state === `SELECT` ? `Select White Cards from your hand.` : player.player_cards_state === "REMOVE" ? `Remove White Cards from your hand.` : `Swap position with your selected cards.`}`)
                .setDisabled(false);
            if(player.player_cards_state === "SELECT") select_menu
                .addOptions(player.whiteCards.map((card, i) => ({
                    label: `${i+1}.) ${card?.substring(0, 90) ?? "Unkown"}`,
                    value: `${i}-${card?.substring(0, 90) ?? "Unkown"}`,
                    description: `${card?.substring(0, 99) ?? "Unkown"}`
                })))
                .setMinValues(blackCard.pick)
                .setMaxValues(blackCard.pick)
            if(player.player_cards_state === "REMOVE") select_menu
                .setMinValues(1)
                .setMaxValues(player.whiteCards.length)
                .addOptions(player.whiteCards.map((card, i) => ({
                    label: `${i+1}.) ${card?.substring(0, 90) ?? "Unkown"}`,
                    value: `${i}-${card?.substring(0, 90) ?? "Unkown"}`,
                    description: `${card?.substring(0, 99) ?? "Unkown"}`
                })));
            if(player.player_cards_state === "SWAP") {
                if(player.selected_white_cards.length && blackCard.pick >= 2)
                    select_menu
                        .setCustomId(`WhiteCardsSwap-${player.guild.id}`)
                        .addOptions(player.selected_white_cards.map((c, i) => ({
                            label: `${i+1}.) ${c?.substring(0, 90) ?? "Unkown"}`,
                            value: `${i}-${c?.substring(0, 90) ?? "Unkown"}`,
                            description: `${c?.substring(0, 99) ?? "Unkown"}`
                        })))
                        .setMinValues(2)
                        .setMaxValues(2);
            }
            if(player.member.id === czar.member.id) return actionrow.addComponents(select_menu.setDisabled(true).setPlaceholder(`You are cardzar.`));
        break;

        case 'VOTE':
            select_menu
                .setCustomId(`WhiteCardsVote-${player.guild.id}`)
                .setPlaceholder(`Vote for the best whitecards.`)
                .addOptions(selected_cards.map((p, i) => ({
                    label: `Vote for Set #${i+1}`,
                    value: p.player.member.id,
                    //description: `${p.cards.map(card => `${card}\n`)}`
                })))
            
            if(player.member.id !== czar.member.id)
                return actionrow.addComponents(select_menu.setDisabled(true).setPlaceholder(`Only available for czar.`));
        break;

        case 'ROUNDWON':
            select_menu
                .setCustomId(`roundWon-${player.guild.id}`)
                .setPlaceholder(`A player has won this round.`)
                .addOptions({label: `Placeholder value`, value: `Placeholder value`})
                .setDisabled(true)
        break;

        case 'PAUSE':
            select_menu
                .setCustomId(`roundWon-${player.guild.id}`)
                .setPlaceholder(`Game has been paused.`)
                .addOptions({label: `Placeholder value`, value: `Placeholder value`})
                .setDisabled(true)
        break;

        case 'GAMEOVER':
            select_menu
                .setCustomId(`roundWon-${player.guild.id}`)
                .setPlaceholder(`GAME OVER!`)
                .addOptions({label: `Placeholder value`, value: `Placeholder value`})
                .setDisabled(true)
        break;
    }
    return actionrow.addComponents(select_menu);
}

const generate_buttons = (state: Update_Embed, player: PlayerConstructor, czar: PlayerConstructor, blackcard: BlackCard, deck: Deck): MessageActionRow => {
    const actionrow = new MessageActionRow();
    const buttonSelect = new MessageButton()
        .setCustomId(`buttonCAHSelect-${player.guild.id}`)
        .setLabel(`Select Cards`)
        .setEmoji(`✅`)
        .setStyle(`SUCCESS`);

    const buttonRemove = new MessageButton()
        .setCustomId(`buttonCAHRemove-${player.guild.id}`)
        .setLabel(`Remove Cards`)
        .setEmoji(`❌`)
        .setStyle(`DANGER`);
    
    const buttonSwap = new MessageButton()
        .setCustomId(`buttonCAHSwap-${player.guild.id}`)
        .setLabel(`Swap order`)
        .setEmoji(`🔄`)
        .setStyle(`SUCCESS`);
        
    const buttonReady = new MessageButton()
        .setCustomId(`buttonCAHReady-${player.guild.id}`)
        .setLabel(`Not Ready`)
        .setEmoji(`❌`)
        .setStyle(`DANGER`)

    if(player.player_cards_state === "SELECT") {
        buttonSelect.setStyle(`SUCCESS`);
        buttonRemove.setStyle(`DANGER`);
        if(blackcard.pick <= 2) buttonSwap.setStyle(`PRIMARY`);
        else buttonSwap.setStyle(`DANGER`);
    }

    if(player.player_cards_state === "REMOVE"){
        buttonSelect.setStyle(`DANGER`);
        buttonRemove.setStyle(`SUCCESS`);
        if(blackcard.pick <= 2) buttonSwap.setStyle(`PRIMARY`);
        else buttonSwap.setStyle(`DANGER`);
    }

    if(player.player_cards_state === "SWAP"){
        buttonSelect.setStyle(`DANGER`);
        buttonRemove.setStyle(`DANGER`);
        buttonSwap.setStyle(`SUCCESS`);
    }
    
    if(player.replacedcards || !deck.deckwhitecards.length)
        buttonRemove.setDisabled(true);
    
    if(blackcard.pick === 1 || !player.selected_cards_indexes.length || !player.selected_white_cards.length)
        buttonSwap.setDisabled(true);
    
    if(player.ready)
        buttonReady
            .setLabel(`Ready`)
            .setEmoji(`✅`)
            .setStyle(`SUCCESS`)

    if(player.member.id === czar.member.id) {
        buttonSelect.setDisabled(true);
        buttonRemove.setDisabled(true);
        buttonSwap.setDisabled(true);
        buttonReady.setDisabled(true);
        return actionrow.addComponents(buttonReady, buttonSelect, buttonRemove, buttonSwap)
    }

    switch(state){
        case 'VOTE':
        case 'ROUNDWON':
        case 'PAUSE':
        case 'GAMEOVER':
            buttonSelect.setDisabled(true);
            buttonRemove.setDisabled(true);
            buttonSwap.setDisabled(true);
            buttonReady.setDisabled(true);
        break;
    }

    console.log(buttonSelect.style, buttonRemove.style)
    return actionrow.addComponents(buttonReady, buttonSelect, buttonRemove, buttonSwap)
}