import { Message,
	MessageEmbed,
	TextBasedChannels,
} from 'discord.js'
import { Config } from '../../Config'
import { MongoConnector } from '../../db/MongoConnector'
import { Constants,
	Messages
} from '../../descriptor'
import { BotCommand } from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './BaseHandler'

export class SkipUsersRoles extends BaseHandler {
	private mongoConnector: MongoConnector

	constructor(logger: Logger, mongoConnector: MongoConnector, config: Config) {
		super(logger, config, BotCommand.skip)
		this.mongoConnector = mongoConnector
	}

	protected process(message: Message): void {
		const args = this.splitArguments(this.trimCommand(message))
		const skip = args[0] === Constants.enable
		const users = message.mentions.users.map((_value, key) => key)
		const roles = message.mentions.roles.map((_value, key) => key)
		const guildId = message.guild?.id as string
		this.processMentionArray(this.mongoConnector, message.channel, guildId, skip, users, this.addUser, this.deleteUser)
		this.processMentionArray(this.mongoConnector, message.channel, guildId, skip, roles, this.addRole, this.deleteRole)
	}

	private processMentionArray(
		mongoConnector: MongoConnector,
		channel: TextBasedChannels,
		guildId: string,
		skip: boolean,
		ids: string[],
		add: ((connector: MongoConnector, logger: Logger, guildId: string, userId: string) => Promise<void>),
		remove: ((connector: MongoConnector, logger: Logger, guildId: string, userId: string) => Promise<void>)
	) {
		for (const id of ids) {
			this.tryProcess(skip ? add : remove, mongoConnector, guildId, id, channel)
		}
	}

	addUser = async (connector: MongoConnector, logger: Logger, guildId: string, userId: string): Promise<void> => {
		const alreadyExist = await connector.skippedUsers.exists(guildId, userId)
		if(alreadyExist) return
		connector.skippedUsers.insert({ guildId, userId })
			.catch(reason => logger.logError(this.constructor.name, this.addUser.name, reason))
	}

	deleteUser = async (connector: MongoConnector, logger: Logger, guildId: string, userId: string): Promise<void> => {
		const exists = await connector.skippedUsers.exists(guildId, userId)
		if(!exists) return
		connector.skippedUsers.delete({ guildId, userId })
			.catch(reason => logger.logError(this.constructor.name, this.deleteUser.name, reason))
	}

	addRole = async (connector: MongoConnector, logger: Logger, guildId: string, roleId: string): Promise<void> => {
		const alreadyExist = await connector.skippedRoles.exists(guildId, roleId)
		if(alreadyExist) return
		connector.skippedRoles.insert({ guildId, roleId })
			.catch(reason => logger.logError(this.constructor.name, this.addRole.name, reason))
	}

	deleteRole = async (connector: MongoConnector, logger: Logger, guildId: string, roleId: string): Promise<void> => {
		const exists = await connector.skippedRoles.exists(guildId, roleId)
		if(!exists) return
		connector.skippedRoles.delete({ guildId, roleId })
			.catch(reason => logger.logError(this.constructor.name, this.deleteRole.name, reason))
	}

	private tryProcess(process: (connector: MongoConnector, logger: Logger, guildId: string, userId: string) => Promise<void>, mongoConnector: MongoConnector, guildId: string, id: string, channel: TextBasedChannels) {
		try {
			process(mongoConnector, this.logger, guildId, id)
				.catch(reason => this.logger.logError(this.constructor.name, this.deleteRole.name, reason))
		} catch (e) {
			this.logger.logError(this.constructor.name, this.processMentionArray.name, e as string)
			channel.send(Messages.skipError)
				.catch(reason => this.logger.logError(this.constructor.name, this.processMentionArray.name, reason))
		}
	}

	public fillEmbed(embed: MessageEmbed): void {
		embed
			.addField(`${this.cmd} [0/1] @{user/role}`, `
			Add/remove user/role to the Skip List.
			The bot will not change visibility settings for the users/roles, which are in Skip List.
			Used when there's no need for a linked text channel for the specific Voice Channel.
			\`1\` to add the Skip List, \`0\` to remove.
			Supports arguments chaining - you're allowed to use more than 1 user/role.
			
			If an error happens when processing a user/role, the bot will post a warning in the chat.

			Examples: 
			\`${this.cmd} 1 @Wumpus @Moderator @Lumpus\` - request to add Users\`Wumpus\`, \`Lumpus\` and Role  \`Moderator\` to the Skip List 
			\`${this.cmd} 0 @Wumpus @Moderator @Lumpus\` - request to remove Users \`Wumpus\`, \`Lumpus\` and Role \`Moderator\`  from the Skip List

			Requires user to have admin/owner rights or permissions to manage channels and roles.
		`)
	}
}