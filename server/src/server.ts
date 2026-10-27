import http from "http";
import { app } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { initSocket } from "./sockets";

const server = http.createServer(app);

initSocket(server);

const start = async (): Promise<void> => {
  try {
    await connectDB();
    server.listen(env.port, () => {
      console.log(
        `[server] REST API running on http://localhost:${env.port} (${env.nodeEnv})`,
      );
      console.log("[server] Socket.IO attached to the HTTP server");
    });
  } catch (error) {
    console.error("[server] Failed to start:", error);
    process.exit(1);
  }
};

void start();
