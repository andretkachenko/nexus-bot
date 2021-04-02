import { IGuildRelated } from '.'

export interface TextChannelMap extends IGuildRelated {
	guildId: string
	voiceChannelId: string
	textChannelId: string
	preserve?: boolean
}