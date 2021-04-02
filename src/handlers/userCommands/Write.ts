import { Message } from "discord.js"
import { Constants } from "../../descriptor"
import { BotCommand } from "../../enums"
import { Logger } from "../../Logger"
import { BaseHandler } from "./BaseHandler"

export class Write extends BaseHandler {
    constructor(logger: Logger, prefix: string) {
        super(logger, prefix + BotCommand.Write)
    }

    protected process(message: Message) {
        let msg = this.trimCommand(message)
        if(msg !== Constants.EmptyString) message.channel.send(msg, message.attachments.array())
        .catch(reason => this.logger.logError(this.constructor.name, this.process.name, reason))
    }
}