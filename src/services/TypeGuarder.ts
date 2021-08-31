import { APIInteractionDataResolvedChannel } from 'discord-api-types'
import {
	CategoryChannel,
	Channel,
	GuildChannel,
	GuildMember,
	NewsChannel,
	PartialDMChannel,
	Role,
	TextBasedChannels,
	TextChannel,
	ThreadChannel,
	VoiceChannel
} from 'discord.js'
import { ChannelType } from '../enums'
import { Mentionable } from '../types'

export class TypeGuarder {

	public static isTextChannel(channel: TextBasedChannels | CategoryChannel | VoiceChannel | GuildChannel | ThreadChannel | null | undefined): channel is TextChannel {
		return (channel as TextChannel).type === ChannelType.guildText
	}

	public static isVoiceChannel(channel: Channel | PartialDMChannel): channel is VoiceChannel {
		return (channel as VoiceChannel).type === ChannelType.guildVoice
	}

	public static isTextOrNews(channel: TextBasedChannels | null): channel is TextChannel | NewsChannel {
		return (channel as NewsChannel).type === ChannelType.guildNews || this.isTextChannel(channel)
	}

	public static isGuildChannel(channel: GuildChannel | APIInteractionDataResolvedChannel): channel is GuildChannel {
		return (channel as GuildChannel).guild !== undefined
	}

	public static isCategory(channel: GuildChannel | ThreadChannel | null | undefined ): channel is CategoryChannel {
		return channel?.type === ChannelType.guildCategory
	}

	public static isGuildMember(mentioned: Mentionable): mentioned is GuildMember {
		return (mentioned as GuildMember).nickname !== undefined
	}

	public static isRole(mentioned: Mentionable): mentioned is Role {
		return (mentioned as Role).tags !== undefined
	}
}