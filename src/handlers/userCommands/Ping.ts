import { Message,
	MessageEmbed
} from 'discord.js'
import { Config } from '../../config'
import { Messages } from '../../descriptor'
import { BotCommand } from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './BaseHandler'

export class Ping extends BaseHandler {
	constructor(logger: Logger, config: Config) {
		super(logger, config, BotCommand.ping)
	}

	protected process(message: Message): void {
		message.channel.send(Messages.pingResponse)
			.catch(reason => this.logger.logError(this.constructor.name, this.process.name, reason))
	}

	protected hasPermissions(_message: Message): boolean {
		return true
	}

	public fillEmbed(embed: MessageEmbed): void {
		embed
			.addField(`${this.prefix}ping`, `
            This command is create to check if the bot is alive.
            Writes \`'${Messages.pingResponse}'\` in the chat if the bot is working.
		`)
	}
}