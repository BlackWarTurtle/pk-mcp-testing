// ==================== tools/parkingTools.js ====================
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import parkingService from '../services/parkingService.js';
import reservationService from '../services/reservationService.js';
import vehicleService from '../services/vehicleService.js';
import initializationService from '../services/initializationService.js';
import { formatErrorForMCP } from '../utils/errorHandler.js';

/**
 * Define all available tools
 */
const tools = [
    {
        name: "initialize_parking",
        description: "Initialize the parking system with 300 spots across 3 floors. This should be run once when setting up the system.",
        inputSchema: {
            type: "object",
            properties: {},
            required: []
        }
    },
    {
        name: "get_database_status",
        description: "Get the current status of the parking database including spot count, vehicles, and reservations.",
        inputSchema: {
            type: "object",
            properties: {},
            required: []
        }
    },
    {
        name: "reset_database",
        description: "Reset the entire database by deleting all data and reinitializing the parking system. WARNING: This will delete all reservations and vehicles!",
        inputSchema: {
            type: "object",
            properties: {},
            required: []
        }
    },
    {
        name: "register_parking_spot",
        description: "Register a new parking spot in the system.",
        inputSchema: {
            type: "object",
            properties: {
                spotNumber: {
                    type: "string",
                    description: "Spot number (e.g., '1-001', '2-050')"
                },
                floor: {
                    type: "number",
                    description: "Floor number (1-3)"
                },
                type: {
                    type: "string",
                    description: "Spot type: STANDARD, DISABLED, ELECTRIC, or VIP"
                }
            },
            required: ["spotNumber", "floor"]
        }
    },
    {
        name: "get_available_spots",
        description: "Get all available parking spots. Optionally filter by floor or spot type.",
        inputSchema: {
            type: "object",
            properties: {
                floor: {
                    type: "number",
                    description: "Filter by floor number (1-3)"
                },
                type: {
                    type: "string",
                    description: "Filter by spot type: STANDARD, DISABLED, ELECTRIC, or VIP"
                }
            },
            required: []
        }
    },
    {
        name: "get_spot_status",
        description: "Get detailed status and information about a specific parking spot.",
        inputSchema: {
            type: "object",
            properties: {
                spotNumber: {
                    type: "string",
                    description: "Spot number (e.g., '1-001')"
                }
            },
            required: ["spotNumber"]
        }
    },
    {
        name: "list_all_spots",
        description: "List all parking spots in the system with optional filters for floor, status, or type.",
        inputSchema: {
            type: "object",
            properties: {
                floor: {
                    type: "number",
                    description: "Filter by floor number (1-3)"
                },
                status: {
                    type: "string",
                    description: "Filter by status: AVAILABLE, OCCUPIED, RESERVED, or MAINTENANCE"
                },
                type: {
                    type: "string",
                    description: "Filter by type: STANDARD, DISABLED, ELECTRIC, or VIP"
                }
            },
            required: []
        }
    },
    {
        name: "get_parking_statistics",
        description: "Get comprehensive statistics about parking occupancy, availability, and usage across all floors and spot types.",
        inputSchema: {
            type: "object",
            properties: {},
            required: []
        }
    },
    {
        name: "reserve_spot",
        description: "Reserve a parking spot for a vehicle. The vehicle will be registered if it doesn't exist.",
        inputSchema: {
            type: "object",
            properties: {
                spotNumber: {
                    type: "string",
                    description: "Spot number to reserve (e.g., '1-001')"
                },
                licensePlate: {
                    type: "string",
                    description: "Vehicle license plate"
                },
                ownerName: {
                    type: "string",
                    description: "Vehicle owner name"
                },
                ownerPhone: {
                    type: "string",
                    description: "Vehicle owner phone number"
                },
                vehicleType: {
                    type: "string",
                    description: "Vehicle type (e.g., sedan, suv, motorcycle)"
                }
            },
            required: ["spotNumber", "licensePlate"]
        }
    },
    {
        name: "release_spot",
        description: "Release a parking spot by ending the current reservation. The spot will become available again.",
        inputSchema: {
            type: "object",
            properties: {
                spotNumber: {
                    type: "string",
                    description: "Spot number to release (e.g., '1-001')"
                }
            },
            required: ["spotNumber"]
        }
    },
    {
        name: "get_active_reservations",
        description: "Get all currently active parking reservations.",
        inputSchema: {
            type: "object",
            properties: {},
            required: []
        }
    },
    {
        name: "register_vehicle",
        description: "Register a new vehicle in the parking system.",
        inputSchema: {
            type: "object",
            properties: {
                licensePlate: {
                    type: "string",
                    description: "Vehicle license plate"
                },
                ownerName: {
                    type: "string",
                    description: "Vehicle owner name"
                },
                ownerPhone: {
                    type: "string",
                    description: "Vehicle owner phone number"
                },
                vehicleType: {
                    type: "string",
                    description: "Vehicle type (e.g., sedan, suv, motorcycle)"
                }
            },
            required: ["licensePlate"]
        }
    },
    {
        name: "get_vehicle_info",
        description: "Get detailed information about a vehicle including its parking history.",
        inputSchema: {
            type: "object",
            properties: {
                licensePlate: {
                    type: "string",
                    description: "Vehicle license plate"
                }
            },
            required: ["licensePlate"]
        }
    }
];

/**
 * Handle tool execution
 */
async function handleToolCall(name, args) {
    try {
        switch (name) {
            case "initialize_parking":
                return await initializationService.initializeParkingSpots();

            case "get_database_status":
                return await initializationService.getDatabaseStatus();

            case "reset_database":
                return await initializationService.resetDatabase();

            case "register_parking_spot":
                return await parkingService.registerSpot({
                    spotNumber: args.spotNumber,
                    floor: args.floor,
                    type: args.type || 'STANDARD'
                });

            case "get_available_spots":
                const availableSpots = await parkingService.getAvailableSpots({
                    floor: args.floor || null,
                    type: args.type || null
                });
                return {
                    count: availableSpots.length,
                    spots: availableSpots
                };

            case "get_spot_status":
                return await parkingService.getSpotByNumber(args.spotNumber);

            case "list_all_spots":
                const allSpots = await parkingService.getAllSpots({
                    floor: args.floor || null,
                    status: args.status || null,
                    type: args.type || null
                });
                return {
                    count: allSpots.length,
                    spots: allSpots
                };

            case "get_parking_statistics":
                return await parkingService.getStatistics();

            case "reserve_spot":
                return await reservationService.createReservation({
                    spotNumber: args.spotNumber,
                    licensePlate: args.licensePlate,
                    ownerName: args.ownerName,
                    ownerPhone: args.ownerPhone,
                    vehicleType: args.vehicleType
                });

            case "release_spot":
                return await reservationService.releaseReservation(args.spotNumber);

            case "get_active_reservations":
                const activeReservations = await reservationService.getActiveReservations();
                return {
                    count: activeReservations.length,
                    reservations: activeReservations
                };

            case "register_vehicle":
                return await vehicleService.registerVehicle({
                    licensePlate: args.licensePlate,
                    ownerName: args.ownerName,
                    ownerPhone: args.ownerPhone,
                    vehicleType: args.vehicleType
                });

            case "get_vehicle_info":
                return await vehicleService.getVehicleByPlate(args.licensePlate);

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        throw error;
    }
}

/**
 * Register all parking-related MCP tools
 * @param {Server} server - MCP server instance
 */
export function registerParkingTools(server) {
    // Register list tools handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return { tools };
    });

    // Register call tool handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        try {
            const result = await handleToolCall(name, args || {});
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(formatErrorForMCP(error), null, 2)
                    }
                ],
                isError: true
            };
        }
    });

}