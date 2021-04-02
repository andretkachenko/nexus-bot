import { DMChannel, 
    Message, 
    NewsChannel, 
    TextChannel 
} from "discord.js"
import { MongoConnector } from "../../db/MongoConnector"
import { Constants, Messages } from "../../descriptor"
import { BotCommand } from "../../enums"
import { Logger } from "../../Logger"
import { BaseHandler } from "./BaseHandler"

export class SkipUsersRoles extends BaseHandler {
    private mongoConnector: MongoConnector

    constructor(logger: Logger, mongoConnector: MongoConnector, prefix: string) {
        super(logger, prefix + BotCommand.Skip)
        this.mongoConnector = mongoConnector
    }

    protected process(message: Message) {
        let args = this.splitArguments(this.trimCommand(message))
        let skip = args[0] === Constants.Enable
        let users = message.mentions.users.keyArray()
        let roles = message.mentions.roles.keyArray()
        let guildId = message.guild?.id as string
        this.processMentionArray(this.mongoConnector, message.channel, guildId, skip, users, this.addUser, this.deleteUser)
        this.processMentionArray(this.mongoConnector, message.channel, guildId, skip, roles, this.addRole, this.deleteRole)
    }

    private processMentionArray(
        mongoConnector: MongoConnector,
        channel: TextChannel | DMChannel | NewsChannel,
        guildId: string,
        skip: boolean,
        ids: string[],
        add: ((guildId: string, entityId: string, mongoConnector: MongoConnector) => void),
        remove: ((guildId: string, entityId: string, mongoConnector: MongoConnector) => void)
    ) {
        for (let i = 0; i < ids.length; i++) {
            try {
                if (skip) add(guildId, ids[i], mongoConnector)
                else remove(guildId, ids[i], mongoConnector)
            } catch (e) {
                this.logger.logError(this.constructor.name, this.processMentionArray.name, e)
                channel.send(Messages.SkipError)
            }
        }
    }

    private addUser(guildId: string, userId: string, connector: MongoConnector) {
        connector.skippedUsers.insert({ guildId: guildId, userId: userId })
    }

    private deleteUser(guildId: string, userId: string, connector: MongoConnector) {
        connector.skippedUsers.delete({ guildId: guildId, userId: userId })
    }

    private addRole(guildId: string, roleId: string, connector: MongoConnector) {
        connector.skippedRoles.insert({ guildId: guildId, roleId: roleId })
    }

    private deleteRole(guildId: string, roleId: string, connector: MongoConnector) {
        connector.skippedRoles.delete({ guildId: guildId, roleId: roleId })
    }
}