import {
    Message,
    TextChannel,
    NewsChannel,
    DMChannel,
    Client
} from "discord.js"
import {
    ChannelType,
    BotCommand
} from "../../enums"
import { MongoConnector } from "../../db/MongoConnector"
import { IgnoredChannel } from "../../entities"
import { BaseHandler } from "./BaseHandler"

export class IgnoreChannel extends BaseHandler {
    private client: Client
    private mongoConnector: MongoConnector

    constructor(client: Client, mongoConnector: MongoConnector, prefix: string) {
        super(prefix + BotCommand.Ignore)
        this.mongoConnector = mongoConnector
        this.client = client
    }

    protected process(message: Message) {
        let args = this.splitArguments(this.trimCommand(message))
        let ignore = args[0] === '1'
        let channelId = args[1]
        let guildId = message.guild?.id as string  
        try {
            let isValid = this.validateChannelId(message.channel, channelId, guildId)
            if (isValid) {                              
                if(ignore) this.addIgnore(guildId, channelId)
                else this.deleteIgnore(guildId, channelId)
            }
        } catch (e) {
            console.log(`[ERROR] ${this.constructor.name}.process() - ` + e)
            message.channel.send(`Error ${ignore ? "adding" : "deleting"} Ignore Channel`)
        }
    }

    private deleteIgnore(guildId: string, channelId: string) {
        this.mongoConnector.ignoredChannels.delete(guildId, channelId)        
    }

    private addIgnore(guildId: string, channelId: string) {
        let ignoredChannel: IgnoredChannel = {
            guildId: guildId,
            channelId: channelId
        }
        this.mongoConnector.ignoredChannels.insert(ignoredChannel)        
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