import nodemailer from 'nodemailer';
import type { IStorage } from './storage';
import { generateICS, createDateTimeFromStrings, addMinutes } from './calendar-utils';

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpSecure: boolean;
}

export class EmailService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async getEmailConfig(clientId: string): Promise<EmailConfig | null> {
    const config = await this.storage.getSmtpConfig(clientId);
    
    // Check configuration without password (since it's returned as null for security)
    if (!config || !config.smtpEnabled || !config.smtpHost || !config.smtpUsername || !config.smtpFromEmail) {
      return null;
    }

    // Get the actual password directly from storage for email sending
    const client = await this.storage.getClient(clientId);
    if (!client || !client.smtpPassword) {
      return null;
    }

    return {
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort || 587,
      smtpUsername: config.smtpUsername,
      smtpPassword: client.smtpPassword, // Get actual password from client data
      smtpFromEmail: config.smtpFromEmail || config.smtpUsername,
      smtpFromName: config.smtpFromName || 'Scheduled Platform',
      smtpSecure: config.smtpPort === 465 ? true : (config.smtpSecure !== undefined && config.smtpSecure !== null ? config.smtpSecure : false) // 465 = SSL, others default to STARTTLS
    };
  }

  async sendTestEmail(clientId: string, testEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getEmailConfig(clientId);
      
      if (!config) {
        throw new Error('SMTP configuration is not properly configured or not enabled');
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure, // true for 465, false for other ports
        auth: {
          user: config.smtpUsername,
          pass: config.smtpPassword,
        },
        // Additional debug options
        debug: false,
        logger: false,
      });

      // Verify connection configuration
      await transporter.verify();

      // Send test email
      const info = await transporter.sendMail({
        from: `"${config.smtpFromName}" <${config.smtpFromEmail}>`,
        to: testEmail,
        subject: 'SMTP Test Email - Scheduled Platform',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">SMTP Configuration Test</h2>
            <p>This is a test email from your Scheduled platform SMTP configuration.</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin: 0 0 8px 0; color: #374151;">Configuration Details:</h3>
              <p style="margin: 4px 0; color: #6b7280;"><strong>SMTP Host:</strong> ${config.smtpHost}</p>
              <p style="margin: 4px 0; color: #6b7280;"><strong>Port:</strong> ${config.smtpPort}</p>
              <p style="margin: 4px 0; color: #6b7280;"><strong>Security:</strong> ${config.smtpSecure ? 'SSL/TLS' : 'STARTTLS'}</p>
              <p style="margin: 4px 0; color: #6b7280;"><strong>From:</strong> ${config.smtpFromName} &lt;${config.smtpFromEmail}&gt;</p>
            </div>
            <p>If you received this email, your SMTP configuration is working correctly!</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              This email was sent from the Scheduled business management platform.
            </p>
          </div>
        `,
        text: `
SMTP Configuration Test

This is a test email from your Scheduled platform SMTP configuration.

Configuration Details:
- SMTP Host: ${config.smtpHost}
- Port: ${config.smtpPort}
- Security: ${config.smtpSecure ? 'SSL/TLS' : 'STARTTLS'}
- From: ${config.smtpFromName} <${config.smtpFromEmail}>

If you received this email, your SMTP configuration is working correctly!

This email was sent from the Scheduled business management platform.
        `
      });

      return {
        success: true,
        message: `Test email sent successfully to ${testEmail}. Message ID: ${info.messageId}`
      };

    } catch (error) {
      console.error('Email sending error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Provide more specific error messages for common issues
      if (errorMessage.includes('EAUTH')) {
        return {
          success: false,
          message: 'Authentication failed. Please check your username and password.'
        };
      } else if (errorMessage.includes('ECONNECTION')) {
        return {
          success: false,
          message: 'Connection failed. Please check your SMTP host and port settings.'
        };
      } else if (errorMessage.includes('ETIMEDOUT')) {
        return {
          success: false,
          message: 'Connection timeout. Please verify your SMTP settings and network connection.'
        };
      } else {
        return {
          success: false,
          message: `Failed to send test email: ${errorMessage}`
        };
      }
    }
  }

  async sendEmail(
    clientId: string, 
    to: string, 
    subject: string, 
    htmlContent: string, 
    textContent?: string
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      const config = await this.getEmailConfig(clientId);
      
      if (!config) {
        throw new Error('SMTP configuration is not properly configured or not enabled');
      }

      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          user: config.smtpUsername,
          pass: config.smtpPassword,
        },
      });

      const info = await transporter.sendMail({
        from: `"${config.smtpFromName}" <${config.smtpFromEmail}>`,
        to,
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
      });

      return {
        success: true,
        message: `Email sent successfully to ${to}`,
        messageId: info.messageId
      };

    } catch (error) {
      console.error('Email sending error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        message: `Failed to send email: ${errorMessage}`
      };
    }
  }

  async sendAppointmentConfirmation(
    clientId: string,
    customerEmail: string,
    customerName: string,
    appointmentDetails: {
      id: string;
      serviceName: string;
      servicePrice: number;
      serviceDuration: number;
      appointmentDate: Date;
      startTime: string;
      endTime: string;
      notes?: string;
      businessName: string;
      businessPhone: string;
      businessEmail: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    const subject = `Appointment Confirmation - ${appointmentDetails.businessName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Appointment Confirmation</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Hi ${customerName},
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Your appointment with <strong>${appointmentDetails.businessName}</strong> has been booked successfully!
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="color: #333; margin-top: 0;">📅 Appointment Details</h3>
          <p style="margin: 8px 0;"><strong>Confirmation:</strong> #${appointmentDetails.id}</p>
          <p style="margin: 8px 0;"><strong>Service:</strong> ${appointmentDetails.serviceName}</p>
          <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(appointmentDetails.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 8px 0;"><strong>Time:</strong> ${appointmentDetails.startTime} - ${appointmentDetails.endTime}</p>
          <p style="margin: 8px 0;"><strong>Duration:</strong> ${appointmentDetails.serviceDuration} minutes</p>
          <p style="margin: 8px 0;"><strong>Price:</strong> $${appointmentDetails.servicePrice}</p>
          ${appointmentDetails.notes ? `<p style="margin: 8px 0;"><strong>Notes:</strong> ${appointmentDetails.notes}</p>` : ''}
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="color: #856404; margin: 0; font-weight: 500;">
            ⏳ <strong>Status:</strong> Your appointment is currently pending approval. You will receive another email once it's confirmed by our team.
          </p>
        </div>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          If you need to make any changes or cancel your appointment, please contact us directly.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <div style="text-align: center;">
          <p style="color: #999; font-size: 14px; margin: 5px 0;">
            Thank you for choosing <strong>${appointmentDetails.businessName}</strong>!
          </p>
          ${appointmentDetails.businessPhone ? `<p style="color: #999; font-size: 14px; margin: 5px 0;">📞 ${appointmentDetails.businessPhone}</p>` : ''}
          <p style="color: #999; font-size: 14px; margin: 5px 0;">📧 ${appointmentDetails.businessEmail}</p>
        </div>
      </div>
    `;

    const textContent = `
Hi ${customerName},

Your appointment with ${appointmentDetails.businessName} has been booked successfully!

Appointment Details:
- Confirmation: #${appointmentDetails.id}
- Service: ${appointmentDetails.serviceName}
- Date: ${new Date(appointmentDetails.appointmentDate).toLocaleDateString()}
- Time: ${appointmentDetails.startTime} - ${appointmentDetails.endTime}
- Duration: ${appointmentDetails.serviceDuration} minutes
- Price: $${appointmentDetails.servicePrice}
${appointmentDetails.notes ? `- Notes: ${appointmentDetails.notes}` : ''}

Status: Your appointment is currently pending approval. You will receive another email once it's confirmed by our team.

If you need to make any changes or cancel your appointment, please contact us directly.

Thank you for choosing ${appointmentDetails.businessName}!
${appointmentDetails.businessPhone ? `Phone: ${appointmentDetails.businessPhone}` : ''}
Email: ${appointmentDetails.businessEmail}
    `;

    return await this.sendEmail(clientId, customerEmail, subject, htmlContent, textContent);
  }

  async sendAppointmentStatusUpdate(
    clientId: string,
    customerEmail: string,
    customerName: string,
    appointmentDetails: {
      id: string;
      serviceName: string;
      servicePrice: number;
      appointmentDate: Date;
      startTime: string;
      endTime: string;
      status: string;
      businessName: string;
      businessPhone: string;
      businessEmail: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    let statusColor = '#6b7280';
    let statusIcon = '📋';
    let statusText = 'updated';
    
    if (appointmentDetails.status === 'APPROVED') {
      statusColor = '#059669';
      statusIcon = '✅';
      statusText = 'approved and confirmed';
    } else if (appointmentDetails.status === 'REJECTED') {
      statusColor = '#dc2626';
      statusIcon = '❌';
      statusText = 'declined';
    } else if (appointmentDetails.status === 'PENDING') {
      statusColor = '#d97706';
      statusIcon = '⏳';
      statusText = 'marked as pending';
    }

    const subject = `Appointment ${statusText.charAt(0).toUpperCase() + statusText.slice(1)} - ${appointmentDetails.businessName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Appointment Status Update</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Hi ${customerName},
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Your appointment with <strong>${appointmentDetails.businessName}</strong> has been ${statusText}.
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="color: #333; margin-top: 0;">📅 Appointment Details</h3>
          <p style="margin: 8px 0;"><strong>Confirmation:</strong> #${appointmentDetails.id}</p>
          <p style="margin: 8px 0;"><strong>Service:</strong> ${appointmentDetails.serviceName}</p>
          <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(appointmentDetails.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 8px 0;"><strong>Time:</strong> ${appointmentDetails.startTime} - ${appointmentDetails.endTime}</p>
          <p style="margin: 8px 0;"><strong>Price:</strong> $${appointmentDetails.servicePrice}</p>
        </div>
        
        <div style="background: ${statusColor === '#dc2626' ? '#fef2f2' : statusColor === '#059669' ? '#f0fdf4' : '#fff3cd'}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
          <p style="color: ${statusColor}; margin: 0; font-weight: 500;">
            ${statusIcon} <strong>Status Update:</strong> Your appointment has been ${statusText}${appointmentDetails.status === 'APPROVED' ? '! We look forward to seeing you.' : appointmentDetails.status === 'REJECTED' ? '. Please contact us to reschedule.' : ' and is awaiting further review.'}
          </p>
        </div>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          If you have any questions or need to make changes, please don't hesitate to contact us.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <div style="text-align: center;">
          <p style="color: #999; font-size: 14px; margin: 5px 0;">
            Thank you for choosing <strong>${appointmentDetails.businessName}</strong>!
          </p>
          ${appointmentDetails.businessPhone ? `<p style="color: #999; font-size: 14px; margin: 5px 0;">📞 ${appointmentDetails.businessPhone}</p>` : ''}
          <p style="color: #999; font-size: 14px; margin: 5px 0;">📧 ${appointmentDetails.businessEmail}</p>
        </div>
      </div>
    `;

    const textContent = `
Hi ${customerName},

Your appointment with ${appointmentDetails.businessName} has been ${statusText}.

Appointment Details:
- Confirmation: #${appointmentDetails.id}
- Service: ${appointmentDetails.serviceName}
- Date: ${new Date(appointmentDetails.appointmentDate).toLocaleDateString()}
- Time: ${appointmentDetails.startTime} - ${appointmentDetails.endTime}
- Price: $${appointmentDetails.servicePrice}

Status Update: Your appointment has been ${statusText}${appointmentDetails.status === 'APPROVED' ? '! We look forward to seeing you.' : appointmentDetails.status === 'REJECTED' ? '. Please contact us to reschedule.' : ' and is awaiting further review.'}

If you have any questions or need to make changes, please don't hesitate to contact us.

Thank you for choosing ${appointmentDetails.businessName}!
${appointmentDetails.businessPhone ? `Phone: ${appointmentDetails.businessPhone}` : ''}
Email: ${appointmentDetails.businessEmail}
    `;

    return await this.sendEmail(clientId, customerEmail, subject, htmlContent, textContent);
  }

  async sendCalendarInvite(
    clientId: string,
    recipientEmail: string,
    appointmentDetails: {
      id: string;
      customerName: string;
      serviceName: string;
      appointmentDate: Date;
      startTime: string;
      endTime?: string;
      durationMinutes?: number;
      notes?: string;
      businessName: string;
      businessPhone?: string;
      businessEmail: string;
      businessAddress?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getEmailConfig(clientId);
      
      if (!config) {
        throw new Error('SMTP configuration is not properly configured or not enabled');
      }

      // Create start and end times for the calendar event
      const startDateTime = createDateTimeFromStrings(appointmentDetails.appointmentDate, appointmentDetails.startTime);
      
      // Calculate end time
      let endDateTime: Date;
      if (appointmentDetails.endTime) {
        endDateTime = createDateTimeFromStrings(appointmentDetails.appointmentDate, appointmentDetails.endTime);
      } else if (appointmentDetails.durationMinutes) {
        endDateTime = addMinutes(startDateTime, appointmentDetails.durationMinutes);
      } else {
        // Default to 1 hour if no end time or duration provided
        endDateTime = addMinutes(startDateTime, 60);
      }

      // Generate .ics file content
      const icsContent = generateICS({
        title: `${appointmentDetails.serviceName} - ${appointmentDetails.businessName}`,
        description: `Appointment for ${appointmentDetails.serviceName}\n\nCustomer: ${appointmentDetails.customerName}\n${appointmentDetails.notes ? `Notes: ${appointmentDetails.notes}\n` : ''}\nConfirmation: #${appointmentDetails.id}`,
        location: appointmentDetails.businessAddress || appointmentDetails.businessName,
        startTime: startDateTime,
        endTime: endDateTime,
        organizerName: appointmentDetails.businessName,
        organizerEmail: appointmentDetails.businessEmail,
        attendeeEmail: recipientEmail,
        attendeeName: appointmentDetails.customerName,
      });

      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          user: config.smtpUsername,
          pass: config.smtpPassword,
        },
      });

      const subject = `Calendar Invite: ${appointmentDetails.serviceName} - ${appointmentDetails.businessName}`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">📅 Appointment Calendar Invite</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Hello,
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            You've been sent a calendar invite for an appointment with <strong>${appointmentDetails.businessName}</strong>.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7CB8EA;">
            <h3 style="color: #333; margin-top: 0;">📅 Appointment Details</h3>
            <p style="margin: 8px 0;"><strong>Service:</strong> ${appointmentDetails.serviceName}</p>
            <p style="margin: 8px 0;"><strong>Customer:</strong> ${appointmentDetails.customerName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(appointmentDetails.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${appointmentDetails.startTime}</p>
            ${appointmentDetails.businessAddress ? `<p style="margin: 8px 0;"><strong>Location:</strong> ${appointmentDetails.businessAddress}</p>` : ''}
            ${appointmentDetails.notes ? `<p style="margin: 8px 0;"><strong>Notes:</strong> ${appointmentDetails.notes}</p>` : ''}
          </div>
          
          <div style="background: #e0f2ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7CB8EA;">
            <p style="color: #0369a1; margin: 0; font-weight: 500;">
              📎 <strong>Add to Calendar:</strong> Click the attached .ics file to add this appointment to your Google Calendar, Outlook, Apple Calendar, or any calendar app.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <div style="text-align: center;">
            <p style="color: #999; font-size: 14px; margin: 5px 0;">
              <strong>${appointmentDetails.businessName}</strong>
            </p>
            ${appointmentDetails.businessPhone ? `<p style="color: #999; font-size: 14px; margin: 5px 0;">📞 ${appointmentDetails.businessPhone}</p>` : ''}
            <p style="color: #999; font-size: 14px; margin: 5px 0;">📧 ${appointmentDetails.businessEmail}</p>
          </div>
        </div>
      `;

      const textContent = `
Appointment Calendar Invite

You've been sent a calendar invite for an appointment with ${appointmentDetails.businessName}.

Appointment Details:
- Service: ${appointmentDetails.serviceName}
- Customer: ${appointmentDetails.customerName}
- Date: ${new Date(appointmentDetails.appointmentDate).toLocaleDateString()}
- Time: ${appointmentDetails.startTime}
${appointmentDetails.businessAddress ? `- Location: ${appointmentDetails.businessAddress}` : ''}
${appointmentDetails.notes ? `- Notes: ${appointmentDetails.notes}` : ''}

Add to Calendar: Open the attached .ics file to add this appointment to your calendar.

${appointmentDetails.businessName}
${appointmentDetails.businessPhone ? `Phone: ${appointmentDetails.businessPhone}` : ''}
Email: ${appointmentDetails.businessEmail}
      `;

      // Send email with .ics attachment
      const info = await transporter.sendMail({
        from: `"${config.smtpFromName}" <${config.smtpFromEmail}>`,
        to: recipientEmail,
        subject,
        html: htmlContent,
        text: textContent,
        attachments: [
          {
            filename: 'appointment.ics',
            content: icsContent,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST',
          },
        ],
        // Also set calendar content in the main body for better email client support
        icalEvent: {
          filename: 'appointment.ics',
          method: 'REQUEST',
          content: icsContent,
        },
      });

      return {
        success: true,
        message: `Calendar invite sent successfully to ${recipientEmail}. Message ID: ${info.messageId}`
      };

    } catch (error) {
      console.error('Calendar invite sending error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        message: `Failed to send calendar invite: ${errorMessage}`
      };
    }
  }
}