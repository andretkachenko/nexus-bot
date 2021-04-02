import { Message } from "discord.js"
import { MongoConnector } from "../../db/MongoConnector"
import { Constants } from "../../descriptor"
import { TextChannelMap } from "../../entities"
import {
    BotCommand,
    Permission
} from "../../enums"
import { Logger } from "../../Logger"
import { BaseHandler } from "./BaseHandler"

export class Preserve extends BaseHandler {
    private mongoConnector: MongoConnector

    constructor(logger: Logger, mongoConnector: MongoConnector, prefix: string) {
        super(logger, prefix + BotCommand.Preserve)
        this.mongoConnector = mongoConnector
    }

    protected process(message: Message) {
        let args = this.splitArguments(this.trimCommand(message))
        let guildId = message.guild?.id as string
        let preserve = args[0] == Constants.Enable
        for (let i = 1; i < args.length; i++) {
            this.handlePreserveCall(guildId, preserve, args[i])
        }
    }

    protected handlePreserveCall(guildId: string, preserve: boolean, voiceChannelId: string) {
        let textChannelMap: TextChannelMap = {
            guildId: guildId,
            voiceChannelId: voiceChannelId,
            textChannelId: Constants.EmptyString,
            preserve: preserve
        }
        this.mongoConnector.textChannelRepository.setPreserveOption(textChannelMap)
    }

    protected hasPermissions(message: Message): boolean {
        return super.hasPermissions(message) ||
            (message.member !== null && message.member.hasPermission(Permission.MANAGE_CHANNELS))
    }
}