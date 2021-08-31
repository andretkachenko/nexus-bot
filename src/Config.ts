import * as dotenv from 'dotenv'

export class Config {
	applicationId: string
	token: string
	environment: string
	testServer: string
	mongoName: string
	mongoPassword: string
	mongoCluster: string
	mongoDb: string
	img: string

	constructor() {
		dotenv.config()
		this.applicationId = process.env.APPLICATION_ID as string
		this.token = process.env.TOKEN as string
		this.environment = process.env.NODE_ENV as string
		this.testServer = process.env.TEST_SERVER as string
		this.mongoName = process.env.MONGO_NAME as string
		this.mongoPassword = process.env.MONGO_PWD as string
		this.mongoCluster = process.env.MONGO_CLUSTER as string
		this.mongoDb=process.env.MONGO_DB as string
		this.img = process.env.IMG as string
	}
}