# MatchFlow (FirstWave Innovator Hackathon)

MatchFlow is a graph-based social matching prototype built for the FirstWave Innovator Hackathon. The project leverages Neo4j, OpenAI embeddings, Diffbot, and Google Maps API to match users based on shared interests, complementary traits, and proximity.

### Hackathon Context
This project was originally built as part of a hackathon challenge for Ripl, an app idea focused on helping people make meaningful real-life connections. Our team built this as a proof of concept.

## Features
- **AI-Powered Similarity (OpenAI Embeddings + Cosine Similarity)** – Finds best user matches based on meaning, not just keywords.
- **Diffbot Data Enrichment** – Scrapes additional user profile information and integrates it into the matching process.
- **Smart Location-Based Meetup Suggestions (Google Maps API)** – Suggests public places between matched users.
- **Graph Storage (Neo4j)** – Stores user data and potential relationships.
- **Next.js Frontend** – A clean UI for signing up, filling out a survey, and viewing matches.

## Tech Stack
- **Next.js (React)** – Frontend
- **Neo4j Aura** – Stores user data and relationships
- **OpenAI Embeddings API** – Generates vector representations for text-based survey responses
- **Cosine Similarity Algorithm** – Computes match scores
- **Diffbot API** – Enriches user profiles with web-scraped data
- **Google Maps API** – Suggests meetup locations
- **Tailwind CSS** – Styling

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v18 or higher)
- npm or yarn
- Neo4j Database (local or cloud instance)
- Google Maps API key

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/jaygiang/matchflow.git
cd matchflow
```

2. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

3. Configure your environment variables in `.env.local`:
```
NEO4J_URI=your_neo4j_uri
NEO4J_USER=your_neo4j_username
NEO4J_PASSWORD=your_neo4j_password
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
OPENAI_API_KEY=your_open_api_key
DIFFBOT_API_TOKEN=your_diffbot_api_key
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
```

The application will be available at `http://localhost:3000`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
