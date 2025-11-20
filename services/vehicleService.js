// ==================== services/vehicleService.js ====================
import { prisma } from '../config/database.js';
import { VehicleNotFoundError, DuplicateVehicleError } from '../utils/errorHandler.js';

/**
 * VehicleService - Handles all vehicle-related operations
 */
class VehicleService {
    /**
     * Register a new vehicle
     * @param {Object} vehicleData - Vehicle data
     * @returns {Promise<Object>} Created vehicle
     */
    async registerVehicle({ licensePlate, ownerName = null, ownerPhone = null, vehicleType = null }) {
        // Normalize license plate (uppercase, no spaces)
        const normalizedPlate = licensePlate.toUpperCase().replace(/\s/g, '');

        // Check if vehicle already exists
        const existingVehicle = await prisma.vehicle.findUnique({
            where: { licensePlate: normalizedPlate }
        });

        if (existingVehicle) {
            throw new DuplicateVehicleError(normalizedPlate);
        }

        // Create the vehicle
        const vehicle = await prisma.vehicle.create({
            data: {
                licensePlate: normalizedPlate,
                ownerName,
                ownerPhone,
                vehicleType
            }
        });

        return vehicle;
    }

    /**
     * Get vehicle by license plate
     * @param {string} licensePlate - License plate
     * @returns {Promise<Object>} Vehicle
     */
    async getVehicleByPlate(licensePlate) {
        const normalizedPlate = licensePlate.toUpperCase().replace(/\s/g, '');

        const vehicle = await prisma.vehicle.findUnique({
            where: { licensePlate: normalizedPlate },
            include: {
                reservations: {
                    include: {
                        spot: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!vehicle) {
            throw new VehicleNotFoundError(normalizedPlate);
        }

        return vehicle;
    }

    /**
     * Get vehicle by ID
     * @param {number} vehicleId - Vehicle ID
     * @returns {Promise<Object>} Vehicle
     */
    async getVehicleById(vehicleId) {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            include: {
                reservations: {
                    include: {
                        spot: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!vehicle) {
            throw new VehicleNotFoundError(vehicleId);
        }

        return vehicle;
    }

    /**
     * Update vehicle information
     * @param {string} licensePlate - License plate
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated vehicle
     */
    async updateVehicle(licensePlate, updateData) {
        const normalizedPlate = licensePlate.toUpperCase().replace(/\s/g, '');

        // Verify vehicle exists
        await this.getVehicleByPlate(normalizedPlate);

        const updatedVehicle = await prisma.vehicle.update({
            where: { licensePlate: normalizedPlate },
            data: updateData
        });

        return updatedVehicle;
    }

    /**
     * Get all vehicles
     * @returns {Promise<Array>} All vehicles
     */
    async getAllVehicles() {
        const vehicles = await prisma.vehicle.findMany({
            include: {
                reservations: {
                    where: { status: 'ACTIVE' },
                    include: { spot: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return vehicles;
    }

    /**
     * Get vehicle parking history
     * @param {string} licensePlate - License plate
     * @returns {Promise<Array>} Reservation history
     */
    async getVehicleHistory(licensePlate) {
        const vehicle = await this.getVehicleByPlate(licensePlate);
        return vehicle.reservations;
    }

    /**
     * Delete a vehicle
     * @param {string} licensePlate - License plate
     * @returns {Promise<Object>} Deleted vehicle
     */
    async deleteVehicle(licensePlate) {
        const normalizedPlate = licensePlate.toUpperCase().replace(/\s/g, '');

        // Verify vehicle exists
        await this.getVehicleByPlate(normalizedPlate);

        const deletedVehicle = await prisma.vehicle.delete({
            where: { licensePlate: normalizedPlate }
        });

        return deletedVehicle;
    }

    /**
     * Get or create vehicle (upsert)
     * @param {Object} vehicleData - Vehicle data
     * @returns {Promise<Object>} Vehicle
     */
    async getOrCreateVehicle({ licensePlate, ownerName = null, ownerPhone = null, vehicleType = null }) {
        const normalizedPlate = licensePlate.toUpperCase().replace(/\s/g, '');

        try {
            // Try to get existing vehicle
            return await this.getVehicleByPlate(normalizedPlate);
        } catch (error) {
            if (error instanceof VehicleNotFoundError) {
                // Create new vehicle if not found
                return await this.registerVehicle({
                    licensePlate: normalizedPlate,
                    ownerName,
                    ownerPhone,
                    vehicleType
                });
            }
            throw error;
        }
    }
}

export default new VehicleService();
