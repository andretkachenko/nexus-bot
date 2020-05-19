import * as dotenv from "dotenv";

export class Config {
    token: string
    environment: string
    prefix: string
    activity: string

    constructor() {
        dotenv.config()
        this.token = process.env.TOKEN as string
        this.environment = process.env.NODE_ENV as string
        this.prefix = process.env.PREFIX as string
        this.activity = process.env.ACTIVITY as string
    }
}