import { SkippedUser } from '../entities'
import { MongoClient } from 'mongodb'
import { Repository } from './Repository'
import { Logger } from '../Logger'

export class SkippedUsersRepository extends Repository<SkippedUser> {
	constructor(logger: Logger, client: MongoClient, dbName: string) {
		super(logger, client, dbName)
	}

	public async exists(guildId: string, userId: string): Promise<boolean> {
		return super.getFirst({ guildId, userId })
			.then(entity => {
				return entity !== undefined && entity !== null
			})
	}

	public async delete(user: SkippedUser): Promise<boolean> {
		return super.deleteOne({ guildId: user.guildId, userId: user.userId })
	}
}