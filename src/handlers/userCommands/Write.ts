import { Message } from 'discord.js'
import { Constants } from '../../descriptor'
import { BotCommand } from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './BaseHandler'

export class Write extends BaseHandler {
	constructor(logger: Logger, prefix: string) {
		super(logger, prefix + BotCommand.write)
	}

	protected process(message: Message): void {
		const msg = this.trimCommand(message)
		if(msg !== Constants.emptyString) message.channel.send(msg, message.attachments.array())
			.catch(reason => this.logger.logError(this.constructor.name, this.process.name, reason))
	}
}