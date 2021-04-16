import { Message,
	MessageEmbed
} from 'discord.js'
import { Config } from '../../config'
import { Messages } from '../../descriptor'
import { BotCommand } from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './.'

export class Whoops extends BaseHandler {
	constructor(logger: Logger, config: Config) {
		super(logger, config, BotCommand.whoops)
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
			.addField('The bot does not behave as expected', `
            First, ensure that the bot has all permissions needed for proper work.
            That is:
            - Manage Roles
            - Manage Channels
            - Read Messages
            - Manage Messages
            - Read Message History
        `)
			.addField('Might be a fluke?', `
            There's a chance that something went wrong during one exact event. 
            Possible outcomes:
                - Discord Server was unreachable and ignored bot's command;
                - Command was sent to the bot during it's restart;
                - Command had invalid/unexpected arguments and cause bot's internal error
        `)
			.addField('Let\'s try again', `
            Try different command or repeat the previous one. 
            If the bot is still not working as expected/not working at all/offline - consider raising a ticket (see \`Any issues...\` section below)
        `)
			.addField('Can I reset bot\'s settings?', `
            In case you think that you messed up with any setting for the Nexus channels - kick the bot and re-invite it again.
            This will delete all existing settings related to your server from the database and you'll be able to start from scratch.
        `)
	}
}