import { Message, MessageEmbed } from "discord.js";
import { Config } from "../config";
import { BotCommand } from "../enums/BotCommand";

export class TextHandlers {
    private config: Config

    constructor(config: Config) {
        this.config = config
    }

    public handleWriteCall(message: Message) {
        let writeCmd = this.config.prefix + BotCommand.Write
        if (message.content.includes(writeCmd)) {      
            message.channel.send(message.content.substring(writeCmd.length), message.attachments.array())
            return
        }
    }
}