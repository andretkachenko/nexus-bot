import { MongoClient } from 'mongodb'
import { TextChannelMap } from '../entities'
import { Logger } from '../Logger'
import { Repository } from './Repository'

export class TextChannelMapsRepository extends Repository<TextChannelMap> {
	constructor(logger: Logger, client: MongoClient, dbName: string) {
		super(logger, client, dbName)
	}

	public async get(guildId: string, voiceChannelId: string): Promise<TextChannelMap> {
		return super.getFirst({ guildId, voiceChannelId })
	}

	public async getByTextChannelId(guildId: string, textChannelId: string): Promise<TextChannelMap> {
		return super.getFirst({ guildId, textChannelId })
	}

	public async delete(guildId: string, voiceChannelId: string): Promise<boolean> {
		return super.deleteOne({ guildId, voiceChannelId })
	}

	public async setPreserveOption(textChannelMap: TextChannelMap, preserve: boolean | undefined): Promise<boolean> {
		return super.update({
			guildId: textChannelMap.guildId,
			voiceChannelId: textChannelMap.voiceChannelId
		}, {
			$set: {
				preserve
			}
		})
	}

	public async changeTextChannelId(textChannelMap: TextChannelMap, textChannelId: string): Promise<boolean> {
		return super.update({
			guildId: textChannelMap.guildId,
			voiceChannelId: textChannelMap.voiceChannelId
		}, {
			$set: {
				textChannelId
			}
		})
	}
}