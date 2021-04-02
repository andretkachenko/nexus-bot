import { IGuildRelated } from '.'

export interface SkippedUser extends IGuildRelated {
	guildId: string
	userId: string
}