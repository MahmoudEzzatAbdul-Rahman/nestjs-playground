# NestJS Modular Monolith

A NestJS modular monolith application with Kafka event streaming, Redis-backed BullMQ job processing, and PostgreSQL database.

## Features

- **Modular Monolith Architecture**: Clean separation of concerns with dedicated modules
- **Kafka Event Streaming**: Event-driven architecture with producer/consumer pattern
- **BullMQ Background Jobs**: Redis-powered job queue for async tasks (welcome emails)
- **PostgreSQL Database**: TypeORM integration with migrations
- **Swagger Documentation**: Auto-generated API documentation at `/api`
- **Validation**: Request validation with class-validator and class-transformer

## Architecture

- **UsersModule**: CRUD operations with TypeORM and Swagger
- **KafkaModule**: Event publishing on user create/update
- **KafkaConsumerModule**: Consumes user events and schedules BullMQ jobs
- **BullMQModule**: Background task scheduling for welcome emails
- **DatabaseModule**: TypeORM configuration and connection management

## Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
- npm or yarn

## Local Development Setup

### 1. Start Docker Containers

Pull and run the required Docker containers:

```bash
# Pull images
docker pull redis:8
docker pull postgres:17
docker pull apache/kafka:latest

# Run PostgreSQL
docker run -d \
  --name local-postgresql \
  --restart unless-stopped \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=app \
  -p 5432:5432 \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:17

# Run Redis
docker run -d \
  --name local-redis \
  --restart unless-stopped \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:8 redis-server --appendonly yes

# Run Kafka
docker run -d \
  --name local-kafka \
  --restart unless-stopped \
  -p 9092:9092 \
  -e KAFKA_NODE_ID=1 \
  -e KAFKA_PROCESS_ROLES=broker,controller \
  -e KAFKA_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER \
  -e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT \
  -e KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093 \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  -e KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1 \
  -e KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1 \
  -v kafka-data:/var/lib/kafka/data \
  apache/kafka:latest
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

The default values in `.env.example` match the Docker container setup above.

### 4. Run Database Migrations

```bash
# Generate initial migration (if not already done)
npm run migration:generate -- InitialCreate

# Run migrations
npm run migration:run
```

### 5. Start the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The application will start on `http://localhost:3000`.

## API Documentation

Once the application is running, access the Swagger UI at:
```
http://localhost:3000/api
```

## Testing the Application

### Create a User

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe"
  }'
```

This will:
1. Create the user in PostgreSQL
2. Publish a `USER_CREATED` event to Kafka
3. Kafka consumer receives the event
4. BullMQ welcome email job is scheduled
5. Welcome email job is processed

### Expected Logs

You should see the following log sequence:

```
[KAFKA PRODUCER] Publishing USER_CREATED event for user {id}
[KAFKA PRODUCER] Topic: users-events
[KAFKA PRODUCER] Event data: {...}
[KAFKA PRODUCER] USER_CREATED event published successfully
[KAFKA CONSUMER] Received event from topic: users-events
[KAFKA CONSUMER] Event type: USER_CREATED
[KAFKA CONSUMER] User ID: {id}
[KAFKA CONSUMER] Welcome email job scheduled for user {id}
[WelcomeEmailProcessor] Processing welcome email for user {id}
[WelcomeEmailProcessor] Welcome email sent successfully to {email}
```

## Available Scripts

```bash
# Development
npm run start              # Start application
npm run start:dev          # Start in watch mode
npm run start:debug        # Start in debug mode
npm run start:prod         # Start production build

# Database
npm run migration:generate # Generate a new migration
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run e2e tests
npm run test:cov           # Run tests with coverage

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
```

## Project Structure

```
src/
├── database/              # TypeORM configuration
│   ├── database.module.ts
│   └── data-source.ts
├── users/                 # Users module
│   ├── dto/              # Data transfer objects
│   ├── entities/         # TypeORM entities
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── kafka/                # Kafka producer module
│   ├── kafka.module.ts
│   └── kafka.service.ts
├── kafka-consumer/       # Kafka consumer module
│   ├── kafka-consumer.module.ts
│   └── kafka-consumer.controller.ts
├── bullmq/               # BullMQ module
│   ├── bullmq.module.ts
│   └── welcome-email.processor.ts
├── migrations/           # Database migrations
├── app.module.ts         # Root module
└── main.ts               # Application bootstrap
```

## Stopping Docker Containers

```bash
docker stop local-postgresql local-redis local-kafka
docker rm local-postgresql local-redis local-kafka
```

## License

MIT
