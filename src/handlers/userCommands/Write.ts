import { Message,
	MessageEmbed
} from 'discord.js'
import { Config } from '../../Config'
import { Constants } from '../../descriptor'
import { BotCommand,
	Permission
} from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './BaseHandler'

export class Write extends BaseHandler {
	constructor(logger: Logger, config: Config) {
		super(logger, config, BotCommand.write)
	}

	protected process(message: Message): void {
		const msg = this.trimCommand(message)
		if(msg !== Constants.emptyString) message.channel.send(msg, message.attachments.array())
			.catch(reason => this.logger.logError(this.constructor.name, this.process.name, reason))
	}

	protected hasPermissions(message: Message): boolean {
		return message.member !== null && message.member.hasPermission(Permission.manageChannels, { checkAdmin: true, checkOwner: true})
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