import { APIInteractionDataResolvedGuildMember,
	APIRole
} from 'discord-api-types'
import { CategoryChannel,
	NewsChannel,
	PermissionString,
	StageChannel,
	StoreChannel,
	TextChannel,
	VoiceChannel,
	User,
	Role,
	GuildMember } from 'discord.js'
import { SkippedRole, SkippedUser } from './entities'

export type Channels = TextChannel | VoiceChannel | StageChannel | NewsChannel | CategoryChannel |  StoreChannel
export type SafeRecord<K extends string | number | symbol, T> = { [P in K]: T; }
export type SafePermissionOverwriteOptions = Partial<SafeRecord<PermissionString, boolean | null>>

export type Mentionable = User | Role | GuildMember | APIInteractionDataResolvedGuildMember | APIRole | null

export type UserOrRole = SkippedRole | SkippedUser