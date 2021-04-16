import { Message,
	MessageEmbed
} from 'discord.js'
import { Config } from '../../config'
import { Messages } from '../../descriptor'
import { BotCommand } from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './.'

export class ChannelId extends BaseHandler {
	constructor(logger: Logger, config: Config) {
		super(logger, config, BotCommand.channelId)
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
			.addField('How can I find User ID/Channel ID/Guild ID?', `
            To be able to see IDs in Discord you need to:
            1. Go to the Discord settings
            2. Go to the Advanced tab
            3. Enable "Developer Mode"

            After that, you should see new option in the right-click menu - \`Copy ID\`.
            Click on it and then paste the ID when needed.
        `)
	}
}