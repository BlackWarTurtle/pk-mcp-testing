// ==================== services/reservationService.js ====================
import { prisma } from '../config/database.js';
import {
    ReservationNotFoundError,
    SpotNotAvailableError
} from '../utils/errorHandler.js';
import { SPOT_STATUS, RESERVATION_STATUS } from '../config/constants.js';
import parkingService from './parkingService.js';
import vehicleService from './vehicleService.js';

/**
 * ReservationService - Handles all reservation operations
 */
class ReservationService {
    /**
     * Create a new reservation
     * @param {Object} reservationData - Reservation data
     * @returns {Promise<Object>} Created reservation
     */
    async createReservation({ spotNumber, licensePlate, ownerName = null, ownerPhone = null, vehicleType = null }) {
        // Get or create vehicle
        const vehicle = await vehicleService.getOrCreateVehicle({
            licensePlate,
            ownerName,
            ownerPhone,
            vehicleType
        });

        // Get spot by number
        const spot = await parkingService.getSpotByNumber(spotNumber);

        // Check if spot is available
        if (spot.status !== SPOT_STATUS.AVAILABLE) {
            throw new SpotNotAvailableError(spotNumber);
        }

        // Create reservation and update spot status in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create reservation
            const reservation = await tx.reservation.create({
                data: {
                    spotId: spot.id,
                    vehicleId: vehicle.id,
                    status: RESERVATION_STATUS.ACTIVE
                },
                include: {
                    spot: true,
                    vehicle: true
                }
            });

            // Update spot status to OCCUPIED
            await tx.parkingSpot.update({
                where: { id: spot.id },
                data: { status: SPOT_STATUS.OCCUPIED }
            });

            return reservation;
        });

        return result;
    }

    /**
     * Release a reservation (end parking)
     * @param {string} spotNumber - Spot number
     * @returns {Promise<Object>} Completed reservation
     */
    async releaseReservation(spotNumber) {
        // Get spot
        const spot = await parkingService.getSpotByNumber(spotNumber);

        // Find active reservation for this spot
        const activeReservation = await prisma.reservation.findFirst({
            where: {
                spotId: spot.id,
                status: RESERVATION_STATUS.ACTIVE
            },
            include: {
                spot: true,
                vehicle: true
            }
        });

        if (!activeReservation) {
            throw new ReservationNotFoundError(`No active reservation for spot ${spotNumber}`);
        }

        // Complete reservation and update spot status in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update reservation
            const reservation = await tx.reservation.update({
                where: { id: activeReservation.id },
                data: {
                    status: RESERVATION_STATUS.COMPLETED,
                    endTime: new Date()
                },
                include: {
                    spot: true,
                    vehicle: true
                }
            });

            // Update spot status to AVAILABLE
            await tx.parkingSpot.update({
                where: { id: spot.id },
                data: { status: SPOT_STATUS.AVAILABLE }
            });

            return reservation;
        });

        return result;
    }

    /**
     * Get reservation by ID
     * @param {number} reservationId - Reservation ID
     * @returns {Promise<Object>} Reservation
     */
    async getReservationById(reservationId) {
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: {
                spot: true,
                vehicle: true
            }
        });

        if (!reservation) {
            throw new ReservationNotFoundError(reservationId);
        }

        return reservation;
    }

    /**
     * Get all active reservations
     * @returns {Promise<Array>} Active reservations
     */
    async getActiveReservations() {
        const reservations = await prisma.reservation.findMany({
            where: { status: RESERVATION_STATUS.ACTIVE },
            include: {
                spot: true,
                vehicle: true
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        return reservations;
    }

    /**
     * Get reservation history
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Reservation history
     */
    async getReservationHistory({ status = null, limit = 100 } = {}) {
        const where = {};

        if (status !== null) {
            where.status = status;
        }

        const reservations = await prisma.reservation.findMany({
            where,
            include: {
                spot: true,
                vehicle: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        return reservations;
    }

    /**
     * Cancel a reservation
     * @param {number} reservationId - Reservation ID
     * @returns {Promise<Object>} Cancelled reservation
     */
    async cancelReservation(reservationId) {
        const reservation = await this.getReservationById(reservationId);

        // Can only cancel active reservations
        if (reservation.status !== RESERVATION_STATUS.ACTIVE) {
            throw new Error('Can only cancel active reservations');
        }

        // Cancel reservation and update spot status in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update reservation
            const updatedReservation = await tx.reservation.update({
                where: { id: reservationId },
                data: {
                    status: RESERVATION_STATUS.CANCELLED,
                    endTime: new Date()
                },
                include: {
                    spot: true,
                    vehicle: true
                }
            });

            // Update spot status to AVAILABLE
            await tx.parkingSpot.update({
                where: { id: reservation.spotId },
                data: { status: SPOT_STATUS.AVAILABLE }
            });

            return updatedReservation;
        });

        return result;
    }

    /**
     * Get current reservation for a vehicle
     * @param {string} licensePlate - License plate
     * @returns {Promise<Object|null>} Current reservation or null
     */
    async getCurrentReservationByVehicle(licensePlate) {
        const vehicle = await vehicleService.getVehicleByPlate(licensePlate);

        const reservation = await prisma.reservation.findFirst({
            where: {
                vehicleId: vehicle.id,
                status: RESERVATION_STATUS.ACTIVE
            },
            include: {
                spot: true,
                vehicle: true
            }
        });

        return reservation;
    }
}

export default new ReservationService();
