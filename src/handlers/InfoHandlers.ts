import { Message, MessageEmbed } from "discord.js";
import { Config } from "../config";
import { BotCommand } from "../enums/BotCommand";

export class InfoHandlers {
    private config: Config

    constructor(config: Config) {
        this.config = config
    }

    public handleHelpCall(message: Message) {
        if (message.content === this.config.prefix + BotCommand.Help) {
            this.giveHelp(message)
            return
        }
    }

    private giveHelp(message: Message) {
        let embed = new MessageEmbed()
            .setColor("#0099ff")
            .setAuthor('Nexus Bot - link voice and text channels', this.config.img, 'https://github.com/andretkachenko/nexus-bot')
            .addField("**How to use**",
            `You don't need to set up anything - once you join a voice channel (excluding inactive channel), a new category with the linked text channel will be created.
            Each time user joins/leaves voice channel, he will get/lose rights to see the linked text channel.
            Feel free to rename/move categories and text channels as you wish - it will not affect bot.
            When the last user leaves the voice channel, messages in the linked text channel will be deleted (excluding pinned messages).`)
            .addField("**List of available commands**", `
            **${this.config.prefix}write** - repeat message that was written by the user. Can be used to add description of the channel, so that it is viewed as a system message. Requires user to have admin rights.
            **${this.config.prefix}ignore add {channelId}** - skip voice channel with the specified id when checking for linked text channel. Example: \`${this.config.prefix}ignore add 717824008636334130\`. Requires user to have admin rights.
            **${this.config.prefix}ignore delete {channelId}** - remove voice channel with the specified id from ignore list. Example: \`${this.config.prefix}ignore delete 717824008636334130\`. Requires user to have admin rights.
            `)
            .addField("**Want to use it on your server?**", "Follow this link: https://github.com/andretkachenko/nexus-bot#want-to-use-at-your-server")
            .addField("**Any issues or missing feature?**", "You can suggest it via https://github.com/andretkachenko/nexus-bot/issues")
        message.channel.send(embed)
    }
}