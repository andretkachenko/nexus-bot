'use strict'

import { Bot } from './Bot'
import express from 'express'
import http from 'http'

const client: Bot = new Bot()
client.start()

const app = express()
const router = express.Router()

router.use((req, res, next) => {
	res.header('Access-Control-Allow-Methods', 'GET')
	next()
})

router.get('/health', (req, res) => {
	res.status(200).send('Ok')
})

app.use('/', router)

const server = http.createServer(app)
server.listen(3000)