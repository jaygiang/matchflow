# Coffee Meetup Spot Finder

A web application that helps users find the perfect coffee shop meetup location between two points. Built with Next.js, Google Maps API, and Neo4j.

## Features

- Find optimal coffee meetup locations between two zip codes
- View coffee shop ratings and details
- Interactive map visualization
- User matching system
- Survey-based preference matching

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v18 or higher)
- npm or yarn
- Neo4j Database (local or cloud instance)
- Google Maps API key

## Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Copy the example environment file:
```bash
cp .env.example .env.local
```

3. Configure your environment variables in `.env.local`:
```
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEO4J_URI=your_neo4j_uri
NEO4J_USER=your_neo4j_username
NEO4J_PASSWORD=your_neo4j_password
```

## Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Build the application:
```bash
npm run build
# or
yarn build
```

## Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

### Production Mode

```bash
npm run start
# or
yarn start
```

## Project Structure

```
├── public/          # Static assets
├── src/
│   ├── app/        # Next.js 13+ app directory
│   │   ├── api/    # API routes
│   │   ├── components/  # React components
│   │   └── lib/    # Utility functions
│   └── ...
```

## API Routes

- `/api/location` - Handles location-based coffee shop search
- `/api/match` - Handles user matching functionality
- `/api/createUser` - Handles user creation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Maps API for location services
- Neo4j for graph database functionality
- Next.js team for the amazing framework
