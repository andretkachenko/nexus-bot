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
            .setTitle("Nexus Bot")
            .setDescription(`Discord bot to link text channel to each voice channel.`)
            .setColor("#0099ff")
            .setAuthor('Nexus', this.config.img, 'https://github.com/andretkachenko/nexus-bot')
            .setThumbnail(this.config.img)
            .addField("**How to use**",
            `You don't' need to set up anything - once you join a voice channel, a new category with the linked text channel will be created.
            Each time user joins/leaves voice channel, he will get/lose rights to see the linked text channel.
            Feel free to rename categories and text channels as you wish - it will not affect bot.
            When the last user leaves the voice channel, messages in the linked text channel will be deleted.  
            If you don't want specific messages to be deleted - you can pin them, and they will remain.`)
            .addField("**List of available commands**", `
            **${this.config.prefix}write** - repeat message that was written by the user. Can be used to add description of the channel, so that it is viewed as a system message. Requires user to have admin rights.
            **${this.config.prefix}ignore add {channelId}** - skip voice channel with the specified id when checking for linked text channel. Example: \`${this.config.prefix}ignore add 717824008636334130\`. Requires user to have admin rights.
            **${this.config.prefix}ignore delete {channelId}** - remove voice channel with the specified id from ignore list. Example: \`${this.config.prefix}ignore delete 717824008636334130\`. Requires user to have admin rights.
            `)
            .addField("**Want to use it on your server?**", "Follow this link: https://github.com/andretkachenko/nexus-bot#want-to-use-at-your-server")
            .addField("**Any issues or missing feature?**", "You can suggest it via https://github.com/andretkachenko/nexus-bot/issues")
            .setFooter(`Nexus bot`);
        message.channel.send(embed)
    }
}