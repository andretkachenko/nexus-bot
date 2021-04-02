import { DMChannel,
	Message,
	NewsChannel,
	TextChannel
} from 'discord.js'
import { MongoConnector } from '../../db/MongoConnector'
import { Constants, Messages } from '../../descriptor'
import { BotCommand } from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './BaseHandler'

export class SkipUsersRoles extends BaseHandler {
	private mongoConnector: MongoConnector

	constructor(logger: Logger, mongoConnector: MongoConnector, prefix: string) {
		super(logger, prefix + BotCommand.skip)
		this.mongoConnector = mongoConnector
	}

	protected process(message: Message): void {
		const args = this.splitArguments(this.trimCommand(message))
		const skip = args[0] === Constants.enable
		const users = message.mentions.users.keyArray()
		const roles = message.mentions.roles.keyArray()
		const guildId = message.guild?.id as string
		this.processMentionArray(this.mongoConnector, message.channel, guildId, skip, users, this.addUser, this.deleteUser)
		this.processMentionArray(this.mongoConnector, message.channel, guildId, skip, roles, this.addRole, this.deleteRole)
	}

	private processMentionArray(
		mongoConnector: MongoConnector,
		channel: TextChannel | DMChannel | NewsChannel,
		guildId: string,
		skip: boolean,
		ids: string[],
		add: ((connector: MongoConnector, logger: Logger, guildId: string, userId: string) => void),
		remove: ((connector: MongoConnector, logger: Logger, guildId: string, userId: string) => void)
	) {
		for (const id of ids) {
			try {
				if (skip) add(mongoConnector, this.logger, guildId, id)
				else remove(mongoConnector, this.logger, guildId, id)
			} catch (e) {
				this.logger.logError(this.constructor.name, this.processMentionArray.name, e)
				channel.send(Messages.skipError)
					.catch(reason => this.logger.logError(this.constructor.name, this.processMentionArray.name, reason))
			}
		}
	}

	addUser = (connector: MongoConnector, logger: Logger, guildId: string, userId: string): void => {
		connector.skippedUsers.insert({ guildId, userId })
			.catch(reason => logger.logError(this.constructor.name, this.addUser.name, reason))
	}

	deleteUser = (connector: MongoConnector, logger: Logger, guildId: string, userId: string): void => {
		connector.skippedUsers.delete({ guildId, userId })
			.catch(reason => logger.logError(this.constructor.name, this.deleteUser.name, reason))
	}

	addRole = (connector: MongoConnector, logger: Logger, guildId: string, roleId: string): void => {
		connector.skippedRoles.insert({ guildId, roleId })
			.catch(reason => logger.logError(this.constructor.name, this.addRole.name, reason))
	}

	deleteRole = (connector: MongoConnector, logger: Logger, guildId: string, roleId: string): void => {
		connector.skippedRoles.delete({ guildId, roleId })
			.catch(reason => logger.logError(this.constructor.name, this.deleteRole.name, reason))
	}
}