import { Message, MessageEmbed } from "discord.js"
import { Config } from "../../config"
import { BotCommand } from "../../enums"
import { BaseHandler } from "./BaseHandler"

export class Help extends BaseHandler {
    private img: string
    private prefix: string

    constructor(config: Config) {
        super(config.prefix + BotCommand.Help)
        this.img = config.img
        this.prefix = config.prefix
    }

    protected process(message: Message) {
        let embed = new MessageEmbed()
            .setColor("#0099ff")
            .setAuthor('Nexus Bot - link voice and text channels', this.img, 'https://github.com/andretkachenko/nexus-bot')
            .addField("**How to use**",
            `You don't need to set up anything - once you join a voice channel (excluding inactive channel), a new category with the linked text channel will be created.
            Each time user joins/leaves voice channel, he will get/lose rights to see the linked text channel.
            Feel free to rename/move categories and text channels as you wish - it will not affect bot.
            When the last user leaves the voice channel, messages in the linked text channel will be deleted (excluding pinned messages).`)
            .addField("**List of available commands**", `
            {} - 'replace with id', [] - choose one option
            **${this.prefix}write** - repeat message that was written by the user. Can be used to add description of the channel, so that it is viewed as a system message. Requires user to have admin rights.
            **${this.prefix}ignore {channelId} [0/1]** - ignore/handle voice channel with the specified id when checking for linked text channel. Example: \`${this.prefix}ignore 71782400863633ss4130 1\`. Requires user to have admin rights.
            **${this.prefix}skip {userId} [0/1]** - skip/change visibility settings for specific user. Example: \`${this.prefix}skip 709876107213537351 1\`. Requires user to have admin rights.
            **${this.prefix}preserve {channelId} [0/1]** - set linked text channel to save messages after the last user left the voice channel. \`channelId\` - id of the voice channel. Example: \`${this.prefix}preserve 717824008636334130 1\`. Requires user to have admin rights.
            `)
            .addField("**Want to use it on your server?**", "Follow this link: https://github.com/andretkachenko/nexus-bot#want-to-use-at-your-server")
            .addField("**Any issues or missing feature?**", "You can suggest it via https://github.com/andretkachenko/nexus-bot/issues")
        message.channel.send(embed)
    }

    protected hasPermissions(message: Message): boolean {
        return true
    }
}