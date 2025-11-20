// ==================== config/constants.js ====================

/**
 * System-wide constants for the parking management system
 */

export const PARKING_CONFIG = {
    TOTAL_FLOORS: 3,
    SPOTS_PER_FLOOR: 100,
    TOTAL_SPOTS: 300
};

export const SPOT_STATUS = {
    AVAILABLE: 'AVAILABLE',
    OCCUPIED: 'OCCUPIED',
    RESERVED: 'RESERVED',
    MAINTENANCE: 'MAINTENANCE'
};

export const SPOT_TYPE = {
    STANDARD: 'STANDARD',
    DISABLED: 'DISABLED',
    ELECTRIC: 'ELECTRIC',
    VIP: 'VIP'
};

export const RESERVATION_STATUS = {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
};

/**
 * Generate spot number from floor and position
 * @param {number} floor - Floor number (1-3)
 * @param {number} position - Position on floor (1-100)
 * @returns {string} Formatted spot number (e.g., "1-001")
 */
export function generateSpotNumber(floor, position) {
    return `${floor}-${String(position).padStart(3, '0')}`;
}

/**
 * Parse spot number into floor and position
 * @param {string} spotNumber - Spot number (e.g., "1-001")
 * @returns {{floor: number, position: number}}
 */
export function parseSpotNumber(spotNumber) {
    const [floor, position] = spotNumber.split('-');
    return {
        floor: parseInt(floor),
        position: parseInt(position)
    };
}
