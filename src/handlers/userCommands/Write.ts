import { Client,
	CommandInteraction,
	Message,
	MessageEmbed
} from 'discord.js'
import { IHandler } from './IHandler'
import { Config } from '../../Config'
import { BotCommand,
	Permission
} from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './BaseHandler'
import { MongoConnector } from '../../db'

@IHandler.register
export class Write extends BaseHandler {
	private readonly msgOption = 'message'

	constructor(client: Client, logger: Logger, config: Config, mongoConnector: MongoConnector) {
		super(client, logger, config, mongoConnector, BotCommand.write)

		this.slash
			.setDescription('Repeat the message')
			.addStringOption(option =>
				option
					.setName(this.msgOption)
					.setDescription('message to repeat')
					.setRequired(true))
	}

	public process(interaction: CommandInteraction): void {
		const msg = interaction.options.getString(this.msgOption, true)

		interaction.channel?.send({ content: msg })
			.catch(reason => this.logger.logError(this.constructor.name, this.process.name, reason))

		super.process(interaction)
	}

	protected hasPermissions(message: Message): boolean {
		return message.member !== null && message.member.permissions.has(Permission.manageChannels, true)
	}

	public fillEmbed(embed: MessageEmbed): void {
		embed
			.addField(`${this.cmd}`, `
			Repeat the message that was written with the command.
			May be used to give descriptions/systems message to the Nexus text channels.
			Requires user to have admin/owner rights or permissions to manage channels and roles.
		`)
	}
}