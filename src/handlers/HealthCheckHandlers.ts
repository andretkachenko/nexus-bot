import { Message, Client } from "discord.js";
import { Config } from "../config";

export class HealthCheckHandlers {
    private client: Client
    private config: Config

    constructor(client: Client, config: Config) {
        this.client = client
        this.config = config
    }

    public handleHealthCheck(message: Message) {
        // => Prevent message from the bot
        if (this.client.user != undefined && message.author !== null && message.author.id !== this.client.user.id) {
            // => Test command
            if (message.content === this.config.prefix + 'health') {
                message.reply(`I am ready to serve, sir.`)
            }
        }
    }
}