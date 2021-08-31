import {
	Message,
	Client,
	MessageEmbed,
	CommandInteraction
} from 'discord.js'
import {
	BotCommand,
	Permission
} from '../../enums'
import { MongoConnector } from '../../db/MongoConnector'
import { IgnoredChannel } from '../../entities'
import { BaseHandler } from './BaseHandler'
import { Logger } from '../../Logger'
import { Messages } from '../../descriptor'
import { ChannelIdValidator } from '../../services/ChannelIdValidator'
import { Config } from '../../Config'
import { TypeGuarder } from '../../services'
import { IHandler } from './IHandler'

@IHandler.register
export class IgnoreChannel extends BaseHandler {
	private channelIdValidator: ChannelIdValidator
	private readonly flagOption = 'enable'
	private readonly idOption = 'voicechannel'

	constructor(client: Client, logger: Logger, config: Config, mongoConnector: MongoConnector) {
		super(client, logger, config, mongoConnector, BotCommand.ignore)

		this.channelIdValidator = new ChannelIdValidator(this.logger, this.client)

		this.slash
			.setDescription('Toggle channel linking')
			.addBooleanOption(o =>
				o
					.setName(this.flagOption)
					.setDescription('Enable/disable clearance of the Text Channel after the last User has left associated Voice Channel.')
					.setRequired(true)
			)
			.addChannelOption(o => o.setName(this.idOption).setDescription('Voice Channel, for which it should be changed').setRequired(true))
	}

	public process(interaction: CommandInteraction): void {
		const flag = interaction.options.getBoolean(this.flagOption, true)
		const channel = interaction.options.getChannel(this.idOption, true)

		if(TypeGuarder.isGuildChannel(channel))
			this.handleChannelId(flag, interaction, channel.id, channel.guild.id)

		super.process(interaction)
	}

	private handleChannelId(ignore: boolean, interaction: CommandInteraction, channelId: string, guildId: string) {
		try {
			this.handleIgnore(interaction, channelId, guildId, ignore)
				.catch(reason => this.logger.logError(this.constructor.name, this.handleIgnore.name, reason))
		}
		catch (e) {
			const msg = e instanceof Error ? e.message : Messages.errorProcessingChannelId + channelId
			this.logger.logError(this.constructor.name, this.handleChannelId.name, msg, channelId)
			interaction.reply({ content: msg, ephemeral: true })
				.catch(reason => this.logger.logError(this.constructor.name, this.handleChannelId.name, reason))
		}
	}

	private async handleIgnore(interaction: CommandInteraction, channelId: string, guildId: string, ignore: boolean): Promise<void> {
		this.channelIdValidator.validate(channelId, guildId, true)

		return ignore
			? this.addIgnore(guildId, channelId, TypeGuarder.isCategory(interaction.guild?.channels.resolve(channelId)))
			: this.deleteIgnore(guildId, channelId)
	}

	private async deleteIgnore(guildId: string, channelId: string): Promise<void> {
		const exists = await this.mongoConnector.ignoredChannels.exists(guildId, channelId)
		if(!exists) return
		this.mongoConnector.ignoredChannels.delete(guildId, channelId)
			.catch(reason => this.logger.logError(this.constructor.name, this.deleteIgnore.name, reason))
	}

	private async addIgnore(guildId: string, channelId: string, isCategory: boolean): Promise<void> {
		const ignoredChannel: IgnoredChannel = {
			guildId,
			channelId,
			isCategory
		}
		const alreadyExist = await this.mongoConnector.ignoredChannels.exists(guildId, channelId)
		if(alreadyExist) return
		this.mongoConnector.ignoredChannels.insert(ignoredChannel)
			.catch(reason => this.logger.logError(this.constructor.name, this.addIgnore.name, reason))
	}

	protected hasPermissions(message: Message): boolean {
		return super.hasPermissions(message) ||
            (message.member !== null && message.member.permissions.has(Permission.manageChannels, true))
	}

	public fillEmbed(embed: MessageEmbed): void {
		embed
			.addField(`${this.cmd}`, `
        Start/stop ignoring voice channel / category with voice channels when checking for linked text channel.
        Used when there's no need for linked text channel for the specific Voice Channel / Voice Channels inside specific Category.
        Supports arguments chaining - you're allowed to use more than 1 Voice Channel ID / Category ID.

        If the channelId is invalid, the bot will post a warning in the chat.
        
        Requires user to have admin/owner rights or permissions to manage channels and roles.
        `)
	}
}