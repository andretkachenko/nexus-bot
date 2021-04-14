import {
	Message,
	Client
} from 'discord.js'
import {
	BotCommand,
	Permission
} from '../../enums'
import { MongoConnector } from '../../db/MongoConnector'
import { IgnoredChannel } from '../../entities'
import { BaseHandler } from './BaseHandler'
import { Logger } from '../../Logger'
import { Constants, Messages } from '../../descriptor'
import { ChannelIdValidator } from '../../services/ChannelIdValidator'

export class IgnoreChannel extends BaseHandler {
	private client: Client
	private mongoConnector: MongoConnector
	private channelIdValidator: ChannelIdValidator

	constructor(logger: Logger, client: Client, mongoConnector: MongoConnector, prefix: string) {
		super(logger, prefix + BotCommand.ignore)
		this.mongoConnector = mongoConnector
		this.client = client
		this.channelIdValidator = new ChannelIdValidator(this.logger, this.client)
	}

	protected process(message: Message): void {
		const args = this.splitArguments(this.trimCommand(message))
		const ignore = args[0] === Constants.enable
		const guildId = message.guild?.id as string
		for (let i = 1; i < args.length; i++) {
			this.handleChannelId(ignore, message, args[i], guildId)
		}
	}

	private handleChannelId(ignore: boolean, message: Message, channelId: string, guildId: string) {
		try {
			const isValid = this.channelIdValidator.validate(message.channel, channelId, guildId)
			if (!isValid) throw new Error(Messages.invalidVoiceChannelId)

			if (ignore) this.addIgnore(guildId, channelId)
			else this.deleteIgnore(guildId, channelId)
		}
		catch (e) {
			this.logger.logError(this.constructor.name, this.handleChannelId.name, e, channelId)
			message.channel.send(Messages.errorProcessingChannelId + channelId)
				.catch(reason => this.logger.logError(this.constructor.name, this.handleChannelId.name, reason))
		}
	}

	private deleteIgnore(guildId: string, channelId: string) {
		this.mongoConnector.ignoredChannels.delete(guildId, channelId)
			.catch(reason => this.logger.logError(this.constructor.name, this.deleteIgnore.name, reason))
	}

	private addIgnore(guildId: string, channelId: string) {
		const ignoredChannel: IgnoredChannel = {
			guildId,
			channelId
		}
		this.mongoConnector.ignoredChannels.insert(ignoredChannel)
			.catch(reason => this.logger.logError(this.constructor.name, this.addIgnore.name, reason))
	}

	protected hasPermissions(message: Message): boolean {
		return super.hasPermissions(message) ||
            (message.member !== null && message.member.hasPermission(Permission.manageChannels, { checkAdmin: true, checkOwner: true}))
	}
}