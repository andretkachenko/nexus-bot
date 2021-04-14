import { Message } from 'discord.js'
import { MongoConnector } from '../../db/MongoConnector'
import { Constants } from '../../descriptor'
import { TextChannelMap } from '../../entities'
import {
	BotCommand,
	Permission
} from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './BaseHandler'

export class Preserve extends BaseHandler {
	private mongoConnector: MongoConnector

	constructor(logger: Logger, mongoConnector: MongoConnector, prefix: string) {
		super(logger, prefix + BotCommand.preserve)
		this.mongoConnector = mongoConnector
	}

	protected process(message: Message): void {
		const args = this.splitArguments(this.trimCommand(message))
		const guildId = message.guild?.id as string
		const preserve = args[0] === Constants.enable
		for (let i = 1; i < args.length; i++) {
			this.handlePreserveCall(guildId, preserve, args[i])
		}
	}

	protected handlePreserveCall(guildId: string, preserve: boolean, voiceChannelId: string): void {
		const textChannelMap: TextChannelMap = {
			guildId,
			voiceChannelId,
			textChannelId: Constants.emptyString
		}
		this.mongoConnector.textChannelRepository.setPreserveOption(textChannelMap, preserve)
			.catch(reason => this.logger.logError(this.constructor.name, this.handlePreserveCall.name, reason))
	}

	protected hasPermissions(message: Message): boolean {
		return super.hasPermissions(message) ||
            (message.member !== null && message.member.hasPermission(Permission.manageChannels, { checkAdmin: true, checkOwner: true}))
	}
}