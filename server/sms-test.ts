// Test script for SMS functionality
import { smsService } from "./sms-service";

async function testSMSService() {
  console.log('Testing SMS Service...');
  
  // Check if SMS service is configured
  if (!smsService.isAvailable()) {
    console.log('SMS Service not configured. Please set up Twilio credentials.');
    return;
  }
  
  console.log('SMS Service is configured. Testing alerts...');
  
  // Test regular alert
  const regularAlert = await smsService.sendExpertAlert(3, "Test Patient");
  console.log('Regular alert sent:', regularAlert);
  
  // Test urgent alert
  const urgentAlert = await smsService.sendUrgentAlert("Critical Patient", "Melanoma");
  console.log('Urgent alert sent:', urgentAlert);
}

// Run test if called directly
if (import.meta.url === new URL(import.meta.resolve('./sms-test.ts')).href) {
  testSMSService().catch(console.error);
}

export { testSMSService };