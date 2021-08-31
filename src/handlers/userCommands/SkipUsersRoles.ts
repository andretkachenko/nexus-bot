import { Client,
	CommandInteraction,
	GuildMember,
	MessageEmbed
} from 'discord.js'
import { IHandler } from './IHandler'
import { Config } from '../../Config'
import { MongoConnector } from '../../db/MongoConnector'
import { Messages } from '../../descriptor'
import { BotCommand } from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './BaseHandler'
import { TypeGuarder } from '../../services'

@IHandler.register
export class SkipUsersRoles extends BaseHandler {

	private readonly flagOption = 'enable'
	private readonly idOption = 'userorrole'

	constructor(client: Client, logger: Logger, config: Config, mongoConnector: MongoConnector) {
		super(client, logger, config, mongoConnector, BotCommand.skip)

		this.slash
			.setDescription('Add/remove user/role to the Skip List.')
			.addBooleanOption(option => option.setName(this.flagOption).setDescription('Add/remove user/role to the Skip List.').setRequired(true))
			.addMentionableOption(option => option.setName(this.idOption).setDescription('role/user').setRequired(true))
	}

	public process(interaction: CommandInteraction): void {

		const enable = interaction.options.getBoolean(this.flagOption, true)
		const mentioned = interaction.options.getMentionable(this.idOption, true)
		let fn: ((connector: MongoConnector, logger: Logger, guildId: string, userId: string) => Promise<void>) | undefined
		let guild = ''
		let id = ''

		if(TypeGuarder.isGuildMember(mentioned)) {
			fn = enable ? this.addUser : this.deleteUser
			guild = mentioned.guild.id
			id = mentioned.id
		}
		if(TypeGuarder.isRole(mentioned)) {
			fn = enable ? this.addRole : this.deleteRole
			guild = mentioned.guild.id
			id = mentioned.id
		}

		if(!fn) return
		this.tryProcess(fn, this.mongoConnector, guild, id, interaction)

		super.process(interaction)
	}

	private handleUser(user: GuildMember, enable: boolean): void {
		const fn = enable ? this.addUser : this.deleteUser

		fn(this.mongoConnector, this.logger, user.guild.id, user.id)
			.catch(reason => this.logger.logError(this.constructor.name, this.handleUser.name, reason))
	}

	private handleRole(user: GuildMember, enable: boolean): void {
		const fn = enable ? this.addRole : this.deleteRole

		fn(this.mongoConnector, this.logger, user.guild.id, user.id)
			.catch(reason => this.logger.logError(this.constructor.name, this.handleRole.name, reason))
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

	private tryProcess(process: (connector: MongoConnector, logger: Logger, guildId: string, userId: string) => Promise<void>, mongoConnector: MongoConnector, guildId: string, id: string, interaction: CommandInteraction) {
		try {
			process(mongoConnector, this.logger, guildId, id)
				.catch(reason => this.logger.logError(this.constructor.name, this.deleteRole.name, reason))
		} catch (e) {
			this.logger.logError(this.constructor.name, this.tryProcess.name, e as string)
			interaction.reply({ content: Messages.skipError, ephemeral: true })
				.catch(reason => this.logger.logError(this.constructor.name, this.tryProcess.name, reason))
		}
	}

	public fillEmbed(embed: MessageEmbed): void {
		embed
			.addField(`${this.cmd}`, `
			Add/remove user/role to the Skip List.
			The bot will not change visibility settings for the users/roles, which are in Skip List.
			Used when there's no need for a linked text channel for the specific Voice Channel.
			Supports arguments chaining - you're allowed to use more than 1 user/role.
			
			If an error happens when processing a user/role, the bot will post a warning in the chat.

			Requires user to have admin/owner rights or permissions to manage channels and roles.
		`)
	}
}