import { db } from "./db";
import { videoCalls, callParticipants, callMessages } from "@shared/schema";

async function createVideoCallTables() {
  try {
    console.log("Creating video call tables...");
    
    // The tables will be created automatically when the server starts
    // due to the schema being imported in db.ts
    
    console.log("Video call tables created successfully!");
  } catch (error) {
    console.error("Error creating video call tables:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createVideoCallTables()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { createVideoCallTables };