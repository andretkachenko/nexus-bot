import { Message, TextChannel, NewsChannel, DMChannel, Client } from "discord.js"
import { ChannelType } from "../enums/ChannelType"
import { Config } from "../config"
import { BotCommand } from "../enums/BotCommand"
import { MongoConnector } from "../db/MongoConnector"
import { IgnoredChannel } from "../entities/IgnoredChannel"

export class IgnoreHandler {
    private config: Config
    private client: Client
    private mongoConnector: MongoConnector

    constructor(client: Client, mongoConnector: MongoConnector, config: Config) {
        this.mongoConnector = mongoConnector
        this.client = client
        this.config = config
    }

    public handleAddIgnore(message: Message) {
        if (!message.author.bot) {
            if (message.content.includes(this.config.prefix + BotCommand.IgnoreAdd)) {
                this.addIgnore(message)
                return
            }
        }
    }

    public handleDeleteIgnore(message: Message) {
        if (!message.author.bot) {
            if (message.content.includes(this.config.prefix + BotCommand.IgnoreDelete)) {
                this.deleteIgnore(message)
                return
            }
        }
    }

    private addIgnore(message: Message) {
        let channelId = message.content.substring(this.config.prefix.length + BotCommand.IgnoreAdd.length).trim()
        try {
            let isValid = this.validateChannelId(message.channel, channelId, message.guild?.id)
            if (isValid) {
                let ignoredChannel: IgnoredChannel = { guildId: message.guild?.id as string, channelId: channelId }
                this.mongoConnector.ignoredChannels.add(ignoredChannel)
            }
        } catch (e) {
            console.log(e)
            message.channel.send("Error adding ignore channel")
        }
    }

    private deleteIgnore(message: Message) {
        let channelId = message.content.substring(this.config.prefix.length + BotCommand.IgnoreDelete.length).trim()
        try {
            let isValid = this.validateChannelId(message.channel, channelId, message.guild?.id)
            if (isValid) {
                this.mongoConnector.ignoredChannels.delete(message.guild?.id as string, channelId)
            }
        } catch (e) {
            console.log(e)
            message.channel.send("Error deleting ignore channel")
        }
    }

    private validateChannelId(textChannel: TextChannel | NewsChannel | DMChannel, channelId: string, guildId: string | undefined): boolean {
        let isValid = true
        let message = ''
        if (textChannel.type === ChannelType.dm) {
            message = "Direct messages are not supported."
            isValid = false
        }
        else if (guildId === undefined) {
            message = "Error processing command - unable to identify guild."
            isValid = false
        }
        if (isValid) {
            let guild = this.client.guilds.resolve((guildId as string).trim())
            if (guild === null || guild == undefined) {
                message = "Error processing command - unable to identify guild."
                isValid = false
            } else {
                let channel = guild.channels.resolve(channelId)
                if (channel?.type != ChannelType.voice) {
                    message = "Error processing command - specified channelId does not belong to a voice channel."
                    isValid = false
                }
            }
        }

        if (message !== '') textChannel.send(message)
        return isValid
    }
}