import { Client,
	CommandInteraction,
	Message,
	MessageEmbed
} from 'discord.js'
import { Config } from '../../Config'
import { MongoConnector } from '../../db'
import { BotCommand } from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler,
	IHandler
} from './.'

@IHandler.register
export class Whoops extends BaseHandler {
	constructor(client: Client, logger: Logger, config: Config, mongoConnector: MongoConnector) {
		super(client, logger, config, mongoConnector, BotCommand.whoops)

		this.slash.setDescription('Memo if the bot does not behave as expected')
	}

	public process(interaction: CommandInteraction): void {
		const embed = this.createEmbed()
		this.fillEmbed(embed)
		this.addFooter(embed)
		interaction.reply({ embeds: [embed], ephemeral: true })
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
            - Send Messages
            - Manage Messages
            - Embed Links
            - Attach Files
            - Read Message History
            - Mention @everyone, @here and All Roles
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