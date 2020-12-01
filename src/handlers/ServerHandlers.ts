import { Guild } from "discord.js";
import { MongoConnector } from "../db/MongoConnector";

export class ServerHandlers {
    private mongoConnector: MongoConnector

    constructor(mongoConnector: MongoConnector) {
        this.mongoConnector = mongoConnector
    }

    public async handleBotKickedFromServer(guild: Guild) {
        this.mongoConnector.textCategoryRepository.delete(guild.id)
        this.mongoConnector.textChannelRepository.deleteAllGuildChannels(guild.id)
        this.mongoConnector.ignoredChannels.deleteAllGuildChannels(guild.id)
    }
}