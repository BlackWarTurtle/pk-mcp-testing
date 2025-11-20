// ==================== config/database.js ====================
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton
 * Ensures only one instance of PrismaClient exists throughout the application
 */
class DatabaseClient {
    constructor() {
        if (DatabaseClient.instance) {
            return DatabaseClient.instance;
        }

        this.prisma = new PrismaClient({
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'error', 'warn']
                : ['error'],
        });

        DatabaseClient.instance = this;
    }

    /**
     * Get the Prisma client instance
     * @returns {PrismaClient}
     */
    getClient() {
        return this.prisma;
    }

    /**
     * Connect to the database
     */
    async connect() {
        try {
            await this.prisma.$connect();
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            throw error;
        }
    }

    /**
     * Disconnect from the database
     */
    async disconnect() {
        try {
            await this.prisma.$disconnect();
        } catch (error) {
            console.error('❌ Database disconnection failed:', error);
            throw error;
        }
    }

    /**
     * Health check - verify database connection
     */
    async healthCheck() {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            console.error('❌ Database health check failed:', error);
            return false;
        }
    }
}

// Export singleton instance
const dbClient = new DatabaseClient();
export const prisma = dbClient.getClient();
export default dbClient;
