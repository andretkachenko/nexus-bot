import {
	CategoryChannel,
	Channel,
	GuildChannel,
	NewsChannel,
	PartialDMChannel,
	TextBasedChannels,
	TextChannel,
	ThreadChannel,
	VoiceChannel
} from 'discord.js'
import { ChannelType } from '../enums'

export class TypeGuarder {

	public static isTextChannel(channel: TextBasedChannels | CategoryChannel | VoiceChannel | GuildChannel | ThreadChannel | null | undefined): channel is TextChannel {
		return (channel as TextChannel).type === ChannelType.guildText
	}

	public static isVoiceChannel(channel: Channel | PartialDMChannel): channel is VoiceChannel {
		return (channel as VoiceChannel).type === ChannelType.guildVoice
	}

	public static isGuildChannel(channel: TextBasedChannels): channel is TextChannel | NewsChannel {
		return (channel as NewsChannel).type === ChannelType.guildNews || this.isTextChannel(channel)
	}

	public static isCategory(channel: GuildChannel | ThreadChannel | null | undefined ): channel is CategoryChannel {
		return channel?.type === ChannelType.guildCategory
	}

}