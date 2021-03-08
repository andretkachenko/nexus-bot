import { MongoClient } from "mongodb"
import { TextCategory } from "../entities" 
import { Repository } from "./Repository"

export class TextCategoriesRepository extends Repository<TextCategory> {
    constructor(client: MongoClient, dbName: string) {
        super(client, dbName)
    }

    public async getId(guildId: string): Promise<string> {
        let textCategoryId: string = ''
        return super.getFirst({ guildId: guildId })
            .then(textCategoryMap => {
                if (textCategoryMap) textCategoryId = textCategoryMap.textCategoryId
                return textCategoryId
            })
    }
}