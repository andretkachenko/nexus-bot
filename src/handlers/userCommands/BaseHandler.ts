import { SlashCommandBuilder } from '@discordjs/builders'
import { Client, CommandInteraction,
	Message,
	MessageEmbed
} from 'discord.js'
import { Config } from '../../Config'
import { MongoConnector } from '../../db'
import { Constants } from '../../descriptor'
import { Permission } from '../../enums'
import { Logger } from '../../Logger'
import { IHandler } from './.'

export abstract class BaseHandler implements IHandler {
	public slash: SlashCommandBuilder
	protected client: Client
	protected logger: Logger
	protected mongoConnector: MongoConnector
	public readonly cmd: string
	protected readonly img: string

	constructor(client: Client, logger: Logger, config: Config, mongoConnector: MongoConnector, cmd : string) {
		this.client = client
		this.logger = logger
		this.mongoConnector = mongoConnector
		this.cmd = cmd
		this.img = config.img

		this.slash = new SlashCommandBuilder()
			.setName(cmd)
			.setDescription(cmd)
	}

	public process(interaction: CommandInteraction): void {
		if(interaction.replied) return
		interaction.reply({ content: 'done', ephemeral: true})
			.catch(reason => this.logger.logError(this.constructor.name, this.process.name, reason))
	}
	public abstract fillEmbed(embed: MessageEmbed): void

	protected hasPermissions(message: Message): boolean {
		return message.member !== null && message.member.permissions.has([Permission.manageRoles, Permission.sendMessages, Permission.viewChannel], true)
	}

	protected createEmbed(): MessageEmbed {
		return new MessageEmbed()
			.setColor(Constants.embedInfoColor)
			.setAuthor(Constants.embedTitle, this.img, Constants.repoUrl)
	}

	protected addFooter(embed: MessageEmbed): void {
		embed
			.addField('Any issues or missing feature?', 'You can raise a ticket at ' + Constants.repoUrl+Constants.issuesUri)
	}
}