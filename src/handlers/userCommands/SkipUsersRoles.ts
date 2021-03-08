import { DMChannel, Message, NewsChannel, TextChannel } from "discord.js"
import { MongoConnector } from "../../db/MongoConnector"
import { BotCommand } from "../../enums"
import { BaseHandler } from "./BaseHandler"

export class SkipUsersRoles extends BaseHandler {
    private mongoConnector: MongoConnector

    constructor(mongoConnector: MongoConnector, prefix: string) {
        super(prefix + BotCommand.Skip)
        this.mongoConnector = mongoConnector
    }

    protected process(message: Message) {
        let args = this.splitArguments(this.trimCommand(message))
        let skip = args[0] === "1"
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
                console.log(`[ERROR] ${this.constructor.name}.process() - ` + e)
                channel.send(`Error occured during processing of one of the mentioned users/roles`)
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