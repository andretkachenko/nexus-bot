import { DMChannel, Message,
	MessageEmbed,
	NewsChannel,
	TextChannel
} from 'discord.js'
import { IHandler } from '.'
import { Config } from '../../Config'
import { Constants } from '../../descriptor'
import { BotCommand, ChannelType } from '../../enums'
import { Logger } from '../../Logger'
import { TypeGuarder } from '../../services'
import { UserCommandHandlers } from '../UserCommandHandlers'
import { BaseHandler } from './BaseHandler'

export class Help extends BaseHandler {
	private cmdChain: UserCommandHandlers

	constructor(logger: Logger, config: Config, cmdChain: UserCommandHandlers) {
		super(logger, config, BotCommand.help)
		this.cmdChain = cmdChain
	}

	protected process(message: Message): void {
		let docType: string = BotCommand.help
		try
		{
			docType = this.getRequestedDoc(message, docType)
		}
		catch (e) {
			this.logger.logError(this.constructor.name, this.process.name, e, docType)
			this.trySendHelp(message.channel, this)
		}
	}

	private getRequestedDoc(message: Message, docType: string) {
		const args = this.splitArguments(this.trimCommand(message))
		if (args[0])
			docType = args[0]
		const docHandler = this.cmdChain.getDocHandler(docType) ?? this
		this.trySendHelp(message.channel, docHandler)
		return docType
	}

	private trySendHelp(channel: TextChannel | DMChannel | NewsChannel, handler: IHandler): void {
		const embed = this.createEmbed()
		handler.fillEmbed(embed)
		this.addFooter(embed)
		channel.send(embed)
			.catch(reason => {
				const guildId = TypeGuarder.isGuildChannel(channel) ? channel.guild.id : ChannelType.dm
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
		When the last user leaves the voice channel, messages in the linked text channel will be deleted (excluding pinned messages).
		Type \`${this.prefix}help commands\` to get the list of all commands.`)
	}

	private createEmbed(): MessageEmbed {
		return new MessageEmbed()
			.setColor(Constants.embedInfoColor)
			.setAuthor(Constants.embedTitle, this.img, Constants.repoUrl)
	}

	private addFooter(embed: MessageEmbed): void {
		embed
			.addField('Want to use it on your server?', 'Follow this link: ' + Constants.repoUrl+Constants.inviteGuideUri)
			.addField('Any issues or missing feature?', 'You can raise a ticket at ' + Constants.repoUrl+Constants.issuesUri)
	}
}