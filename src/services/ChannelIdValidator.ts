import { Client,
	DMChannel,
	Guild,
	NewsChannel,
	TextChannel
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

	public validate(textChannel: TextChannel | NewsChannel | DMChannel, channelId: string, guildId: string | undefined): boolean {
		this.checkDm(textChannel)
		const guild = this.tryGetGuild(guildId)
		this.checkVoice(guild, channelId)

		return true
	}

	private checkDm(textChannel: TextChannel | NewsChannel | DMChannel): void {
		if (textChannel.type === ChannelType.dm) throw new Error(Messages.dmNotSupported)
	}

	private tryGetGuild(guildId: string | undefined): Guild {
		if(guildId === undefined) throw new Error(Messages.commandProcessError + Messages.missingGuild)
		const guild = this.client.guilds.resolve((guildId).trim())

		if (!guild) throw new Error(Messages.commandProcessError + Messages.missingGuild)
		return guild
	}

	private checkVoice(guild: Guild, channelId: string): void {
		const channel = guild.channels.resolve(channelId)
		if (channel?.type !== ChannelType.voice) throw new Error(Messages.commandProcessError + Messages.notVoiceChannelId)
	}
}