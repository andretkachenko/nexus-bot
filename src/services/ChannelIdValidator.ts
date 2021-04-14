import { Client,
	DMChannel,
	NewsChannel,
	TextChannel
} from 'discord.js'
import { Constants,
	Messages
} from '../descriptor'
import {
	ChannelType
} from '../enums'
import { Logger } from '../Logger'

export class ChannelIdValidator {
	private client: Client
	private logger: Logger

	constructor(logger: Logger, client: Client) {
		this.logger = logger
		this.client = client
	}

	public validate(textChannel: TextChannel | NewsChannel | DMChannel, channelId: string, guildId: string | undefined): boolean {
		let isValid = true
		let message = Constants.emptyString
		if (textChannel.type === ChannelType.dm) {
			message = Messages.dmNotSupported
			isValid = false
		}
		else if (guildId === undefined) {
			message = Messages.commandProcessError + Messages.missingGuild
			isValid = false
		}
		if (isValid) {
			const guild = this.client.guilds.resolve((guildId as string).trim())
			if (!guild) {
				message = Messages.commandProcessError + Messages.missingGuild
				isValid = false
			} else {
				const channel = guild.channels.resolve(channelId)
				if (channel?.type !== ChannelType.voice) {
					message = Messages.commandProcessError + Messages.notVoiceChannelId
					isValid = false
				}
			}
		}

		if (message !== Constants.emptyString) {
			textChannel.send(message)
				.catch(reason => this.logger.logError(this.constructor.name, this.validate.name, reason))
		}
		return isValid
	}
}