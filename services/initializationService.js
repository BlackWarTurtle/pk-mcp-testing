// ==================== services/initializationService.js ====================
import { prisma } from '../config/database.js';
import { PARKING_CONFIG, SPOT_TYPE, SPOT_STATUS, generateSpotNumber } from '../config/constants.js';

/**
 * InitializationService - Handles database initialization and seeding
 */
class InitializationService {
    /**
     * Initialize parking spots (300 spots across 3 floors)
     * @returns {Promise<Object>} Initialization result
     */
    async initializeParkingSpots() {

        const spotsToCreate = [];

        // Generate spots for each floor
        for (let floor = 1; floor <= PARKING_CONFIG.TOTAL_FLOORS; floor++) {
            for (let position = 1; position <= PARKING_CONFIG.SPOTS_PER_FLOOR; position++) {
                const spotNumber = generateSpotNumber(floor, position);

                // Determine spot type based on position
                let type = SPOT_TYPE.STANDARD;

                // First 5 spots on each floor are for disabled
                if (position <= 5) {
                    type = SPOT_TYPE.DISABLED;
                }
                // Next 10 spots are electric
                else if (position <= 15) {
                    type = SPOT_TYPE.ELECTRIC;
                }
                // Next 5 spots are VIP
                else if (position <= 20) {
                    type = SPOT_TYPE.VIP;
                }
                // Rest are standard

                spotsToCreate.push({
                    spotNumber,
                    floor,
                    type,
                    status: SPOT_STATUS.AVAILABLE
                });
            }
        }

        // Check if spots already exist
        const existingCount = await prisma.parkingSpot.count();

        if (existingCount > 0) {
            return {
                success: false,
                message: `Database already has ${existingCount} spots. Use resetDatabase() to reinitialize.`,
                existingCount
            };
        }

        // Create all spots in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const createdSpots = await tx.parkingSpot.createMany({
                data: spotsToCreate,
                skipDuplicates: true
            });

            return createdSpots;
        });


        // Get statistics
        const stats = await this.getInitializationStats();

        return {
            success: true,
            message: `Successfully initialized ${result.count} parking spots`,
            created: result.count,
            stats
        };
    }

    /**
     * Get initialization statistics
     * @returns {Promise<Object>} Statistics
     */
    async getInitializationStats() {
        const [total, byType, byFloor] = await Promise.all([
            prisma.parkingSpot.count(),
            prisma.parkingSpot.groupBy({
                by: ['type'],
                _count: true
            }),
            prisma.parkingSpot.groupBy({
                by: ['floor'],
                _count: true
            })
        ]);

        return {
            total,
            byType: byType.map(item => ({
                type: item.type,
                count: item._count
            })),
            byFloor: byFloor.map(item => ({
                floor: item.floor,
                count: item._count
            }))
        };
    }

    /**
     * Reset database (delete all data and reinitialize)
     * @returns {Promise<Object>} Reset result
     */
    async resetDatabase() {

        // Delete all data in correct order (respecting foreign keys)
        await prisma.$transaction(async (tx) => {
            await tx.reservation.deleteMany();
            await tx.vehicle.deleteMany();
            await tx.parkingSpot.deleteMany();
        });


        // Reinitialize spots
        return await this.initializeParkingSpots();
    }

    /**
     * Check database status
     * @returns {Promise<Object>} Database status
     */
    async getDatabaseStatus() {
        const [spotCount, vehicleCount, reservationCount, activeReservations] = await Promise.all([
            prisma.parkingSpot.count(),
            prisma.vehicle.count(),
            prisma.reservation.count(),
            prisma.reservation.count({ where: { status: 'ACTIVE' } })
        ]);

        return {
            initialized: spotCount > 0,
            spots: spotCount,
            vehicles: vehicleCount,
            totalReservations: reservationCount,
            activeReservations
        };
    }

    /**
     * Seed sample data for testing
     * @returns {Promise<Object>} Seed result
     */
    async seedSampleData() {

        // Ensure parking spots are initialized
        const status = await this.getDatabaseStatus();
        if (!status.initialized) {
            await this.initializeParkingSpots();
        }

        // Create sample vehicles
        const sampleVehicles = [
            { licensePlate: 'ABC123', ownerName: 'Juan Pérez', ownerPhone: '+34600111222', vehicleType: 'sedan' },
            { licensePlate: 'XYZ789', ownerName: 'María García', ownerPhone: '+34600333444', vehicleType: 'suv' },
            { licensePlate: 'DEF456', ownerName: 'Carlos López', ownerPhone: '+34600555666', vehicleType: 'motorcycle' }
        ];

        const vehicles = await Promise.all(
            sampleVehicles.map(v =>
                prisma.vehicle.upsert({
                    where: { licensePlate: v.licensePlate },
                    update: {},
                    create: v
                })
            )
        );


        return {
            success: true,
            message: 'Sample data seeded successfully',
            vehicles: vehicles.length
        };
    }
}

export default new InitializationService();
