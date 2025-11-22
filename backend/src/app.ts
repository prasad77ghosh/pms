import express, { Application } from "express";
import { createServer, Server } from "http";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { db } from "./db/databse";

// Custom Middlewares
import BottomMiddleware from "./middlewares/bottom.middleware";

// Routes
import AuthRoutes from "./routes/auth.routes";
import ProductRoutes from "./routes/product.routes";
import CategoryRoutes from "./routes/category.routes";
import UserRoutes from "./routes/user.routes";
import fileUpload from "express-fileupload";
import BulkUploadRoutes from "./routes/bulk-upload.routes";
import ReportRoutes from "./routes/report.routes";
import { getRmqConn } from "./rmq";
import { startRmqConsumer } from "./consumers";

class App {
  public app: Application;
  public static server: Server;

  constructor() {
    this.app = express();

    this.initDB();
    this.initRmq()
    this.loadParsers();
    this.loadSecurity();
    this.loadCors();
    this.loadHealthCheck();
    this.loadRootRoute();
    this.loadRoutes();
    this.loadErrorMiddleware();
  }

  // ---------------------------------------------
  // DB INITIALIZATION
  // ---------------------------------------------
  private initDB() {
    // importing instance is enough, connection auto-tests
    console.log("⏳ Initializing PostgreSQL...");
    db;

  }

  private async initRmq() {
    await getRmqConn();
    await startRmqConsumer();
  }

  // ---------------------------------------------
  // BODY PARSERS
  // ---------------------------------------------
  private loadParsers() {
    this.app.use(express.json({ limit: "2mb" }));                 // JSON limit
    this.app.use(express.urlencoded({ extended: true, limit: "2mb" })); // Form limit
    this.app.use(cookieParser());

    // ===== FILE UPLOAD CONFIG (industry standard) =====
    this.app.use(
      fileUpload({
        limits: {
          fileSize: 60 * 1024 * 1024, // 20 MB industry standard
        },
        abortOnLimit: true,            // Stop upload when limit exceeded
        createParentPath: true,        // Auto-create upload folders
        useTempFiles: true,            // Better for large file handling
        tempFileDir: "/tmp/uploads",   // OS temp folder
        safeFileNames: true,           // Remove special characters
        preserveExtension: true        // Keep file extension
      })
    );
  }


  // ---------------------------------------------
  // SECURITY SETUP
  // ---------------------------------------------
  private loadSecurity() {
    this.app.use(helmet());
  }

  // ---------------------------------------------
  // CORS
  // ---------------------------------------------
  private loadCors() {
    this.app.use(
      cors({
        origin: [
          "https://num-tree-frontend.vercel.app",
          "http://localhost:3000",
          "http://localhost:5173",
          "http://localhost:4200",
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          "X-Otp-Token",
        ],
        credentials: true,
      })
    );
  }

  // ---------------------------------------------
  // HEALTHCHECK
  // ---------------------------------------------
  private loadHealthCheck() {
    this.app.get("/healthcheck", async (req, res) => {
      try {
        res.json({ status: "ok", message: "Healthcheck passed" });
      } catch (error) {
        res.status(500).json({
          status: "error",
          message: "Database connection failed",
        });
      }
    });
  }

  // ---------------------------------------------
  // ROOT ROUTE
  // ---------------------------------------------
  private loadRootRoute() {
    this.app.get("/", (req, res) => {
      res.json({ message: "NumTree backend running successfully 🚀" });
    });
  }

  // ---------------------------------------------
  // API ROUTES
  // ---------------------------------------------
  private loadRoutes() {
    const authRoutes = new AuthRoutes();
    const productRoutes = new ProductRoutes();
    const categoryRoutes = new CategoryRoutes();
    const userRoutes = new UserRoutes();
    const uploadRoutes = new BulkUploadRoutes();
    const reportRoutes = new ReportRoutes();

    this.app.use(`/api/v1/${authRoutes.path}`, authRoutes.router);
    this.app.use(`/api/v1/${productRoutes.path}`, productRoutes.router);
    this.app.use(`/api/v1/${categoryRoutes.path}`, categoryRoutes.router);
    this.app.use(`/api/v1/${userRoutes.path}`, userRoutes.router);
    this.app.use(`/api/v1/${uploadRoutes.path}`, uploadRoutes.router);
    this.app.use(`/api/v1/${reportRoutes.path}`, reportRoutes.router);

  }

  // ---------------------------------------------
  // BOTTOM MIDDLEWARE (GLOBAL ERROR HANDLER)
  // ---------------------------------------------
  private loadErrorMiddleware() {
    new BottomMiddleware(this.app);
  }

  // ---------------------------------------------
  // START SERVER
  // ---------------------------------------------
  public listen(serverPort: number) {
    App.server = createServer(this.app);
    App.server.listen(serverPort, () => {
      console.log(`✅ Server running on port ${serverPort}`);
    });
  }
}

export default App;
