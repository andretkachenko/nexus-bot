import { SkippedRole } from '../entities'
import { MongoClient } from 'mongodb'
import { Repository } from './Repository'
import { Logger } from '../Logger'

export class SkippedRolesRepository extends Repository<SkippedRole> {
	constructor(logger: Logger, client: MongoClient, dbName: string) {
		super(logger, client, dbName)
	}

	public async getAll(guildId: string): Promise<SkippedRole[]> {
		return super.getMany({ guildId })
	}

	public async exists(guildId: string, roleId: string): Promise<boolean> {
		return super.getFirst({ guildId, roleId })
			.then(entity => {
				return entity !== undefined && entity !== null
			})
	}

	public async delete(role: SkippedRole): Promise<boolean> {
		return super.deleteOne({ guildId: role.guildId, roleId: role.roleId })
	}
}