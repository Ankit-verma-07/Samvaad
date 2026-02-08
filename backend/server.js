require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chats");
const messageRoutes = require("./routes/messages");
const initializeSocket = require("./sockets");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
	process.env.CLIENT_ORIGIN,
	process.env.SOCKET_ORIGIN,
	"https://samvaad-chat.vercel.app",
	"http://localhost:3000",
].filter(Boolean);

const corsOptions = {
	origin: (origin, callback) => {
		if (!origin || allowedOrigins.includes(origin)) {
			return callback(null, true);
		}
		return callback(new Error("Not allowed by CORS"));
	},
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

app.get("/health", (req, res) => {
	res.status(200).json({ status: "ok", service: "backend" });
});

const PORT = process.env.PORT || 5000;

connectDB()
	.then(() => {
		const io = new Server(server, {
			cors: {
				origin: process.env.SOCKET_ORIGIN || "*",
				methods: ["GET", "POST"],
			},
		});

		initializeSocket(io);

		server.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	})
	.catch((error) => {
		console.error("Failed to connect to database:", error);
		process.exit(1);
	});
