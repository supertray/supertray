// For more information about this file see https://dove.feathersjs.com/guides/cli/databases.html
import dotenv from 'dotenv';

dotenv.config();

/* eslint-disable import/first */
import { app } from './src/app';

// Load our database connection info from the app configuration
const config = app.get('postgresql');

export default config;
