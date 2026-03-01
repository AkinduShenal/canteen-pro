# Canteen Pro

## Project Setup & Running Locally

### 1. Install Dependencies

#### Server
```
cd server
npm install
```

#### Client
```
cd client
npm install
```

### 2. Environment Variables
- Copy `server/.env.example` to `server/.env` and fill in required values (e.g., database URI, JWT secret).

### 3. Start the Backend Server
```
cd server
npm start
```
- For development with auto-reload (if nodemon is set up):
```
npm run dev
```

### 4. Start the Frontend Client
```
cd client
npm start
```

### 5. Access the App
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000) (or your configured port)

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
