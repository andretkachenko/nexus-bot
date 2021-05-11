import { IGuildRelated } from '.'

export interface IgnoredChannel extends IGuildRelated {
	guildId: string
	channelId: string
	isCategory?: boolean
}