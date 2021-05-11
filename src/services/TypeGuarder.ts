import {
	CategoryChannel,
	Channel,
	DMChannel,
	GuildChannel,
	NewsChannel,
	PartialDMChannel,
	TextChannel,
	VoiceChannel
} from 'discord.js'
import { ChannelType } from '../enums'

export class TypeGuarder {

	public static isTextChannel(channel: TextChannel | CategoryChannel | DMChannel | VoiceChannel | GuildChannel | null | undefined): channel is TextChannel {
		return (channel as TextChannel).type === ChannelType.text
	}

	public static isVoiceChannel(channel: Channel | PartialDMChannel): channel is VoiceChannel {
		return (channel as VoiceChannel).type === ChannelType.voice
	}

	public static isGuildChannel(channel: TextChannel | DMChannel | NewsChannel): channel is TextChannel | NewsChannel {
		return (channel as NewsChannel).type === ChannelType.news || this.isTextChannel(channel)
	}

	public static isCategory(channel: GuildChannel | null | undefined ): channel is CategoryChannel {
		return channel?.type === ChannelType.category
	}

}