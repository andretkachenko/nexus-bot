import { Guild, Message } from "discord.js";
import { Config } from "../config";
import { MongoConnector } from "../db/MongoConnector";
import { TextChannelMap } from "../entities/TextChannelMap";
import { BotCommand } from "../enums/BotCommand";

export class SettingsHandlers {
    private config: Config
    private mongoConnector: MongoConnector

    constructor(config: Config, mongoConnector: MongoConnector) {
        this.mongoConnector = mongoConnector
        this.config = config
    }

    public handlePreserveUpdate(message: Message) {
        if (!message.guild?.id) return
        if (message.content.indexOf(this.config.prefix + BotCommand.Preserve) >= 0 && this.canManageChannels(message)) {
            let moderateCmd = this.config.prefix + BotCommand.Preserve
            let args = message.content.substring(moderateCmd.length + 1).replace(/\s+/g, ' ').trim().split(' ')
            this.updatePreserveOption(message.guild.id, args)
        }
    }

    private async updatePreserveOption(guildId: string, args: string[]) {
        let textChannelMap: TextChannelMap = { guildId: guildId, voiceChannelId: args[0], textChannelId: '', preserve: args[1] == '1' }
        this.mongoConnector.textChannelRepository.setPreserveOption(textChannelMap)
    }

    private canManageChannels(message: Message): boolean {
        return message.member !== null && message.member.hasPermission("MANAGE_CHANNELS")
    }
}