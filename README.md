# Canteen Pro

## Project Setup & Running Locally

### 1. Install Dependencies

#### Root (required for combined dev script)
```
npm install
```

#### Server
```
cd server
npm install
```

#### Client (Vite)
```
cd client
npm install
```

### 2. Environment Variables
- Copy `server/.env.example` to `server/.env` and fill in required values (e.g., database URI, JWT secret).

### 3. Run the App

#### Both client + server (recommended)
```
npm run dev
```
- Launches `server` (`npm run dev`) and `client` (`npm run dev` via Vite) concurrently.
- Open [http://localhost:3000](http://localhost:3000) for the frontend; `/api/*` requests proxy to [http://localhost:5000](http://localhost:5000).

#### Individually
- Backend: `cd server && npm run dev`
- Frontend: `cd client && npm run dev`

---

## Notes
- Make sure MongoDB (or your chosen database) is running and accessible.
- Update environment variables as needed for your local setup.
- For any issues, check logs in the terminal for both client and server folders.

---

## Contributing
- Fork the repo, create a feature branch, and submit a pull request.
- Follow the folder structure and code style for consistency.

---

## License
MIT
