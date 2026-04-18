# Sui Teaching Platform - Backend

## Project Structure

```
backend/
├── config/                 # Configuration files
│   ├── config.js          # Sequelize CLI config
│   ├── database.js        # Database connection
│   └── index.js           # App config
├── controllers/           # Request handlers
│   ├── userController.js
│   ├── courseController.js
│   ├── enrollmentController.js
│   ├── submissionController.js
│   └── resultController.js
├── models/                # Sequelize models
│   ├── index.js          # Model loader
│   ├── UserProfile.js
│   ├── Course.js
│   ├── ExamQuestion.js
│   ├── Enrollment.js
│   ├── Submission.js
│   └── Result.js
├── routes/               # API routes
│   └── index.js
├── services/             # Business logic
│   ├── userService.js
│   ├── courseService.js
│   ├── enrollmentService.js
│   ├── submissionService.js
│   └── resultService.js
├── utils/                # Utilities
│   └── websocket.js
├── scripts/              # Helper scripts
│   ├── init-db.js
│   ├── reset-db.js
│   └── sync-models.js
├── docker-compose.yml    # Docker setup
├── init.sql             # Database schema
├── .env.example         # Environment template
└── server.js            # Entry point
```

## Quick Start

### 1. Setup Environment

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your settings
# Note: DB_PORT is 5433 (not 5432 since it's taken)
```

### 2. Start PostgreSQL with Docker

```bash
# Start container on port 5433
docker-compose up -d

# Verify it's running
docker ps

# Check logs
docker logs sui-teaching-db
```

### 3. Initialize Database

**Option A: Using TablePlus**
1. Open TablePlus
2. Create new connection:
   - Host: `localhost`
   - Port: `5433` ⚠️ (NOT 5432!)
   - Database: `sui_teaching`
   - User: `postgres`
   - Password: `password`
3. Connect
4. Open SQL Editor
5. Copy contents of `init.sql`
6. Execute

**Option B: Command Line**
```bash
# Copy SQL to container
docker cp init.sql sui-teaching-db:/init.sql

# Execute
docker exec -it sui-teaching-db psql -U postgres -d sui_teaching -f /init.sql
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Server

```bash
# Development mode with auto-reload
npm run dev

# OR production mode
npm start
```

Server will start on `http://localhost:3001`

## Database Commands

```bash
# Initialize database (create tables)
npm run db:init

# Reset database (drop and recreate)
npm run db:reset

# Generate models from existing database
npm run db:sync
```

## API Endpoints

### Users
- `POST /api/users/register` - Register user with role
- `GET /api/users/:address` - Get user profile
- `GET /api/users/:address/role` - Get user role
- `PATCH /api/users/:address` - Update user profile

### Courses
- `POST /api/courses` - Create course
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `PATCH /api/courses/:id/status` - Update course status

### Exams
- `POST /api/courses/:id/exam` - Create exam questions
- `POST /api/courses/:id/start` - Start exam (teacher only)
- `GET /api/exams/:courseId/questions` - Get exam questions
- `GET /api/exams/:courseId/status` - Get exam status

### Enrollments
- `POST /api/courses/:course_id/enroll` - Enroll in course
- `GET /api/courses/:course_id/enrollments` - Get course enrollments
- `GET /api/courses/:course_id/enrollment-check` - Check if enrolled

### Submissions
- `POST /api/courses/:course_id/submit` - Submit answers
- `POST /api/courses/:course_id/auto-submit` - Auto-submit on deadline
- `GET /api/courses/:course_id/submissions` - Get submissions
- `GET /api/courses/:course_id/submission-check` - Check if submitted

### Results
- `POST /api/courses/:course_id/results` - Create results
- `GET /api/courses/:course_id/results` - Get results leaderboard
- `GET /api/courses/:course_id/my-rank` - Get student rank
- `PATCH /api/courses/:course_id/rewards` - Update rewards

## WebSocket Events

The server supports WebSocket connections for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3001');

// Subscribe to course updates
ws.send(JSON.stringify({
  type: 'subscribe',
  courseId: 1
}));

// Listen for events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'EXAM_STARTED') {
    console.log('Exam started!', data);
  }
};
```

### Event Types

- `EXAM_STARTED` - Teacher started the exam
- `SUBSCRIBED` - Subscription confirmation

## Docker Commands

```bash
# Start container
docker-compose up -d

# Stop container
docker-compose down

# Stop and remove data
docker-compose down -v

# View logs
docker logs sui-teaching-db

# Restart
docker-compose restart

# Connect to psql
docker exec -it sui-teaching-db psql -U postgres -d sui_teaching
```

## Troubleshooting

### Port 5433 already in use
Edit `docker-compose.yml` and change the host port:
```yaml
ports:
  - "5434:5432"  # Use 5434 instead
```
Then update `.env`:
```env
DB_PORT=5434
```

### Database connection refused
1. Check if Docker is running: `docker ps`
2. Verify port in `.env` matches docker-compose
3. Check firewall settings

### Sequelize sync errors
Run the reset script:
```bash
npm run db:reset
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | localhost | PostgreSQL host |
| DB_PORT | 5433 | PostgreSQL port |
| DB_NAME | sui_teaching | Database name |
| DB_USER | postgres | Database user |
| DB_PASSWORD | password | Database password |
| PORT | 3001 | Server port |
| NODE_ENV | development | Environment |
| CORS_ORIGIN | http://localhost:5173 | Frontend URL |
| SUI_RPC_URL | https://fullnode.testnet.sui.io:443 | Sui node URL |
| SUI_PACKAGE_ID | - | Deployed contract ID |
