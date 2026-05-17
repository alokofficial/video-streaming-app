# Video Streaming App

This repository contains a full-stack **MERN** video streaming application that leverages **Google Drive** as its primary storage backend for video files.

## Architecture Overview

The project is split into a separated client (frontend) and server (backend) architecture.

### Client (Frontend)

The client is a Single Page Application (SPA) designed to provide a responsive user interface and seamless video playback.

- **Framework:** React 19 (built with Vite)
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM (`react-router-dom`)
  - Enforces authentication using a `ProtectedRoute` component.
  - Implements Role-Based Access Control (RBAC), ensuring that routes like `/admin` are only accessible to administrative users.
- **Video Playback:** Uses `react-player` to handle video streaming on the `/watch/:fileId` route.
- **State & Networking:** Utilizes Context API for global state management (e.g., AuthContext) and `axios` for RESTful communication with the backend.

### Server (Backend)

The server is a REST API that handles user authentication, metadata management, and orchestrates the video delivery from Google Drive.

- **Environment:** Node.js with Express.js (ES Modules)
- **Database:** MongoDB (using `mongoose`) for storing user profiles, credentials, and video metadata.
- **Security & Authentication:** 
  - Stateless authentication using JSON Web Tokens (JWT).
  - Password hashing via `bcryptjs`.
  - Secure endpoints validated via custom middleware.
- **Storage Backend (Google Drive):** 
  - Integrates with the Google Drive API (`googleapis`) using a Service Account.
  - Offloads heavy video storage to Drive rather than self-hosting or using expensive block storage.

## Data Flow

1. **Authentication:** 
   Users register or log in via the React client. The Express backend validates credentials against MongoDB and issues a secure JWT for subsequent requests.
2. **Browsing Videos:** 
   The client requests a catalog of videos from the `/api/videos` endpoint. The backend queries MongoDB and returns the associated metadata (titles, thumbnails, Drive file IDs).
3. **Video Streaming:** 
   When a user clicks a video to watch, they are routed to `/watch/:fileId`. The backend uses this `fileId` to authorize and fetch the video stream directly from Google Drive, piping it efficiently to the React video player on the client.

## Getting Started

### Prerequisites
- Node.js
- MongoDB instance
- Google Cloud Service Account credentials (with Drive API enabled)

### Installation

1. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```
2. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

*(Ensure you configure `.env` files in both the `server` and `client` directories with your database URIs, JWT secrets, and Google Drive credentials before starting the application.)*
