import { Client,
	Guild
} from 'discord.js'
import { Messages } from '../descriptor'
import { ChannelType } from '../enums'
import { Logger } from '../Logger'

export class ChannelIdValidator {
	private client: Client
	private logger: Logger

	constructor(logger: Logger, client: Client) {
		this.logger = logger
		this.client = client
	}

	public validate(channelId: string, guildId: string | undefined, allowCategoryId?: boolean): boolean {
		const guild = this.tryGetGuild(guildId)
		let validCategory = false
		if(allowCategoryId) validCategory = this.checkCategory(channelId, guild)
		if(validCategory) return true
		this.checkVoice(guild, channelId)

		return true
	}

	private tryGetGuild(guildId: string | undefined): Guild {
		if(guildId === undefined) throw new Error(Messages.commandProcessError + Messages.missingGuild)
		const guild = this.client.guilds.resolve((guildId).trim())

		if (!guild) throw new Error(Messages.commandProcessError + Messages.missingGuild)
		return guild
	}

	private checkCategory(channelId: string, guild: Guild): boolean {
		const channel = guild.channels.resolve(channelId)
		return channel?.type === ChannelType.guildCategory
	}

	private checkVoice(guild: Guild, channelId: string): void {
		const channel = guild.channels.resolve(channelId)
		if (channel?.type !== ChannelType.guildVoice && channel?.type !== ChannelType.guildStageVoice) throw new Error(Messages.commandProcessError + Messages.notVoiceChannelId)
	}
}