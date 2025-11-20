// ==================== services/parkingService.js ====================
import { prisma } from '../config/database.js';
import {
    SpotNotFoundError,
    SpotNotAvailableError,
    InvalidFloorError,
    DuplicateSpotError
} from '../utils/errorHandler.js';
import { SPOT_STATUS, SPOT_TYPE, PARKING_CONFIG } from '../config/constants.js';

/**
 * ParkingService - Handles all parking spot operations
 */
class ParkingService {
    /**
     * Register a new parking spot
     * @param {Object} spotData - Spot data
     * @returns {Promise<Object>} Created parking spot
     */
    async registerSpot({ spotNumber, floor, type = SPOT_TYPE.STANDARD, status = SPOT_STATUS.AVAILABLE }) {
        // Validate floor
        if (floor < 1 || floor > PARKING_CONFIG.TOTAL_FLOORS) {
            throw new InvalidFloorError(floor);
        }

        // Check if spot already exists
        const existingSpot = await prisma.parkingSpot.findUnique({
            where: { spotNumber }
        });

        if (existingSpot) {
            throw new DuplicateSpotError(spotNumber);
        }

        // Create the spot
        const spot = await prisma.parkingSpot.create({
            data: {
                spotNumber,
                floor,
                type,
                status
            }
        });

        return spot;
    }

    /**
     * Get parking spot by ID
     * @param {number} spotId - Spot ID
     * @returns {Promise<Object>} Parking spot
     */
    async getSpotById(spotId) {
        const spot = await prisma.parkingSpot.findUnique({
            where: { id: spotId },
            include: {
                reservations: {
                    where: { status: 'ACTIVE' },
                    include: { vehicle: true }
                }
            }
        });

        if (!spot) {
            throw new SpotNotFoundError(spotId);
        }

        return spot;
    }

    /**
     * Get parking spot by spot number
     * @param {string} spotNumber - Spot number
     * @returns {Promise<Object>} Parking spot
     */
    async getSpotByNumber(spotNumber) {
        const spot = await prisma.parkingSpot.findUnique({
            where: { spotNumber },
            include: {
                reservations: {
                    where: { status: 'ACTIVE' },
                    include: { vehicle: true }
                }
            }
        });

        if (!spot) {
            throw new SpotNotFoundError(spotNumber);
        }

        return spot;
    }

    /**
     * Get available parking spots
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Available spots
     */
    async getAvailableSpots({ floor = null, type = null } = {}) {
        const where = {
            status: SPOT_STATUS.AVAILABLE
        };

        if (floor !== null) {
            if (floor < 1 || floor > PARKING_CONFIG.TOTAL_FLOORS) {
                throw new InvalidFloorError(floor);
            }
            where.floor = floor;
        }

        if (type !== null) {
            where.type = type;
        }

        const spots = await prisma.parkingSpot.findMany({
            where,
            orderBy: [
                { floor: 'asc' },
                { spotNumber: 'asc' }
            ]
        });

        return spots;
    }

    /**
     * Update parking spot status
     * @param {number} spotId - Spot ID
     * @param {string} status - New status
     * @returns {Promise<Object>} Updated spot
     */
    async updateSpotStatus(spotId, status) {
        // Verify spot exists
        await this.getSpotById(spotId);

        const updatedSpot = await prisma.parkingSpot.update({
            where: { id: spotId },
            data: { status }
        });

        return updatedSpot;
    }

    /**
     * Get all parking spots with optional filters
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Parking spots
     */
    async getAllSpots({ floor = null, status = null, type = null } = {}) {
        const where = {};

        if (floor !== null) {
            if (floor < 1 || floor > PARKING_CONFIG.TOTAL_FLOORS) {
                throw new InvalidFloorError(floor);
            }
            where.floor = floor;
        }

        if (status !== null) {
            where.status = status;
        }

        if (type !== null) {
            where.type = type;
        }

        const spots = await prisma.parkingSpot.findMany({
            where,
            include: {
                reservations: {
                    where: { status: 'ACTIVE' },
                    include: { vehicle: true }
                }
            },
            orderBy: [
                { floor: 'asc' },
                { spotNumber: 'asc' }
            ]
        });

        return spots;
    }

    /**
     * Get parking statistics
     * @returns {Promise<Object>} Statistics
     */
    async getStatistics() {
        const [total, available, occupied, reserved, maintenance] = await Promise.all([
            prisma.parkingSpot.count(),
            prisma.parkingSpot.count({ where: { status: SPOT_STATUS.AVAILABLE } }),
            prisma.parkingSpot.count({ where: { status: SPOT_STATUS.OCCUPIED } }),
            prisma.parkingSpot.count({ where: { status: SPOT_STATUS.RESERVED } }),
            prisma.parkingSpot.count({ where: { status: SPOT_STATUS.MAINTENANCE } })
        ]);

        // Get statistics by floor
        const floorStats = [];
        for (let floor = 1; floor <= PARKING_CONFIG.TOTAL_FLOORS; floor++) {
            const [floorTotal, floorAvailable, floorOccupied] = await Promise.all([
                prisma.parkingSpot.count({ where: { floor } }),
                prisma.parkingSpot.count({ where: { floor, status: SPOT_STATUS.AVAILABLE } }),
                prisma.parkingSpot.count({ where: { floor, status: SPOT_STATUS.OCCUPIED } })
            ]);

            floorStats.push({
                floor,
                total: floorTotal,
                available: floorAvailable,
                occupied: floorOccupied,
                occupancyRate: floorTotal > 0 ? ((floorOccupied / floorTotal) * 100).toFixed(2) : 0
            });
        }

        // Get statistics by type
        const typeStats = await Promise.all(
            Object.values(SPOT_TYPE).map(async (type) => {
                const count = await prisma.parkingSpot.count({ where: { type } });
                const availableCount = await prisma.parkingSpot.count({
                    where: { type, status: SPOT_STATUS.AVAILABLE }
                });
                return {
                    type,
                    total: count,
                    available: availableCount
                };
            })
        );

        return {
            overall: {
                total,
                available,
                occupied,
                reserved,
                maintenance,
                occupancyRate: total > 0 ? ((occupied / total) * 100).toFixed(2) : 0
            },
            byFloor: floorStats,
            byType: typeStats
        };
    }

    /**
     * Delete a parking spot
     * @param {number} spotId - Spot ID
     * @returns {Promise<Object>} Deleted spot
     */
    async deleteSpot(spotId) {
        // Verify spot exists
        await this.getSpotById(spotId);

        const deletedSpot = await prisma.parkingSpot.delete({
            where: { id: spotId }
        });

        return deletedSpot;
    }
}

export default new ParkingService();
