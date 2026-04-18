# Sui Teaching Platform - Database Setup with Docker

## Port Configuration
Since port 5432 is already in use, we'll use **port 5433** for this PostgreSQL container.

## Quick Start

### 1. Start the Docker Container

```bash
# Navigate to backend folder
cd backend

# Build and start the container
docker-compose up -d

# Check if container is running
docker ps
```

### 2. Import Database Schema

**Option A: Using TablePlus**
1. Open TablePlus
2. Create a new connection:
   - Host: `localhost`
   - Port: `5433` (NOT 5432!)
   - Database: `sui_teaching`
   - User: `postgres`
   - Password: `password`
3. Connect to the database
4. Open SQL Editor
5. Copy and paste contents of `init.sql`
6. Run the SQL

**Option B: Using Command Line**
```bash
# Copy init.sql into container
docker cp init.sql sui-teaching-db:/init.sql

# Execute the SQL file
docker exec -it sui-teaching-db psql -U postgres -d sui_teaching -f /init.sql
```

### 3. Verify Database

```bash
# Connect to PostgreSQL
docker exec -it sui-teaching-db psql -U postgres -d sui_teaching

# List tables
\dt

# Check tables
SELECT * FROM user_profiles;
SELECT * FROM courses;
```

### 4. Generate Sequelize Models (After tables are created)

```bash
# Install sequelize-auto globally if not already installed
npm install -g sequelize-auto

# Install pg driver for sequelize-auto
npm install -g pg

# Generate models from existing database
sequelize-auto -h localhost -d sui_teaching -u postgres -x password -p 5433 --dialect postgres -o models/ --caseModel p --caseFile p --lang js

# The models will be generated in backend/models/ folder
```

## Container Details

| Setting | Value |
|---------|-------|
| Container Name | `sui-teaching-db` |
| Host Port | `5433` |
| Container Port | `5432` |
| Database | `sui_teaching` |
| Username | `postgres` |
| Password | `password` |
| Data Volume | `sui_teaching_data` |

## Useful Commands

```bash
# Stop container
docker-compose down

# Stop and remove volume (deletes all data!)
docker-compose down -v

# View logs
docker logs sui-teaching-db

# Restart container
docker-compose restart

# Connect to psql
docker exec -it sui-teaching-db psql -U postgres -d sui_teaching
```

## Environment Variables for Backend

Create a `.env` file in the backend folder:

```env
# Database (using port 5433)
DB_HOST=localhost
DB_PORT=5433
DB_NAME=sui_teaching
DB_USER=postgres
DB_PASSWORD=password

# Server
PORT=3001
NODE_ENV=development

# Sui Blockchain
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
SUI_PACKAGE_ID=your_package_id_here
```
