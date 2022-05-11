#!/usr/bin/env node

import dotenv from 'dotenv'
dotenv.config()

import jlinxHttpServer from '../index.js'
jlinxHttpServer.start()
