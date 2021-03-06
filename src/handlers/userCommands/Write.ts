import { Message } from "discord.js"
import { BotCommand } from "../../enums"
import { BaseHandler } from "./BaseHandler"

export class Write extends BaseHandler {
    constructor(prefix: string) {
        super(prefix + BotCommand.Write)
    }

    protected process(message: Message) {
        message.channel.send(this.trimCommand(message), message.attachments.array())
    }
}