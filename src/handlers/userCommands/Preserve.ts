import { Message,
	MessageEmbed
} from 'discord.js'
import { Config } from '../../Config'
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

	constructor(logger: Logger, mongoConnector: MongoConnector, config: Config) {
		super(logger, config, BotCommand.preserve)
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

	private handlePreserveCall(guildId: string, preserve: boolean, voiceChannelId: string): void {
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

	public fillEmbed(embed: MessageEmbed): void {
		embed
			.addField(`${this.cmd} [0/1] {channelId}`, `
			Enable/disable clearance of the Text Channel after the last User has left associated Voice Channel.
            \`1\` means that messages should not be deleted once the Voice Channel is empty, \`0\` - delete all unpinned messages after the last User has left the Voice Channel (0 is the default option for the each Text Channel the bot creates).
            The pinned messages will remain in all Nexus-handled Text Channels with both options.

            Examples:
            \`${this.cmd} 1 717824008636334130\` - request to keep message in the Text Channel with the ID \`717824008636334130\`
            \`${this.cmd} 0 717824008636334130\` - request to resume message deletion in the Text Channel with the ID \`717824008636334130\`
            
            Requires user to have admin/owner rights or permissions to manage channels and roles.
		`)
	}
}