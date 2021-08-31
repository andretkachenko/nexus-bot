import { Client,
	CommandInteraction,
	Message,
	MessageEmbed
} from 'discord.js'
import { Config } from '../../Config'
import { MongoConnector } from '../../db'
import { Messages } from '../../descriptor'
import { BotCommand } from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './BaseHandler'
import { IHandler } from './IHandler'

@IHandler.register
export class Ping extends BaseHandler {
	constructor(client: Client, logger: Logger, config: Config, mongoConnector: MongoConnector) {
		super(client, logger, config, mongoConnector, BotCommand.ping)

		this.slash
			.setDescription('Check if the bot is alive')
	}

	public process(interaction: CommandInteraction): void {
		interaction.reply({ content: Messages.pingResponse, ephemeral: true })
			.catch(reason => this.logger.logError(this.constructor.name, this.process.name, reason))
	}

	protected hasPermissions(_message: Message): boolean {
		return true
	}

	public fillEmbed(embed: MessageEmbed): void {
		embed
			.addField(`${this.cmd}`, `
            This command is created to check if the bot is alive.
            Writes \`'${Messages.pingResponse}'\` in the chat if the bot is working.
		`)
	}
}