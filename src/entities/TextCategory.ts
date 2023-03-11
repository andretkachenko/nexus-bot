import { IGuildRelated } from '.'

export interface TextCategory extends IGuildRelated {
	guildId: string
	textCategoryId: string
	announce?: boolean
}