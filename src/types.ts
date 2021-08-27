import { CategoryChannel,
	NewsChannel,
	PermissionString,
	StageChannel,
	StoreChannel,
	TextChannel,
	VoiceChannel } from 'discord.js'

export type Channels = TextChannel | VoiceChannel | StageChannel | NewsChannel | CategoryChannel |  StoreChannel
export type SafeRecord<K extends string | number | symbol, T> = { [P in K]: T; }
export type SafePermissionOverwriteOptions = Partial<SafeRecord<PermissionString, boolean | null>>