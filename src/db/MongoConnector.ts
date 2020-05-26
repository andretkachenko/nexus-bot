import { Config } from '../config'
import { MongoClient } from 'mongodb'
import { IntroMap } from '../entities/IntroMap';
import { TextChannelMap } from '../entities/TextChannelMap';

export class MongoConnector {
    private dbName: string
    private introCollectionName: string
    private textChannelCollectionName: string
    private client: MongoClient

    constructor(config: Config) {
        let uri = `mongodb+srv://${config.mongoName}:${config.mongoPassword}@${config.mongoCluster}`
        this.client = new MongoClient(uri, { useNewUrlParser: true });
        this.dbName = config.mongoDb
        this.introCollectionName = config.introCollectionName
        this.textChannelCollectionName = config.textChannelCollectionName

        this.client.connect((err) => {
            if (err) {
                console.log('Error occurred while connecting to MongoDB Atlas...\n', err);
                return;
            }
        })
    }

    public async fetchTextChannelId(guildId: string, channelId: string): Promise<string> {
        let textChannelId: string = ''
        let db = this.client.db(this.dbName);
        let textChannels = db.collection(this.textChannelCollectionName);
        let aggregation = textChannels.aggregate<TextChannelMap>([
            {
                $match: {
                    guildId: guildId,
                    voiceChannelId: channelId
                },
            },
        ], {
            cursor: {
                batchSize: 1
            },
        });
        return aggregation.toArray()
        .then(textChannelMaps => {
            let textMap = textChannelMaps[0];
            if(textMap !== undefined) textChannelId = textMap.textChannelId
            return textChannelId
        })
    }

    public async fetchIntro(guildId: string, channelId: string): Promise<IntroMap | undefined> {
        let introMap: IntroMap | undefined
        let db = this.client.db(this.dbName)
        let introMaps = db.collection(this.introCollectionName)
        let aggregation = introMaps.find({ guildId: guildId, channelId: channelId });
        return aggregation.toArray()
        .then(introMaps => {
            introMap = introMaps[0]
            return introMap
        })
    }

    public addTextChannel(textChannelMap: TextChannelMap) {
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.textChannelCollectionName)
        textChannels.insertOne(textChannelMap, (err) => {
            if (err) console.log(err)
            console.log("document inserted")
        })
    }

    public addIntro(introMap: IntroMap) {
        let db = this.client.db(this.dbName)
        let introMaps = db.collection(this.introCollectionName)
        introMaps.insertOne(introMap, (err) => {
            if (err) console.log(err)
            console.log("document inserted")
        })
    }

    public deleteTextChannel(guildId: string, voiceChannelId: string) {
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.textChannelCollectionName)
        textChannels.deleteOne({ guildId: guildId, channelId: voiceChannelId }, (err) => {
            if (err) console.log(err)
            console.log("document deleted")
        })
    }

    public changeIntro(introMap: IntroMap) {
        let db = this.client.db(this.dbName)
        let introMaps = db.collection(this.introCollectionName)
        introMaps.updateOne({ guildId: introMap.GuildId, channelId: introMap.ChannelId }, { $set: { Description: introMap.Description, ImageUrl: introMap.ImageUrl, AdditionalUrl: introMap.AdditionalUrl } }, (err) => {
            if (err) console.log(err)
            else console.log("document updated")
        })
    }

    public deleteIntro(guildId: string, voiceChannelId: string) {
        let db = this.client.db(this.dbName)
        let introMaps = db.collection(this.introCollectionName)
        introMaps.deleteOne({ guildId: guildId, channelId: voiceChannelId }, (err) => {
            if (err) console.log(err)
            console.log("document deleted")
        })
    }
}