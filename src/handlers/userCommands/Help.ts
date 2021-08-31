import { Client,
	CommandInteraction,
	Message,
	MessageEmbed
} from 'discord.js'
import { Config } from '../../Config'
import { MongoConnector } from '../../db'
import { BotCommand, ChannelType } from '../../enums'
import { Logger } from '../../Logger'
import { TypeGuarder } from '../../services'
import { BaseHandler } from './BaseHandler'
import { IHandler } from './IHandler'

@IHandler.register
export class Help extends BaseHandler {
	private config: Config
	private readonly cmdOption = 'command'

	constructor(client: Client, logger: Logger, config: Config, mongoConnector: MongoConnector) {
		super(client, logger, config, mongoConnector, BotCommand.help)

		this.config = config

		this.slash
			.setDescription('How to use')
			.addStringOption(o => o.setName(this.cmdOption).setDescription('command name'))
	}

	public process(interaction: CommandInteraction): void {
		const docType = interaction.options.getString(this.cmdOption) ?? BotCommand.help
		try
		{
			this.getRequestedDoc(interaction, docType)
		}
		catch (e) {
			this.logger.logError(this.constructor.name, this.process.name, e as string, docType)
			this.trySendHelp(interaction, this)
		}
	}

	private getRequestedDoc(interaction: CommandInteraction, docType: string): void {
		const cmds : Map<string, IHandler> = new Map()
		const handlers = IHandler.getImplementations()
		for (const handler of handlers) {
			const instance = new handler(this.client, this.logger, this.config, this.mongoConnector)
			cmds.set(instance.cmd, instance)
		}

		const docHandler = cmds.get(docType)
		if(docHandler) this.trySendHelp(interaction, docHandler)
	}

	private trySendHelp(interaction: CommandInteraction, handler: IHandler): void {
		const embed = this.createEmbed()
		handler.fillEmbed(embed)
		this.addFooter(embed)
		interaction.reply({ embeds: [ embed ], ephemeral: true })
			.catch(reason => {
				const guildId = TypeGuarder.isTextOrNews(interaction.channel) ? interaction.channel.guild.id : ChannelType.dm
				this.logger.logError(this.constructor.name, this.trySendHelp.name, reason, guildId)
			})
	}

	protected hasPermissions(_message: Message): boolean {
		return true
	}

	public fillEmbed(embed: MessageEmbed): void {
		embed
			.addField('How to use',
				`You don't need to set up anything - once you join a voice channel (excluding inactive channel), a new category with the linked text channel will be created.
		Each time user joins/leaves voice channel, he will get/lose rights to see the linked text channel.
		Feel free to rename/move categories and text channels as you wish - it will not affect bot.
		When the last user leaves the voice channel, messages in the linked text channel will be deleted (excluding pinned messages).`)
	}
}