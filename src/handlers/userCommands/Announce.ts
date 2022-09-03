import { Client,
	CommandInteraction,
	Message,
	MessageEmbed
} from 'discord.js'
import { IHandler } from './IHandler'
import { Config } from '../../Config'
import { MongoConnector } from '../../db/MongoConnector'
import { Messages } from '../../descriptor'
import {
	BotCommand,
	Permission
} from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './BaseHandler'

@IHandler.register
export class Announce extends BaseHandler {

	private readonly flagOption = 'enable'

	constructor(client: Client, logger: Logger, config: Config, mongoConnector: MongoConnector) {
		super(client, logger, config, mongoConnector, BotCommand.announce)

		this.slash
			.setDescription('Enable/disable sending join/leave messages')
			.addBooleanOption(o =>
				o
					.setName(this.flagOption)
					.setDescription('Enable announce?')
					.setRequired(true)
			)
	}

	public process(interaction: CommandInteraction): void {
		const flag = interaction.options.getBoolean(this.flagOption, true)
		this.handleAnnounceCall(interaction.guildId, flag)
		super.process(interaction)
	}

	private handleAnnounceCall(guildId: string, preserve: boolean): void {
		this.mongoConnector.textCategoryRepository.setAnnounce(guildId, preserve)
			.catch(reason => this.logger.logError(this.constructor.name, this.handleAnnounceCall.name, reason))
	}

	protected hasPermissions(message: Message): boolean {
		return super.hasPermissions(message) ||
            (message.member !== null && message.member.permissions.has(Permission.manageChannels, true))
	}

	public fillEmbed(embed: MessageEmbed): void {
		embed
			.addField(`${this.cmd}`, `
			Enable/disable sending join/leave messages.
            If enabled these messages will be sent to the linked Text Channel:
            - '${Messages.joinMessage('<User>')}' once a user has joined the Voice Channel;
            - '${Messages.leftMessage('<User>')}' once a user has left the Voice Channel;
            
            Requires user to have admin/owner rights or permissions to manage channels and roles.
		`)
	}
}