import { Message } from "discord.js"
import { MongoConnector } from "../../db/MongoConnector"
import { TextChannelMap } from "../../entities"
import {
    BotCommand,
    Permission
} from "../../enums"
import { BaseHandler } from "./BaseHandler"

export class Preserve extends BaseHandler {
    private mongoConnector: MongoConnector

    constructor(mongoConnector: MongoConnector, prefix: string) {
        super(prefix + BotCommand.Preserve)
        this.mongoConnector = mongoConnector
    }

    protected process(message: Message) {
        let args = this.splitArguments(this.trimCommand(message))
        let guildId = message.guild?.id as string
        let textChannelMap: TextChannelMap = {
            guildId: guildId,
            voiceChannelId: args[1],
            textChannelId: '', 
            preserve: args[0] == '1'
        }
        this.mongoConnector.textChannelRepository.setPreserveOption(textChannelMap)
    }

    protected hasPermissions(message: Message): boolean {
        return super.hasPermissions(message) ||
            (message.member !== null && message.member.hasPermission(Permission.MANAGE_CHANNELS))
    }
}