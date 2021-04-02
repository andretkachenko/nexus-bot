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
import { Logger } from "../../Logger"
import { Constants, Messages } from "../../descriptor"

export class IgnoreChannel extends BaseHandler {
    private client: Client
    private mongoConnector: MongoConnector

    constructor(logger: Logger, client: Client, mongoConnector: MongoConnector, prefix: string) {
        super(logger, prefix + BotCommand.Ignore)
        this.mongoConnector = mongoConnector
        this.client = client
    }

    protected process(message: Message) {
        let args = this.splitArguments(this.trimCommand(message))
        let ignore = args[0] === Constants.Enable
        let guildId = message.guild?.id as string
        for (let i = 1; i < args.length; i++) {
            this.handleChannelId(ignore, message, args[i], guildId)
        }
    }

    private handleChannelId(ignore: boolean, message: Message, channelId: string, guildId: string) {
        try {
            let isValid = this.validateChannelId(message.channel, channelId, guildId)
            if (!isValid) throw new Error(Messages.InvalidChannelId)

            if (ignore) this.addIgnore(guildId, channelId)
            else this.deleteIgnore(guildId, channelId)
        }
        catch (e) {
            this.logger.logError(this.constructor.name, this.handleChannelId.name, e, channelId)
            message.channel.send(Messages.ErrorProcessingChannelId + channelId)
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
        let message = Constants.EmptyString
        if (textChannel.type === ChannelType.dm) {
            message = Messages.DMNotSupported
            isValid = false
        }
        else if (guildId === undefined) {
            message = Messages.CommandProcessError + Messages.MissingGuild
            isValid = false
        }
        if (isValid) {
            let guild = this.client.guilds.resolve((guildId as string).trim())
            if (guild === null || guild == undefined) {
                message = Messages.CommandProcessError + Messages.MissingGuild
                isValid = false
            } else {
                let channel = guild.channels.resolve(channelId)
                if (channel?.type != ChannelType.voice) {
                    message = Messages.CommandProcessError + Messages.NotVoiceChannelId
                    isValid = false
                }
            }
        }

        if (message !== Constants.EmptyString) textChannel.send(message)
        return isValid
    }
}