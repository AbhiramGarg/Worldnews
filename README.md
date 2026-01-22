# WorldNews

A full-stack news application built with Next.js, Prisma, and PostgreSQL.

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 22+ (for local development)

### Running with Docker (Recommended)

**Prerequisites**: Make sure Docker Desktop is running on your system.

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WorldNews
   ```

2. **Start the application**
   ```bash
   # Option 1: Using batch file (Windows)
   start-docker.bat

   # Option 2: Using docker-compose directly
   docker-compose up --build -d
   ```

   This will:
   - Start a PostgreSQL database on port 5432
   - Build and start the Next.js application on port 3000
   - Run database migrations automatically

3. **Access the application**
   - Frontend: http://localhost:3000
   - Database: localhost:5432 (accessible from host)

4. **View logs**
   ```bash
   docker-compose logs -f
   ```

5. **Stop services**
   ```bash
   # Option 1: Using batch file (Windows)
   stop-docker.bat

   # Option 2: Using docker-compose directly
   docker-compose down
   ```

### Local Development

1. **Install dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Set up PostgreSQL**
   - Install PostgreSQL locally
   - Create database: `worldnews_dev`
   - Update `.env` with your database URL

3. **Run database migrations**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Testing

Run the test scripts to verify database connectivity:

```bash
# Insert test data
npx tsx test/seed.mjs

# Fetch test data
npx tsx test/test-fetch.ts
```

## Project Structure

- `client/` - Next.js frontend application
- `client/prisma/` - Database schema and migrations
- `client/test/` - Database testing scripts
- `docker-compose.yml` - Docker orchestration
- `client/Dockerfile` - Next.js container configuration

## Technologies Used

- **Frontend**: Next.js 16, React 19, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Containerization**: Docker & Docker Compose