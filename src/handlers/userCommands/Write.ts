import { Message } from "discord.js"
import { BotCommand } from "../../enums"
import { BaseHandler } from "./BaseHandler"

export class Write extends BaseHandler {
    constructor(prefix: string) {
        super(prefix + BotCommand.Write)
    }

    protected process(message: Message) {
        let msg = this.trimCommand(message)
        if(msg !== '') message.channel.send(msg, message.attachments.array())
        .catch(reason => { console.log(`[ERROR] ${this.constructor.name}.process() - ${reason}`)})
    }
}