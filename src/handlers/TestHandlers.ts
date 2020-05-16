import { Message, Client } from "discord.js";

export class TestHandlers {
    private client: Client
    private config: any

    constructor(client: Client, config: any) {
        this.client = client
        this.config = config
    }

    public handlePing(message: Message) {
        // => Prevent message from the bot
        if (this.client.user != undefined && message.author.id !== this.client.user.id) {
            // => Test command
            if (message.content === this.config.settings.prefix + 'ping') {
                message.reply(`${this.config.settings.nameBot} is ready and listening.`)
            }
        }
    }
}