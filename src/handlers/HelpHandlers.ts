import { Message, Client } from "discord.js";
import { Config } from "../config";
import { BotCommand } from "../enums/BotCommand";

export class HelpHandlers {
    private client: Client
    private config: Config

    constructor(client: Client, config: Config) {
        this.client = client
        this.config = config
    }

    public handleHelpCall(message: Message) {
        // => Prevent message from the bot
        if (this.client.user != undefined && message.author.id !== this.client.user.id) {
            // => Test command
            if (message.content === this.config.prefix + BotCommand.Help) {
                message.channel.send(`
                List of available commands:
                \`\`\`
                !health - check if bot is up and running
                !addintro - add info that should be shown in the linked text channel. write !help addintro to see details
                !changeintro - replace info that should be shown in the linked text channel with the new parameters. write !help changeintro to see details                
                \`\`\`
                `)
                return
            }
            if (message.content === this.config.prefix + BotCommand.Help + " " + BotCommand.AddIntro) {
                this.giveAddIntroHelp(message);
                return
            }
            if (message.content === this.config.prefix + BotCommand.Help + " " + BotCommand.ChangeIntro) {
                this.giveChangeIntroHelp(message);
                return
            }
        }
    }

    private giveAddIntroHelp(message: Message) {
        message.channel.send(`
                \`\`\`
                !addintro - add info that should be shown in the linked text channel.\n
                \n
                Available fields:\n
                ChannelName(required) - name of the voice channel for which this intro should be set\n
                Description(optional) - any message (greetings, description, etc)\n
                ImageUrl(optional) - link to the image/gif that should be sent after the mesage\n
                AdditionalUrl(optional) - link to the message that should be sent after the mesage\n
                \n                
                Usage example:\n
                !addintro { "ChannelName": "Default", "Description": "Welcome to the default channel of our server", "ImageUrl": "https://discord.com/assets/7edaed9d86e1b5dd9d4c98484372222b.svg", "AdditionalUrl": "https://discord.com/assets/d9b6a36b9077400c46cc64404100b59b.svg" }
                \`\`\`
                `)
    }

    private giveChangeIntroHelp(message: Message) {
        message.channel.send(`
                \`\`\`
                !changeintro - replace info that should be shown in the linked text channel with the new parameters.\n
                \n
                Available fields:\n
                ChannelName(required) - name of the voice channel for which this intro should be set\n
                Description(optional) - any message (greetings, description, etc)\n
                ImageUrl(optional) - link to the image/gif that should be sent after the mesage\n
                AdditionalUrl(optional) - link to the message that should be sent after the mesage\n
                \n                
                Usage example:\n
                !changeintro { "ChannelName": "Default", "Description": "Welcome to the default channel of our server", "ImageUrl": "https://discord.com/assets/7edaed9d86e1b5dd9d4c98484372222b.svg", "AdditionalUrl": "https://discord.com/assets/d9b6a36b9077400c46cc64404100b59b.svg" }
                \`\`\`
                `)        
    }
}