// ==================== src/server.js ====================
import 'dotenv/config';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerParkingTools } from './tools/parkingTools.js';
import dbClient from './config/database.js';

/**
 * ParkingMcpServer - Main server class for the Parking MCP Server
 * Handles server lifecycle, tool registration, and graceful shutdown
 */
class ParkingMcpServer {
    constructor(config = {}) {
        this.config = {
            name: config.name || "Parking MCP Server",
            version: config.version || "1.0.0"
        };
        this.server = null;
        this.transport = null;
        this.isRunning = false;
    }

    /**
     * Initialize the MCP server instance
     */
    initializeServer() {
        this.server = new Server({
            name: this.config.name,
            version: this.config.version
        }, {
            capabilities: {
                tools: {}
            }
        });
    }

    /**
     * Register all tools with the server
     */
    registerTools() {
        if (!this.server) {
            throw new Error("Server must be initialized before registering tools");
        }
        registerParkingTools(this.server);
    }

    /**
     * Start the server and connect to transport
     */
    async start() {
        try {
            // Connect to database first
            await dbClient.connect();

            this.initializeServer();
            this.registerTools();

            this.transport = new StdioServerTransport();
            await this.server.connect(this.transport);

            this.isRunning = true;
            this.setupGracefulShutdown();

        } catch (error) {
            console.error("❌ Failed to start server:", error);
            throw error;
        }
    }

    /**
     * Setup graceful shutdown handlers
     */
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            await this.stop();
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }

    /**
     * Stop the server gracefully
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }

        try {

            // Disconnect from database
            await dbClient.disconnect();

            if (this.server) {
                await this.server.close();
            }

            this.isRunning = false;
        } catch (error) {
            throw error;
        }
    }
}

// Main execution
async function main() {
    const server = new ParkingMcpServer();

    try {
        await server.start();
    } catch (error) {
        process.exit(1);
    }
}

main();