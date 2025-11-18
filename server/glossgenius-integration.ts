// GlossGenius API Integration
// This will handle importing appointments and client data from GlossGenius

export interface GlossGeniusConfig {
  apiKey: string;
  businessId: string;
  baseUrl: string;
}

export interface GlossGeniusAppointment {
  id: string;
  client_id: string;
  service_id: string;
  staff_id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  price: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_name: string;
  staff_name: string;
}

export interface GlossGeniusClient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes?: string;
  created_at: string;
}

export interface GlossGeniusService {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

export class GlossGeniusIntegration {
  private config: GlossGeniusConfig;

  constructor(config: GlossGeniusConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`GlossGenius API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAppointments(startDate?: string, endDate?: string): Promise<GlossGeniusAppointment[]> {
    let endpoint = `/v1/businesses/${this.config.businessId}/appointments`;
    
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const data = await this.makeRequest(endpoint);
    return data.appointments || [];
  }

  async getClients(): Promise<GlossGeniusClient[]> {
    const endpoint = `/v1/businesses/${this.config.businessId}/clients`;
    const data = await this.makeRequest(endpoint);
    return data.clients || [];
  }

  async getServices(): Promise<GlossGeniusService[]> {
    const endpoint = `/v1/businesses/${this.config.businessId}/services`;
    const data = await this.makeRequest(endpoint);
    return data.services || [];
  }

  // Convert GlossGenius appointments to our app format (for import)
  convertAppointments(ggAppointments: GlossGeniusAppointment[]) {
    return ggAppointments.map(appointment => ({
      clientName: appointment.client_name,
      clientEmail: appointment.client_email,
      clientPhone: appointment.client_phone,
      serviceName: appointment.service_name,
      stylistName: appointment.staff_name,
      date: new Date(appointment.start_time).toISOString().split('T')[0],
      time: new Date(appointment.start_time).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }),
      duration: Math.round((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / (1000 * 60)),
      price: appointment.price,
      status: appointment.status,
      notes: appointment.notes || '',
      originalId: appointment.id
    }));
  }

  // EXPORT: Create appointment in GlossGenius
  async createAppointment(appointmentData: any): Promise<string> {
    const endpoint = `/v1/businesses/${this.config.businessId}/appointments`;

    // Convert our appointment format to GlossGenius format
    const ggAppointment = {
      client_id: appointmentData.clientId,
      service_id: appointmentData.serviceId,
      staff_id: appointmentData.staffId,
      start_time: appointmentData.startTime,
      end_time: appointmentData.endTime,
      notes: appointmentData.notes || '',
      status: appointmentData.status || 'confirmed'
    };

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ggAppointment)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create appointment in GlossGenius: ${response.status} - ${error}`);
    }

    const result = await response.json();
    return result.appointment.id;
  }

  // EXPORT: Create or get client in GlossGenius
  async findOrCreateClient(clientData: any): Promise<string> {
    // First try to find existing client by email
    const clients = await this.getClients();
    const existingClient = clients.find(c => c.email === clientData.email);

    if (existingClient) {
      return existingClient.id;
    }

    // Create new client
    const endpoint = `/v1/businesses/${this.config.businessId}/clients`;
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: clientData.firstName,
        last_name: clientData.lastName,
        email: clientData.email,
        phone: clientData.phone,
        notes: clientData.notes || ''
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create client in GlossGenius: ${response.status}`);
    }

    const result = await response.json();
    return result.client.id;
  }

  // EXPORT: Convert our appointments to GlossGenius format and create them
  async exportAppointments(appointments: any[]): Promise<{success: number, failed: number, errors: any[]}> {
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const appointment of appointments) {
      try {
        // Parse name if needed
        const nameParts = appointment.clientName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Find or create client
        const clientId = await this.findOrCreateClient({
          firstName,
          lastName,
          email: appointment.clientEmail,
          phone: appointment.clientPhone
        });

        // Get services to match service name
        const services = await this.getServices();
        const service = services.find(s =>
          s.name.toLowerCase() === appointment.serviceName.toLowerCase()
        );

        if (!service) {
          throw new Error(`Service "${appointment.serviceName}" not found in GlossGenius`);
        }

        // Create appointment
        const startTime = new Date(`${appointment.date}T${appointment.time}`);
        const endTime = new Date(startTime.getTime() + (appointment.duration || 60) * 60000);

        await this.createAppointment({
          clientId,
          serviceId: service.id,
          staffId: appointment.staffId || '', // Will need to be provided or mapped
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: appointment.notes || '',
          status: appointment.status || 'confirmed'
        });

        success++;
      } catch (error: any) {
        failed++;
        errors.push({
          appointment: appointment.clientName,
          error: error.message
        });
      }
    }

    return { success, failed, errors };
  }
}

// Helper function to validate GlossGenius API credentials
export async function validateGlossGeniusCredentials(config: GlossGeniusConfig): Promise<boolean> {
  try {
    const integration = new GlossGeniusIntegration(config);
    await integration.getServices(); // Simple test call
    return true;
  } catch (error) {
    console.error('GlossGenius validation failed:', error);
    return false;
  }
}