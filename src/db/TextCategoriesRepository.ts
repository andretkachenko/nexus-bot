import { MongoClient } from 'mongodb'
import { Constants } from '../descriptor'
import { TextCategory } from '../entities'
import { Logger } from '../Logger'
import { Repository } from './Repository'

export class TextCategoriesRepository extends Repository<TextCategory> {
	constructor(logger: Logger, client: MongoClient, dbName: string) {
		super(logger, client, dbName)
	}

	public async getId(guildId: string): Promise<string> {
		let textCategoryId: string = Constants.emptyString
		return super.getFirst({ guildId })
			.then(textCategoryMap => {
				if (textCategoryMap) textCategoryId = textCategoryMap.textCategoryId
				return textCategoryId
			})
	}

	public async get(guildId: string): Promise<TextCategory> {
		return super.getFirst({ guildId })
	}

	public async setAnnounce(guildId: string, announce: boolean | undefined): Promise<boolean> {
		return super.update({
			guildId
		}, {
			$set: {
				announce
			}
		})
	}
}