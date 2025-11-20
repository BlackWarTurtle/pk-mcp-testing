# 🅿️ Parking Management MCP Server

A comprehensive Model Context Protocol (MCP) server for managing a parking facility with 300 spots across 3 floors using PostgreSQL and Prisma ORM.

## 📋 Features

- **300 Parking Spots** distributed across 3 floors (100 spots per floor)
- **PostgreSQL Database** with Prisma ORM for reliable data persistence
- **Multiple Spot Types**: Standard, Disabled, Electric, and VIP
- **Vehicle Management**: Register and track vehicles with owner information
- **Reservation System**: Reserve and release parking spots with transaction safety
- **Real-time Statistics**: Get occupancy rates and availability by floor and type
- **12 MCP Tools** for comprehensive parking operations

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         MCP Tools Layer                 │
│  (12 tools for parking operations)     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Services Layer                  │
│  - ParkingService                       │
│  - ReservationService                   │
│  - VehicleService                       │
│  - InitializationService                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Database Layer                  │
│  - Prisma Client                        │
│  - PostgreSQL Database                  │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/BlackWarTurtle/pk-mcp-testing.git
   cd pk-mcp-testing
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the database connection:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/parking_db?schema=public"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   ```

5. **Start the server**
   ```bash
   npm start
   ```

## 🛠️ Available MCP Tools

### Initialization Tools

1. **`initialize_parking`** - Initialize 300 parking spots across 3 floors
2. **`get_database_status`** - Check database status and statistics
3. **`reset_database`** - Reset and reinitialize the entire system

### Parking Spot Tools

4. **`register_parking_spot`** - Manually register a new parking spot
5. **`get_available_spots`** - Query available spots with filters (floor, type)
6. **`get_spot_status`** - Get detailed information about a specific spot
7. **`list_all_spots`** - List all spots with optional filters
8. **`get_parking_statistics`** - Get comprehensive parking statistics

### Reservation Tools

9. **`reserve_spot`** - Reserve a parking spot for a vehicle
10. **`release_spot`** - Release a spot and end the parking session
11. **`get_active_reservations`** - List all active reservations

### Vehicle Tools

12. **`register_vehicle`** - Register a new vehicle in the system
13. **`get_vehicle_info`** - Get vehicle details and parking history

## 📊 Database Schema

### ParkingSpot
- Spot number (e.g., "1-001", "2-050")
- Floor (1-3)
- Status (AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE)
- Type (STANDARD, DISABLED, ELECTRIC, VIP)

### Vehicle
- License plate (unique)
- Owner name and phone
- Vehicle type

### Reservation
- Links vehicle to parking spot
- Start and end times
- Status (ACTIVE, COMPLETED, CANCELLED)

## 📝 Usage Examples

### Initialize the Parking System
```javascript
// Call the initialize_parking tool
// This creates 300 spots across 3 floors
```

### Reserve a Parking Spot
```javascript
// Call reserve_spot with:
{
  "spotNumber": "1-001",
  "licensePlate": "ABC123",
  "ownerName": "John Doe",
  "ownerPhone": "+34600111222",
  "vehicleType": "sedan"
}
```

### Get Available Spots on Floor 2
```javascript
// Call get_available_spots with:
{
  "floor": 2
}
```

### Release a Parking Spot
```javascript
// Call release_spot with:
{
  "spotNumber": "1-001"
}
```

### Get Parking Statistics
```javascript
// Call get_parking_statistics
// Returns overall stats, stats by floor, and stats by type
```

## 🗂️ Project Structure

```
pk-mcp-testing/
├── config/
│   ├── constants.js      # System constants and enums
│   └── database.js       # Prisma client singleton
├── prisma/
│   └── schema.prisma     # Database schema
├── services/
│   ├── parkingService.js       # Parking spot operations
│   ├── reservationService.js   # Reservation management
│   ├── vehicleService.js       # Vehicle tracking
│   └── initializationService.js # Database initialization
├── tools/
│   └── parkingTools.js   # MCP tool registrations
├── utils/
│   └── errorHandler.js   # Custom error classes
├── .env                  # Environment variables
├── .env.example          # Environment template
├── package.json          # Dependencies and scripts
├── server.js             # Main server entry point
└── README.md             # This file
```

## 🔧 Development

### Available Scripts

- `npm start` - Start the MCP server
- `npm run dev` - Start with auto-reload on file changes
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio (database GUI)

### Database Management

**View database in Prisma Studio:**
```bash
npm run db:studio
```

**Reset database:**
Use the `reset_database` MCP tool or manually:
```bash
npx prisma migrate reset
```

## 🎯 Spot Distribution

Each floor has 100 spots with the following distribution:
- **5 spots** for disabled parking (001-005)
- **10 spots** for electric vehicles (006-015)
- **5 spots** for VIP (016-020)
- **80 spots** standard parking (021-100)

Spot numbering format: `{Floor}-{Number}` (e.g., "1-001", "2-050", "3-100")

## 🔒 Error Handling

The system includes comprehensive error handling:
- `SpotNotFoundError` - Parking spot doesn't exist
- `SpotNotAvailableError` - Spot is already occupied
- `VehicleNotFoundError` - Vehicle not registered
- `InvalidFloorError` - Floor number out of range
- `DuplicateSpotError` - Spot already exists
- `DuplicateVehicleError` - Vehicle already registered

## 📄 License

ISC

## 👤 Author

BlackWarTurtle

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if this project helped you!
