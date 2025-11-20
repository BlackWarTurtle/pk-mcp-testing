// ==================== utils/errorHandler.js ====================

/**
 * Custom error classes for the parking management system
 */

export class ParkingError extends Error {
    constructor(message, code = 'PARKING_ERROR') {
        super(message);
        this.name = 'ParkingError';
        this.code = code;
    }
}

export class SpotNotFoundError extends ParkingError {
    constructor(spotId) {
        super(`Parking spot not found: ${spotId}`, 'SPOT_NOT_FOUND');
        this.name = 'SpotNotFoundError';
    }
}

export class SpotNotAvailableError extends ParkingError {
    constructor(spotNumber) {
        super(`Parking spot ${spotNumber} is not available`, 'SPOT_NOT_AVAILABLE');
        this.name = 'SpotNotAvailableError';
    }
}

export class VehicleNotFoundError extends ParkingError {
    constructor(licensePlate) {
        super(`Vehicle not found: ${licensePlate}`, 'VEHICLE_NOT_FOUND');
        this.name = 'VehicleNotFoundError';
    }
}

export class ReservationNotFoundError extends ParkingError {
    constructor(reservationId) {
        super(`Reservation not found: ${reservationId}`, 'RESERVATION_NOT_FOUND');
        this.name = 'ReservationNotFoundError';
    }
}

export class InvalidFloorError extends ParkingError {
    constructor(floor) {
        super(`Invalid floor number: ${floor}. Must be between 1 and 3`, 'INVALID_FLOOR');
        this.name = 'InvalidFloorError';
    }
}

export class DuplicateSpotError extends ParkingError {
    constructor(spotNumber) {
        super(`Parking spot ${spotNumber} already exists`, 'DUPLICATE_SPOT');
        this.name = 'DuplicateSpotError';
    }
}

export class DuplicateVehicleError extends ParkingError {
    constructor(licensePlate) {
        super(`Vehicle with license plate ${licensePlate} already exists`, 'DUPLICATE_VEHICLE');
        this.name = 'DuplicateVehicleError';
    }
}

/**
 * Format error for MCP response
 * @param {Error} error - The error to format
 * @returns {Object} Formatted error object
 */
export function formatErrorForMCP(error) {
    if (error instanceof ParkingError) {
        return {
            code: error.code,
            message: error.message,
            isOperational: true
        };
    }

    // Unknown error
    return {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
        isOperational: false
    };
}

/**
 * Wrap async function with error handling
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
export function asyncErrorHandler(fn) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            console.error('Error in async operation:', error);
            throw error;
        }
    };
}
