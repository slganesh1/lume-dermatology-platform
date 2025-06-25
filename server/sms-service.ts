import twilio from 'twilio';

// SMS Service for expert notifications
export class SMSService {
  private client: twilio.Twilio | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTwilio();
  }

  private initializeTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    console.log('Checking Twilio credentials:', {
      accountSid: accountSid ? 'Present' : 'Missing',
      authToken: authToken ? 'Present' : 'Missing'
    });

    if (accountSid && authToken) {
      try {
        this.client = twilio(accountSid, authToken);
        this.isConfigured = true;
        console.log('SMS Service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Twilio client:', error);
      }
    } else {
      console.log('SMS Service not configured - missing Twilio credentials');
    }
  }

  async sendExpertAlert(analysisCount: number, patientName?: string): Promise<boolean> {
    if (!this.isConfigured || !this.client) {
      console.log('SMS Service not configured, skipping SMS alert');
      return false;
    }

    const expertPhoneNumber = process.env.EXPERT_PHONE_NUMBER;
    const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!expertPhoneNumber || !fromPhoneNumber) {
      console.log('Missing phone number configuration for SMS alerts');
      return false;
    }

    try {
      const message = patientName 
        ? `LUME Alert: New skin analysis from ${patientName} requires expert review. Total pending: ${analysisCount}. Please check the expert dashboard.`
        : `LUME Alert: ${analysisCount} skin analysis${analysisCount > 1 ? 'es' : ''} awaiting expert review. Please check the expert dashboard.`;

      const result = await this.client.messages.create({
        body: message,
        from: fromPhoneNumber,
        to: expertPhoneNumber
      });

      console.log(`SMS alert sent successfully. SID: ${result.sid}`);
      return true;
    } catch (error: any) {
      if (error.code === 21608) {
        console.log('SMS not sent: Phone number needs verification in Twilio trial account');
        console.log('To enable SMS: Verify +918825662300 at https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      } else {
        console.error('Failed to send SMS alert:', error);
      }
      return false;
    }
  }

  async sendUrgentAlert(patientName: string, condition: string): Promise<boolean> {
    if (!this.isConfigured || !this.client) {
      return false;
    }

    const expertPhoneNumber = process.env.EXPERT_PHONE_NUMBER;
    const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!expertPhoneNumber || !fromPhoneNumber) {
      return false;
    }

    try {
      const message = `URGENT LUME Alert: Critical skin condition detected for ${patientName} - ${condition}. Immediate expert review required.`;

      const result = await this.client.messages.create({
        body: message,
        from: fromPhoneNumber,
        to: expertPhoneNumber
      });

      console.log(`Urgent SMS alert sent successfully. SID: ${result.sid}`);
      return true;
    } catch (error: any) {
      if (error.code === 21608) {
        console.log('Urgent SMS not sent: Phone number needs verification in Twilio trial account');
      } else {
        console.error('Failed to send urgent SMS alert:', error);
      }
      return false;
    }
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }
}

export const smsService = new SMSService();