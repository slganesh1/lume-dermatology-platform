import { storage } from "./storage";

async function createMissingPatientProfiles() {
  try {
    console.log("Starting missing patient profile creation...");
    
    // Get all users with patient role
    const allUsers = await storage.getUsers();
    const patientUsers = allUsers.filter(user => user.role === "patient");
    
    console.log(`Found ${patientUsers.length} users with patient role`);
    
    for (const user of patientUsers) {
      // Check if patient profile already exists
      const existingPatient = await storage.getPatientByUserId(user.id);
      
      if (!existingPatient) {
        try {
          const patientData = {
            pid: `DRM${Math.floor(1000 + Math.random() * 9000)}`,
            userId: user.id,
            name: user.name || user.username,
            age: 25,
            gender: "other",
            email: `${user.username}@example.com`,
            phone: "000-000-0000",
            address: "",
            allergies: "",
            lastVisitDate: null,
            nextVisitDate: null,
            profileImage: null
          };
          
          await storage.createPatient(patientData);
          console.log(`✓ Created patient profile for user: ${user.username} (ID: ${user.id})`);
        } catch (error) {
          console.error(`✗ Failed to create patient profile for user ${user.username}:`, error);
        }
      } else {
        console.log(`- Patient profile already exists for user: ${user.username} (ID: ${user.id})`);
      }
    }
    
    console.log("Missing patient profile creation completed!");
  } catch (error) {
    console.error("Error creating missing patient profiles:", error);
  }
}

// Run the fix
createMissingPatientProfiles();