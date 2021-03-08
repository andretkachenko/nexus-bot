import { Config } from '../config'
import { MongoClient } from 'mongodb'
import { Repository } from "./Repository"
import { IGuildRelated } from '../entities'
import {
    IgnoredChannelsRepository,
    SkippedRolesRepository,
    SkippedUsersRepository,
    TextCategoriesRepository,
    TextChannelMapsRepository
} from '.'

export class MongoConnector {
    private client: MongoClient

    public repositories: Repository<IGuildRelated>[]
    public textChannelRepository: TextChannelMapsRepository
    public textCategoryRepository: TextCategoriesRepository
    public ignoredChannels: IgnoredChannelsRepository
    public skippedUsers: SkippedUsersRepository
    public skippedRoles: SkippedRolesRepository

    constructor(config: Config) {
        let uri = `mongodb+srv://${config.mongoName}:${config.mongoPassword}@${config.mongoCluster}`
        this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

        this.client.connect((err) => {
            if (err) {
                console.log('[ERROR] MongoDB Atlas Connect - ', err)
                return
            }
        })

        this.textChannelRepository = new TextChannelMapsRepository(this.client, config.mongoDb)
        this.textCategoryRepository = new TextCategoriesRepository(this.client, config.mongoDb)
        this.ignoredChannels = new IgnoredChannelsRepository(this.client, config.mongoDb)
        this.skippedUsers = new SkippedUsersRepository(this.client, config.mongoDb)
        this.skippedRoles = new SkippedRolesRepository(this.client, config.mongoDb)

        // add repository to this arrray for auto clearance at GuildDelete event
        this.repositories = [
            this.textChannelRepository,
            this.textCategoryRepository,
            this.ignoredChannels,
            this.skippedUsers,
            this.skippedRoles,
        ]
    }
}