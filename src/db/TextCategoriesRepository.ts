import { MongoClient } from "mongodb"
import { TextCategoryMap } from "../entities" 
import { Repository } from "./Repository"

export class TextCategoriesRepository extends Repository<TextCategoryMap> {
    constructor(client: MongoClient, dbName: string) {
        super(client, dbName)
    }

    public async getId(guildId: string): Promise<string> {
        let textCategoryId: string = ''
        return super.get({ guildId: guildId })
            .then(textCategoryMap => {
                if (textCategoryMap) textCategoryId = textCategoryMap.textCategoryId
                return textCategoryId
            })
    }
}