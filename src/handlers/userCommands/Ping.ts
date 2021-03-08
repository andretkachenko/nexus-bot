import { Message } from "discord.js"
import { BotCommand } from "../../enums"
import { BaseHandler } from "./BaseHandler"

export class Ping extends BaseHandler {
    constructor(prefix: string) {
        super(prefix + BotCommand.Ping)
    }

    protected process(message: Message) {
        message.channel.send("alive and waiting for your commands")
    }
}