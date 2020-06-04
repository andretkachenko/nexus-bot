import { Config } from '../config'
import { MongoClient } from 'mongodb'
import { TextChannelMap } from '../entities/TextChannelMap';
import { TextChannelRepository } from './TextChannelRepository';
import { TextCategoryRepository } from './TextCategoryRepository';

export class MongoConnector {
    private client: MongoClient
    public textChannelRepository: TextChannelRepository
    public textCategoryRepository: TextCategoryRepository

    constructor(config: Config) {
        let uri = `mongodb+srv://${config.mongoName}:${config.mongoPassword}@${config.mongoCluster}`
        this.client = new MongoClient(uri, { useNewUrlParser: true });

        this.client.connect((err) => {
            if (err) {
                console.log('Error occurred while connecting to MongoDB Atlas...\n', err);
                return;
            }
        })

        this.textChannelRepository = new TextChannelRepository(this.client, config)
        this.textCategoryRepository = new TextCategoryRepository(this.client, config)
    }
}