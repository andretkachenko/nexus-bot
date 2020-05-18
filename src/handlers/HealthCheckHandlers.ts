import { Message, Client } from "discord.js";

export class HealthCheckHandlers {
    private client: Client
    private config: any

    constructor(client: Client, config: any) {
        this.client = client
        this.config = config
    }

    public handleHealthCheck(message: Message) {
        // => Prevent message from the bot
        if (this.client.user != undefined && message.author.id !== this.client.user.id) {
            // => Test command
            if (message.content === this.config.settings.prefix + 'health') {
                message.reply(`${this.config.settings.nameBot} is ready and listening.`)
            }
        }
    }
}