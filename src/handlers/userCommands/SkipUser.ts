import { Message } from "discord.js"
import { MongoConnector } from "../../db/MongoConnector"
import { SkippedUser } from "../../entities"
import { BotCommand } from "../../enums"
import { BaseHandler } from "./BaseHandler"

export class SkipUser extends BaseHandler {
    private mongoConnector: MongoConnector

    constructor(mongoConnector: MongoConnector, prefix: string) {
        super(prefix + BotCommand.Skip)
        this.mongoConnector = mongoConnector
    }

    protected process(message: Message) {
        let args = this.splitArguments(this.trimCommand(message))
        let userId = args[0]
        let ignore = args[1]
        let guildId = message.guild?.id as string  
        try {
            if(ignore === '1') this.addSkip(guildId, userId)
            else this.deleteSkip(guildId, userId)
        } catch (e) {
            console.log(`[ERROR] ${this.constructor.name}.process() - ` + e)
            message.channel.send(`Error ${ignore ? "adding" : "deleting"} Bypass User`)
        }
    }

    private addSkip(guildId: string, userId: string) {
        let bypassUser: SkippedUser = {
            guildId: guildId,
            userId: userId
        }
        this.mongoConnector.skippedUsers.insert(bypassUser)

    }

    private deleteSkip(guildId: string, userId: string) {        
        this.mongoConnector.skippedUsers.delete(guildId, userId)
    }
}