import { Message } from 'discord.js'
import { Messages } from '../../descriptor'
import { BotCommand } from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './BaseHandler'

export class Ping extends BaseHandler {
	constructor(logger: Logger, prefix: string) {
		super(logger, prefix + BotCommand.ping)
	}

	protected process(message: Message): void {
		message.channel.send(Messages.pingResponse)
			.catch(reason => this.logger.logError(this.constructor.name, this.process.name, reason))
	}

	protected hasPermissions(_message: Message): boolean {
		return true
	}
}