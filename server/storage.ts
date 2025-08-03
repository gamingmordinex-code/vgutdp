// Legacy storage interface - now redirects to MongoDB service
import { dbService } from "./services/database";

// Re-export the database service as storage for backward compatibility
export const storage = dbService;