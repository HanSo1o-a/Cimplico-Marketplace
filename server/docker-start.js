// Simple script to start the server in Docker environment
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname in ES module scope
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set global dirname variable that can be used in place of import.meta.dirname
global.__appDir = path.resolve(__dirname, '..');

// Start the server by importing the server entry point
import './dist/index.js';
