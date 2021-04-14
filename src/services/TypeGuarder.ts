import {
	CategoryChannel,
	Channel,
	GuildChannel,
	PartialDMChannel,
	TextChannel,
	VoiceChannel
} from 'discord.js'
import { ChannelType } from '../enums'

export class TypeGuarder {

	public static isTextChannel(channel: TextChannel | CategoryChannel | VoiceChannel | GuildChannel | null | undefined): channel is TextChannel {
		return (channel as TextChannel).type === ChannelType.text
	}

	public static isVoiceChannel(channel: Channel | PartialDMChannel): channel is VoiceChannel {
		return (channel as VoiceChannel).type === ChannelType.voice
	}

}