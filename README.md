# Pawan Kalyan

Founding engineer at Cortex building backend infrastructure and voice agents. This repository contains the source code for my personal portfolio.

## Architecture

The site is built with Next.js and Tailwind. It uses a serverless pattern for API routes and fetches data dynamically. 

Key integrations:
* GitHub API for project data.
* Spotify Web API for live now playing status.
* Vercel KV for visitor tracking.

## Running Locally

1. Create a file named .env.local in the root directory.
2. Add your Spotify credentials:
   SPOTIFY_CLIENT_ID=your_id
   SPOTIFY_CLIENT_SECRET=your_secret
   SPOTIFY_REFRESH_TOKEN=your_token
3. Install dependencies by running npm install.
4. Start the server with npm run dev.

## Deployment

This site is designed to be deployed on Vercel. Connect this repository to a Vercel project and provision a KV database to enable visitor tracking.
