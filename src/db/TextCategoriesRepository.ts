import { MongoClient } from "mongodb"
import { Constants } from "../descriptor"
import { TextCategory } from "../entities" 
import { Logger } from "../Logger"
import { Repository } from "./Repository"

export class TextCategoriesRepository extends Repository<TextCategory> {
    constructor(logger: Logger, client: MongoClient, dbName: string) {
        super(logger, client, dbName)
    }

    public async getId(guildId: string): Promise<string> {
        let textCategoryId: string = Constants.EmptyString
        return super.getFirst({ guildId: guildId })
            .then(textCategoryMap => {
                if (textCategoryMap) textCategoryId = textCategoryMap.textCategoryId
                return textCategoryId
            })
    }
}