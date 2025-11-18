var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/dns-verification.ts
var dns_verification_exports = {};
__export(dns_verification_exports, {
  DNSVerificationService: () => DNSVerificationService,
  dnsVerificationService: () => dnsVerificationService
});
import { promisify } from "util";
import { resolve as dnsResolve } from "dns";
var resolveTxt, DNSVerificationService, dnsVerificationService;
var init_dns_verification = __esm({
  "server/dns-verification.ts"() {
    "use strict";
    resolveTxt = promisify(dnsResolve);
    DNSVerificationService = class {
      static {
        __name(this, "DNSVerificationService");
      }
      /**
       * Verify domain ownership via DNS TXT record
       */
      async verifyDomainViaDNS(domain, expectedToken) {
        const startTime = Date.now();
        const recordName = `_scheduled-verification.${domain}`;
        try {
          const txtRecords = await resolveTxt(recordName, "TXT");
          const responseTime = Date.now() - startTime;
          const flatRecords = txtRecords.flat();
          const foundToken = flatRecords.find((record) => record.includes(expectedToken));
          if (foundToken) {
            return {
              success: true,
              verificationData: {
                expected: expectedToken,
                found: flatRecords,
                recordName
              },
              responseTime
            };
          } else {
            return {
              success: false,
              errorMessage: `Verification token not found in DNS TXT records. Expected: ${expectedToken}`,
              verificationData: {
                expected: expectedToken,
                found: flatRecords.length > 0 ? flatRecords : null,
                recordName
              },
              responseTime
            };
          }
        } catch (error) {
          const responseTime = Date.now() - startTime;
          let errorMessage = "DNS lookup failed";
          if (error.code === "ENOTFOUND") {
            errorMessage = `DNS TXT record not found for ${recordName}`;
          } else if (error.code === "ENODATA") {
            errorMessage = `No TXT records found for ${recordName}`;
          } else if (error.code === "ETIMEOUT") {
            errorMessage = `DNS lookup timeout for ${recordName}`;
          } else {
            errorMessage = `DNS error: ${error.message}`;
          }
          return {
            success: false,
            errorMessage,
            verificationData: {
              expected: expectedToken,
              found: null,
              recordName
            },
            responseTime
          };
        }
      }
      /**
       * Verify domain ownership via CNAME record
       */
      async verifyDomainViaCNAME(domain, expectedTarget) {
        const startTime = Date.now();
        try {
          const cnameRecords = await resolveTxt(domain);
          const responseTime = Date.now() - startTime;
          const foundRecord = cnameRecords.find((record) => record === expectedTarget);
          if (foundRecord) {
            return {
              success: true,
              verificationData: {
                expected: expectedTarget,
                found: cnameRecords,
                recordName: domain
              },
              responseTime
            };
          } else {
            return {
              success: false,
              errorMessage: `CNAME record does not match expected target: ${expectedTarget}`,
              verificationData: {
                expected: expectedTarget,
                found: cnameRecords.length > 0 ? cnameRecords : null,
                recordName: domain
              },
              responseTime
            };
          }
        } catch (error) {
          const responseTime = Date.now() - startTime;
          return {
            success: false,
            errorMessage: `CNAME lookup failed: ${error.message}`,
            verificationData: {
              expected: expectedTarget,
              found: null,
              recordName: domain
            },
            responseTime
          };
        }
      }
      /**
       * Check if domain resolves to any IP (basic connectivity test)
       */
      async checkDomainConnectivity(domain) {
        const startTime = Date.now();
        try {
          const addresses = await resolveTxt(domain);
          const responseTime = Date.now() - startTime;
          return {
            success: true,
            responseTime
          };
        } catch (error) {
          const responseTime = Date.now() - startTime;
          return {
            success: false,
            errorMessage: `Domain connectivity check failed: ${error.message}`,
            responseTime
          };
        }
      }
    };
    dnsVerificationService = new DNSVerificationService();
  }
});

// server/calendar-utils.ts
function formatICalDate(date) {
  const pad = /* @__PURE__ */ __name((num) => num.toString().padStart(2, "0"), "pad");
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}
function generateUID() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@scheduled-app`;
}
function escapeICalText(text2) {
  return text2.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
function generateICS(event) {
  const now = /* @__PURE__ */ new Date();
  const uid = generateUID();
  const dtstamp = formatICalDate(now);
  const dtstart = formatICalDate(event.startTime);
  const dtend = formatICalDate(event.endTime);
  let icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Scheduled App//Appointment Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeICalText(event.title)}`
  ];
  if (event.description) {
    icsContent.push(`DESCRIPTION:${escapeICalText(event.description)}`);
  }
  if (event.location) {
    icsContent.push(`LOCATION:${escapeICalText(event.location)}`);
  }
  if (event.organizerEmail) {
    const organizerName = event.organizerName || event.organizerEmail;
    icsContent.push(`ORGANIZER;CN=${escapeICalText(organizerName)}:mailto:${event.organizerEmail}`);
  }
  if (event.attendeeEmail) {
    const attendeeName = event.attendeeName || event.attendeeEmail;
    icsContent.push(`ATTENDEE;CN=${escapeICalText(attendeeName)};RSVP=TRUE:mailto:${event.attendeeEmail}`);
  }
  icsContent.push(
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR"
  );
  return icsContent.join("\r\n");
}
function parseTimeString(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}
function createDateTimeFromStrings(dateString, timeString) {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const { hours, minutes } = parseTimeString(timeString);
  const dateTime = new Date(date);
  dateTime.setHours(hours, minutes, 0, 0);
  return dateTime;
}
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 6e4);
}
var init_calendar_utils = __esm({
  "server/calendar-utils.ts"() {
    "use strict";
    __name(formatICalDate, "formatICalDate");
    __name(generateUID, "generateUID");
    __name(escapeICalText, "escapeICalText");
    __name(generateICS, "generateICS");
    __name(parseTimeString, "parseTimeString");
    __name(createDateTimeFromStrings, "createDateTimeFromStrings");
    __name(addMinutes, "addMinutes");
  }
});

// server/emailService.ts
var emailService_exports = {};
__export(emailService_exports, {
  EmailService: () => EmailService
});
import nodemailer from "nodemailer";
var EmailService;
var init_emailService = __esm({
  "server/emailService.ts"() {
    "use strict";
    init_calendar_utils();
    EmailService = class {
      static {
        __name(this, "EmailService");
      }
      storage;
      constructor(storage2) {
        this.storage = storage2;
      }
      async getEmailConfig(clientId) {
        const config = await this.storage.getSmtpConfig(clientId);
        if (!config || !config.smtpEnabled || !config.smtpHost || !config.smtpUsername || !config.smtpFromEmail) {
          return null;
        }
        const client = await this.storage.getClient(clientId);
        if (!client || !client.smtpPassword) {
          return null;
        }
        return {
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort || 587,
          smtpUsername: config.smtpUsername,
          smtpPassword: client.smtpPassword,
          // Get actual password from client data
          smtpFromEmail: config.smtpFromEmail || config.smtpUsername,
          smtpFromName: config.smtpFromName || "Scheduled Platform",
          smtpSecure: config.smtpPort === 465 ? true : config.smtpSecure !== void 0 && config.smtpSecure !== null ? config.smtpSecure : false
          // 465 = SSL, others default to STARTTLS
        };
      }
      async sendTestEmail(clientId, testEmail) {
        try {
          const config = await this.getEmailConfig(clientId);
          if (!config) {
            throw new Error("SMTP configuration is not properly configured or not enabled");
          }
          const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpSecure,
            // true for 465, false for other ports
            auth: {
              user: config.smtpUsername,
              pass: config.smtpPassword
            },
            // Additional debug options
            debug: false,
            logger: false
          });
          await transporter.verify();
          const info = await transporter.sendMail({
            from: `"${config.smtpFromName}" <${config.smtpFromEmail}>`,
            to: testEmail,
            subject: "SMTP Test Email - Scheduled Platform",
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">SMTP Configuration Test</h2>
            <p>This is a test email from your Scheduled platform SMTP configuration.</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin: 0 0 8px 0; color: #374151;">Configuration Details:</h3>
              <p style="margin: 4px 0; color: #6b7280;"><strong>SMTP Host:</strong> ${config.smtpHost}</p>
              <p style="margin: 4px 0; color: #6b7280;"><strong>Port:</strong> ${config.smtpPort}</p>
              <p style="margin: 4px 0; color: #6b7280;"><strong>Security:</strong> ${config.smtpSecure ? "SSL/TLS" : "STARTTLS"}</p>
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
- Security: ${config.smtpSecure ? "SSL/TLS" : "STARTTLS"}
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
          console.error("Email sending error:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
          if (errorMessage.includes("EAUTH")) {
            return {
              success: false,
              message: "Authentication failed. Please check your username and password."
            };
          } else if (errorMessage.includes("ECONNECTION")) {
            return {
              success: false,
              message: "Connection failed. Please check your SMTP host and port settings."
            };
          } else if (errorMessage.includes("ETIMEDOUT")) {
            return {
              success: false,
              message: "Connection timeout. Please verify your SMTP settings and network connection."
            };
          } else {
            return {
              success: false,
              message: `Failed to send test email: ${errorMessage}`
            };
          }
        }
      }
      async sendEmail(clientId, to, subject, htmlContent, textContent) {
        try {
          const config = await this.getEmailConfig(clientId);
          if (!config) {
            throw new Error("SMTP configuration is not properly configured or not enabled");
          }
          const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpSecure,
            auth: {
              user: config.smtpUsername,
              pass: config.smtpPassword
            }
          });
          const info = await transporter.sendMail({
            from: `"${config.smtpFromName}" <${config.smtpFromEmail}>`,
            to,
            subject,
            html: htmlContent,
            text: textContent || htmlContent.replace(/<[^>]*>/g, "")
            // Strip HTML if no text provided
          });
          return {
            success: true,
            message: `Email sent successfully to ${to}`,
            messageId: info.messageId
          };
        } catch (error) {
          console.error("Email sending error:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
          return {
            success: false,
            message: `Failed to send email: ${errorMessage}`
          };
        }
      }
      async sendAppointmentConfirmation(clientId, customerEmail, customerName, appointmentDetails) {
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
          <h3 style="color: #333; margin-top: 0;">\u{1F4C5} Appointment Details</h3>
          <p style="margin: 8px 0;"><strong>Confirmation:</strong> #${appointmentDetails.id}</p>
          <p style="margin: 8px 0;"><strong>Service:</strong> ${appointmentDetails.serviceName}</p>
          <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(appointmentDetails.appointmentDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <p style="margin: 8px 0;"><strong>Time:</strong> ${appointmentDetails.startTime} - ${appointmentDetails.endTime}</p>
          <p style="margin: 8px 0;"><strong>Duration:</strong> ${appointmentDetails.serviceDuration} minutes</p>
          <p style="margin: 8px 0;"><strong>Price:</strong> $${appointmentDetails.servicePrice}</p>
          ${appointmentDetails.notes ? `<p style="margin: 8px 0;"><strong>Notes:</strong> ${appointmentDetails.notes}</p>` : ""}
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="color: #856404; margin: 0; font-weight: 500;">
            \u23F3 <strong>Status:</strong> Your appointment is currently pending approval. You will receive another email once it's confirmed by our team.
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
          ${appointmentDetails.businessPhone ? `<p style="color: #999; font-size: 14px; margin: 5px 0;">\u{1F4DE} ${appointmentDetails.businessPhone}</p>` : ""}
          <p style="color: #999; font-size: 14px; margin: 5px 0;">\u{1F4E7} ${appointmentDetails.businessEmail}</p>
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
${appointmentDetails.notes ? `- Notes: ${appointmentDetails.notes}` : ""}

Status: Your appointment is currently pending approval. You will receive another email once it's confirmed by our team.

If you need to make any changes or cancel your appointment, please contact us directly.

Thank you for choosing ${appointmentDetails.businessName}!
${appointmentDetails.businessPhone ? `Phone: ${appointmentDetails.businessPhone}` : ""}
Email: ${appointmentDetails.businessEmail}
    `;
        return await this.sendEmail(clientId, customerEmail, subject, htmlContent, textContent);
      }
      async sendAppointmentStatusUpdate(clientId, customerEmail, customerName, appointmentDetails) {
        let statusColor = "#6b7280";
        let statusIcon = "\u{1F4CB}";
        let statusText = "updated";
        if (appointmentDetails.status === "APPROVED") {
          statusColor = "#059669";
          statusIcon = "\u2705";
          statusText = "approved and confirmed";
        } else if (appointmentDetails.status === "REJECTED") {
          statusColor = "#dc2626";
          statusIcon = "\u274C";
          statusText = "declined";
        } else if (appointmentDetails.status === "PENDING") {
          statusColor = "#d97706";
          statusIcon = "\u23F3";
          statusText = "marked as pending";
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
          <h3 style="color: #333; margin-top: 0;">\u{1F4C5} Appointment Details</h3>
          <p style="margin: 8px 0;"><strong>Confirmation:</strong> #${appointmentDetails.id}</p>
          <p style="margin: 8px 0;"><strong>Service:</strong> ${appointmentDetails.serviceName}</p>
          <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(appointmentDetails.appointmentDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <p style="margin: 8px 0;"><strong>Time:</strong> ${appointmentDetails.startTime} - ${appointmentDetails.endTime}</p>
          <p style="margin: 8px 0;"><strong>Price:</strong> $${appointmentDetails.servicePrice}</p>
        </div>
        
        <div style="background: ${statusColor === "#dc2626" ? "#fef2f2" : statusColor === "#059669" ? "#f0fdf4" : "#fff3cd"}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
          <p style="color: ${statusColor}; margin: 0; font-weight: 500;">
            ${statusIcon} <strong>Status Update:</strong> Your appointment has been ${statusText}${appointmentDetails.status === "APPROVED" ? "! We look forward to seeing you." : appointmentDetails.status === "REJECTED" ? ". Please contact us to reschedule." : " and is awaiting further review."}
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
          ${appointmentDetails.businessPhone ? `<p style="color: #999; font-size: 14px; margin: 5px 0;">\u{1F4DE} ${appointmentDetails.businessPhone}</p>` : ""}
          <p style="color: #999; font-size: 14px; margin: 5px 0;">\u{1F4E7} ${appointmentDetails.businessEmail}</p>
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

Status Update: Your appointment has been ${statusText}${appointmentDetails.status === "APPROVED" ? "! We look forward to seeing you." : appointmentDetails.status === "REJECTED" ? ". Please contact us to reschedule." : " and is awaiting further review."}

If you have any questions or need to make changes, please don't hesitate to contact us.

Thank you for choosing ${appointmentDetails.businessName}!
${appointmentDetails.businessPhone ? `Phone: ${appointmentDetails.businessPhone}` : ""}
Email: ${appointmentDetails.businessEmail}
    `;
        return await this.sendEmail(clientId, customerEmail, subject, htmlContent, textContent);
      }
      async sendCalendarInvite(clientId, recipientEmail, appointmentDetails) {
        try {
          const config = await this.getEmailConfig(clientId);
          if (!config) {
            throw new Error("SMTP configuration is not properly configured or not enabled");
          }
          const startDateTime = createDateTimeFromStrings(appointmentDetails.appointmentDate, appointmentDetails.startTime);
          let endDateTime;
          if (appointmentDetails.endTime) {
            endDateTime = createDateTimeFromStrings(appointmentDetails.appointmentDate, appointmentDetails.endTime);
          } else if (appointmentDetails.durationMinutes) {
            endDateTime = addMinutes(startDateTime, appointmentDetails.durationMinutes);
          } else {
            endDateTime = addMinutes(startDateTime, 60);
          }
          const icsContent = generateICS({
            title: `${appointmentDetails.serviceName} - ${appointmentDetails.businessName}`,
            description: `Appointment for ${appointmentDetails.serviceName}

Customer: ${appointmentDetails.customerName}
${appointmentDetails.notes ? `Notes: ${appointmentDetails.notes}
` : ""}
Confirmation: #${appointmentDetails.id}`,
            location: appointmentDetails.businessAddress || appointmentDetails.businessName,
            startTime: startDateTime,
            endTime: endDateTime,
            organizerName: appointmentDetails.businessName,
            organizerEmail: appointmentDetails.businessEmail,
            attendeeEmail: recipientEmail,
            attendeeName: appointmentDetails.customerName
          });
          const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpSecure,
            auth: {
              user: config.smtpUsername,
              pass: config.smtpPassword
            }
          });
          const subject = `Calendar Invite: ${appointmentDetails.serviceName} - ${appointmentDetails.businessName}`;
          const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">\u{1F4C5} Appointment Calendar Invite</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Hello,
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            You've been sent a calendar invite for an appointment with <strong>${appointmentDetails.businessName}</strong>.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7CB8EA;">
            <h3 style="color: #333; margin-top: 0;">\u{1F4C5} Appointment Details</h3>
            <p style="margin: 8px 0;"><strong>Service:</strong> ${appointmentDetails.serviceName}</p>
            <p style="margin: 8px 0;"><strong>Customer:</strong> ${appointmentDetails.customerName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(appointmentDetails.appointmentDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${appointmentDetails.startTime}</p>
            ${appointmentDetails.businessAddress ? `<p style="margin: 8px 0;"><strong>Location:</strong> ${appointmentDetails.businessAddress}</p>` : ""}
            ${appointmentDetails.notes ? `<p style="margin: 8px 0;"><strong>Notes:</strong> ${appointmentDetails.notes}</p>` : ""}
          </div>
          
          <div style="background: #e0f2ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7CB8EA;">
            <p style="color: #0369a1; margin: 0; font-weight: 500;">
              \u{1F4CE} <strong>Add to Calendar:</strong> Click the attached .ics file to add this appointment to your Google Calendar, Outlook, Apple Calendar, or any calendar app.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <div style="text-align: center;">
            <p style="color: #999; font-size: 14px; margin: 5px 0;">
              <strong>${appointmentDetails.businessName}</strong>
            </p>
            ${appointmentDetails.businessPhone ? `<p style="color: #999; font-size: 14px; margin: 5px 0;">\u{1F4DE} ${appointmentDetails.businessPhone}</p>` : ""}
            <p style="color: #999; font-size: 14px; margin: 5px 0;">\u{1F4E7} ${appointmentDetails.businessEmail}</p>
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
${appointmentDetails.businessAddress ? `- Location: ${appointmentDetails.businessAddress}` : ""}
${appointmentDetails.notes ? `- Notes: ${appointmentDetails.notes}` : ""}

Add to Calendar: Open the attached .ics file to add this appointment to your calendar.

${appointmentDetails.businessName}
${appointmentDetails.businessPhone ? `Phone: ${appointmentDetails.businessPhone}` : ""}
Email: ${appointmentDetails.businessEmail}
      `;
          const info = await transporter.sendMail({
            from: `"${config.smtpFromName}" <${config.smtpFromEmail}>`,
            to: recipientEmail,
            subject,
            html: htmlContent,
            text: textContent,
            attachments: [
              {
                filename: "appointment.ics",
                content: icsContent,
                contentType: "text/calendar; charset=utf-8; method=REQUEST"
              }
            ],
            // Also set calendar content in the main body for better email client support
            icalEvent: {
              filename: "appointment.ics",
              method: "REQUEST",
              content: icsContent
            }
          });
          return {
            success: true,
            message: `Calendar invite sent successfully to ${recipientEmail}. Message ID: ${info.messageId}`
          };
        } catch (error) {
          console.error("Calendar invite sending error:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
          return {
            success: false,
            message: `Failed to send calendar invite: ${errorMessage}`
          };
        }
      }
    };
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import Stripe from "stripe";
import express from "express";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiVoiceAgents: () => aiVoiceAgents,
  appointmentSlots: () => appointmentSlots,
  appointmentTransfers: () => appointmentTransfers,
  appointments: () => appointments,
  clientServices: () => clientServices,
  clientServicesStripe: () => clientServicesStripe,
  clientWebsites: () => clientWebsites,
  clients: () => clients,
  contactMessages: () => contactMessages,
  domainConfigurations: () => domainConfigurations,
  domainVerificationLogs: () => domainVerificationLogs,
  googleBusinessProfiles: () => googleBusinessProfiles,
  insertAIVoiceAgentSchema: () => insertAIVoiceAgentSchema,
  insertAppointmentSchema: () => insertAppointmentSchema,
  insertAppointmentSlotSchema: () => insertAppointmentSlotSchema,
  insertAppointmentTransferSchema: () => insertAppointmentTransferSchema,
  insertClientSchema: () => insertClientSchema,
  insertClientServiceSchema: () => insertClientServiceSchema,
  insertClientServicesStripeSchema: () => insertClientServicesStripeSchema,
  insertClientWebsiteSchema: () => insertClientWebsiteSchema,
  insertContactMessageSchema: () => insertContactMessageSchema,
  insertDomainConfigurationSchema: () => insertDomainConfigurationSchema,
  insertDomainVerificationLogSchema: () => insertDomainVerificationLogSchema,
  insertGoogleBusinessProfileSchema: () => insertGoogleBusinessProfileSchema,
  insertLeadSchema: () => insertLeadSchema,
  insertNewsletterSubscriptionSchema: () => insertNewsletterSubscriptionSchema,
  insertOnboardingSessionSchema: () => insertOnboardingSessionSchema,
  insertOperatingHoursSchema: () => insertOperatingHoursSchema,
  insertPaymentSchema: () => insertPaymentSchema,
  insertPlanSchema: () => insertPlanSchema,
  insertPlatformReviewSchema: () => insertPlatformReviewSchema,
  insertReviewPlatformConnectionSchema: () => insertReviewPlatformConnectionSchema,
  insertReviewPlatformSchema: () => insertReviewPlatformSchema,
  insertReviewSchema: () => insertReviewSchema,
  insertServicePricingTierSchema: () => insertServicePricingTierSchema,
  insertServiceSchema: () => insertServiceSchema,
  insertStylistSchema: () => insertStylistSchema,
  insertTeamMemberSchema: () => insertTeamMemberSchema,
  insertUserSchema: () => insertUserSchema,
  insertWebsiteStaffSchema: () => insertWebsiteStaffSchema,
  insertWebsiteTestimonialSchema: () => insertWebsiteTestimonialSchema,
  leads: () => leads,
  newsletterSubscriptions: () => newsletterSubscriptions,
  onboardingSessions: () => onboardingSessions,
  operatingHours: () => operatingHours,
  payments: () => payments,
  plans: () => plans,
  platformReviews: () => platformReviews,
  reviewPlatformConnections: () => reviewPlatformConnections,
  reviewPlatforms: () => reviewPlatforms,
  reviews: () => reviews,
  servicePricingTiers: () => servicePricingTiers,
  services: () => services,
  stylists: () => stylists,
  teamMembers: () => teamMembers,
  users: () => users,
  websiteStaff: () => websiteStaff,
  websiteTestimonials: () => websiteTestimonials
});
import { pgTable, text, serial, integer, boolean, timestamp, varchar, real, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("CLIENT"),
  // SUPER_ADMIN or CLIENT
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true
});
var plans = pgTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // Monthly pricing
  monthlyPrice: real("monthly_price"),
  monthlyDiscount: real("monthly_discount").default(0),
  // Percentage discount 0-100
  monthlyEnabled: boolean("monthly_enabled").default(true),
  // Yearly pricing  
  yearlyPrice: real("yearly_price"),
  yearlyDiscount: real("yearly_discount").default(0),
  // Percentage discount 0-100
  yearlyEnabled: boolean("yearly_enabled").default(true),
  features: text("features").array().notNull(),
  maxUsers: integer("max_users").notNull(),
  storageGB: integer("storage_gb").notNull(),
  isActive: boolean("is_active").default(true),
  isFreeTrial: boolean("is_free_trial").default(false),
  trialDays: integer("trial_days").default(0),
  // Stripe integration - separate for monthly/yearly
  monthlyStripePriceId: text("monthly_stripe_price_id"),
  // Stripe Price ID for monthly
  yearlyStripePriceId: text("yearly_stripe_price_id"),
  // Stripe Price ID for yearly
  stripeProductId: text("stripe_product_id"),
  // Stripe Product ID (shared)
  createdAt: timestamp("created_at").defaultNow()
});
var insertPlanSchema = createInsertSchema(plans).pick({
  name: true,
  monthlyPrice: true,
  monthlyDiscount: true,
  monthlyEnabled: true,
  yearlyPrice: true,
  yearlyDiscount: true,
  yearlyEnabled: true,
  features: true,
  maxUsers: true,
  storageGB: true,
  isActive: true,
  isFreeTrial: true,
  trialDays: true
});
var onboardingSessions = pgTable("onboarding_sessions", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  planId: text("plan_id").notNull(),
  currentStep: integer("current_step").default(1),
  isCompleted: boolean("is_completed").default(false),
  businessData: text("business_data"),
  // JSON string
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at")
});
var insertOnboardingSessionSchema = createInsertSchema(onboardingSessions).pick({
  sessionId: true,
  planId: true,
  currentStep: true,
  businessData: true
});
var clients = pgTable("clients", {
  id: text("id").primaryKey(),
  businessName: text("business_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  businessAddress: text("business_address"),
  industry: text("industry"),
  businessDescription: text("business_description"),
  logoUrl: text("logo_url"),
  operatingHours: text("operating_hours"),
  // JSON string
  timeZone: text("time_zone"),
  planId: text("plan_id").notNull(),
  status: text("status").notNull().default("TRIAL"),
  // TRIAL, ACTIVE, INACTIVE, CANCELLED
  userId: text("user_id").notNull().unique(),
  onboardingSessionId: text("onboarding_session_id"),
  stripeCustomerId: text("stripe_customer_id"),
  // Stripe Customer ID
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Stripe Subscription ID for plan billing
  stripePublicKey: text("stripe_public_key"),
  // Client's own Stripe public key
  stripeSecretKey: text("stripe_secret_key"),
  // Client's own Stripe secret key (encrypted)
  stripeAccountId: text("stripe_account_id"),
  // Stripe Connect Account ID for direct payments
  // SMTP Email Configuration
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUsername: text("smtp_username"),
  smtpPassword: text("smtp_password"),
  // Encrypted in production
  smtpFromEmail: text("smtp_from_email"),
  smtpFromName: text("smtp_from_name"),
  smtpSecure: boolean("smtp_secure").default(true),
  // Use TLS/SSL
  smtpEnabled: boolean("smtp_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login")
});
var insertClientSchema = createInsertSchema(clients).pick({
  businessName: true,
  contactPerson: true,
  email: true,
  phone: true,
  businessAddress: true,
  industry: true,
  businessDescription: true,
  logoUrl: true,
  operatingHours: true,
  timeZone: true,
  planId: true,
  status: true,
  userId: true,
  onboardingSessionId: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  stripePublicKey: true,
  stripeSecretKey: true,
  stripeAccountId: true,
  smtpHost: true,
  smtpPort: true,
  smtpUsername: true,
  smtpPassword: true,
  smtpFromEmail: true,
  smtpFromName: true,
  smtpSecure: true,
  smtpEnabled: true
});
var services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: text("price").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  category: text("category")
});
var insertServiceSchema = createInsertSchema(services).pick({
  name: true,
  description: true,
  price: true,
  durationMinutes: true,
  category: true
});
var reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  date: timestamp("date").defaultNow(),
  publishConsent: boolean("publish_consent").default(false),
  published: boolean("published").default(false)
});
var insertReviewSchema = createInsertSchema(reviews).pick({
  name: true,
  email: true,
  rating: true,
  text: true,
  publishConsent: true
});
var clientServices = pgTable("client_services", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  category: text("category"),
  isActive: boolean("is_active").default(true),
  stripeProductId: text("stripe_product_id"),
  // Stripe Product ID for this service
  stripePriceId: text("stripe_price_id"),
  // Stripe Price ID for this service
  enableOnlinePayments: boolean("enable_online_payments").default(false),
  // Whether online payments are enabled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertClientServiceSchema = createInsertSchema(clientServices).pick({
  clientId: true,
  name: true,
  description: true,
  price: true,
  durationMinutes: true,
  category: true,
  isActive: true,
  stripeProductId: true,
  stripePriceId: true,
  enableOnlinePayments: true
});
var clientServicesStripe = pgTable("client_services_stripe", {
  id: text("id").primaryKey(),
  serviceId: text("service_id").notNull(),
  clientId: text("client_id").notNull(),
  stripePriceId: text("stripe_price_id").notNull(),
  stripeProductId: text("stripe_product_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertClientServicesStripeSchema = createInsertSchema(clientServicesStripe).pick({
  serviceId: true,
  clientId: true,
  stripePriceId: true,
  stripeProductId: true,
  isActive: true
});
var appointments = pgTable("appointments", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  serviceId: text("service_id").notNull(),
  assignedTo: text("assigned_to"),
  // Team member ID assigned to this appointment
  appointmentDate: timestamp("appointment_date").notNull(),
  startTime: text("start_time").notNull(),
  // HH:MM format
  endTime: text("end_time").notNull(),
  status: text("status").notNull().default("SCHEDULED"),
  // SCHEDULED, CONFIRMED, COMPLETED, CANCELLED
  notes: text("notes"),
  totalPrice: real("total_price").notNull(),
  paymentMethod: text("payment_method").default("CASH"),
  // CASH, ONLINE
  paymentStatus: text("payment_status").default("PENDING"),
  // PENDING, PAID, FAILED
  paymentIntentId: text("payment_intent_id"),
  // Stripe Payment Intent ID
  emailConfirmation: boolean("email_confirmation").default(true),
  smsConfirmation: boolean("sms_confirmation").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertAppointmentSchema = createInsertSchema(appointments).pick({
  clientId: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  serviceId: true,
  assignedTo: true,
  appointmentDate: true,
  startTime: true,
  endTime: true,
  status: true,
  notes: true,
  totalPrice: true,
  paymentMethod: true,
  paymentStatus: true,
  paymentIntentId: true,
  emailConfirmation: true,
  smsConfirmation: true
});
var appointmentTransfers = pgTable("appointment_transfers", {
  id: text("id").primaryKey(),
  appointmentId: text("appointment_id").notNull(),
  clientId: text("client_id").notNull(),
  fromStaffId: text("from_staff_id"),
  // Null if not previously assigned
  toStaffId: text("to_staff_id").notNull(),
  transferredBy: text("transferred_by").notNull(),
  // Admin/Manager who performed the transfer
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertAppointmentTransferSchema = createInsertSchema(appointmentTransfers).pick({
  appointmentId: true,
  clientId: true,
  fromStaffId: true,
  toStaffId: true,
  transferredBy: true,
  reason: true
});
var operatingHours = pgTable("operating_hours", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  // 0=Sunday, 1=Monday, etc.
  isOpen: boolean("is_open").default(true),
  openTime: text("open_time"),
  // HH:MM format
  closeTime: text("close_time"),
  // HH:MM format
  breakStartTime: text("break_start_time"),
  breakEndTime: text("break_end_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertOperatingHoursSchema = createInsertSchema(operatingHours).pick({
  clientId: true,
  dayOfWeek: true,
  isOpen: true,
  openTime: true,
  closeTime: true,
  breakStartTime: true,
  breakEndTime: true
});
var leads = pgTable("leads", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  source: text("source").notNull(),
  // website, phone, referral, social, etc.
  status: text("status").notNull().default("NEW"),
  // NEW, CONTACTED, QUALIFIED, CONVERTED, LOST
  notes: text("notes"),
  interestedServices: text("interested_services").array().default([]),
  estimatedValue: real("estimated_value"),
  followUpDate: timestamp("follow_up_date"),
  convertedToAppointment: boolean("converted_to_appointment").default(false),
  appointmentId: text("appointment_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertLeadSchema = createInsertSchema(leads).pick({
  clientId: true,
  name: true,
  email: true,
  phone: true,
  source: true,
  status: true,
  notes: true,
  interestedServices: true,
  estimatedValue: true,
  followUpDate: true,
  convertedToAppointment: true,
  appointmentId: true
});
var clientWebsites = pgTable("client_websites", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  subdomain: text("subdomain").notNull().unique(),
  // e.g., "johns-salon"
  customDomain: text("custom_domain"),
  // e.g., "johnssalon.com"
  title: text("title").notNull(),
  description: text("description"),
  heroImage: text("hero_image"),
  primaryColor: text("primary_color").default("#3B82F6"),
  secondaryColor: text("secondary_color").default("#F3F4F6"),
  contactInfo: text("contact_info"),
  // JSON string
  socialLinks: text("social_links"),
  // JSON string
  sections: text("sections"),
  // JSON string for website sections
  showPrices: boolean("show_prices").default(true),
  allowOnlineBooking: boolean("allow_online_booking").default(true),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertClientWebsiteSchema = createInsertSchema(clientWebsites).pick({
  clientId: true,
  subdomain: true,
  customDomain: true,
  title: true,
  description: true,
  heroImage: true,
  primaryColor: true,
  secondaryColor: true,
  contactInfo: true,
  socialLinks: true,
  sections: true,
  showPrices: true,
  allowOnlineBooking: true,
  isPublished: true
});
var appointmentSlots = pgTable("appointment_slots", {
  id: varchar("id").primaryKey().notNull(),
  clientId: varchar("client_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  // 0-6 (Sunday-Saturday)
  startTime: varchar("start_time").notNull(),
  // "09:00"
  endTime: varchar("end_time").notNull(),
  // "17:00"
  slotDuration: integer("slot_duration").default(30),
  // minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertAppointmentSlotSchema = createInsertSchema(appointmentSlots).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var teamMembers = pgTable("team_members", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("STAFF"),
  // ADMIN, STAFF, MANAGER
  permissions: text("permissions").array().default([]),
  // Array of permission strings
  isActive: boolean("is_active").default(true),
  hourlyRate: real("hourly_rate"),
  specializations: text("specializations").array().default([]),
  workingHours: text("working_hours"),
  // JSON string with schedule
  password: text("password").notNull(),
  // Hashed password for authentication
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
  clientId: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  permissions: true,
  isActive: true,
  hourlyRate: true,
  specializations: true,
  workingHours: true,
  password: true
});
var payments = pgTable("payments", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  appointmentId: text("appointment_id"),
  paymentMethod: text("payment_method").notNull(),
  // STRIPE, PAYPAL, VENMO, ZELLE, CASH
  paymentProvider: text("payment_provider"),
  // stripe, paypal, etc.
  paymentIntentId: text("payment_intent_id"),
  // External payment ID
  amount: real("amount").notNull(),
  currency: text("currency").default("USD"),
  status: text("status").notNull().default("PENDING"),
  // PENDING, COMPLETED, FAILED, REFUNDED
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  description: text("description"),
  metadata: text("metadata"),
  // JSON string for additional data
  processingFee: real("processing_fee"),
  netAmount: real("net_amount"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  paidAt: timestamp("paid_at")
});
var insertPaymentSchema = createInsertSchema(payments).pick({
  clientId: true,
  appointmentId: true,
  paymentMethod: true,
  paymentProvider: true,
  paymentIntentId: true,
  amount: true,
  currency: true,
  status: true,
  customerName: true,
  customerEmail: true,
  description: true,
  metadata: true,
  processingFee: true,
  netAmount: true,
  paidAt: true
});
var aiVoiceAgents = pgTable("ai_voice_agents", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  agentName: text("agent_name").notNull(),
  voiceType: text("voice_type").default("PROFESSIONAL"),
  // PROFESSIONAL, FRIENDLY, CASUAL
  language: text("language").default("en-US"),
  isActive: boolean("is_active").default(false),
  welcomeMessage: text("welcome_message"),
  businessHours: text("business_hours"),
  // JSON string
  availableServices: text("available_services").array().default([]),
  bookingEnabled: boolean("booking_enabled").default(true),
  transcriptionEnabled: boolean("transcription_enabled").default(true),
  twilioPhoneNumber: text("twilio_phone_number"),
  callVolume: integer("call_volume").default(0),
  lastCallAt: timestamp("last_call_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertAIVoiceAgentSchema = createInsertSchema(aiVoiceAgents).pick({
  clientId: true,
  agentName: true,
  voiceType: true,
  language: true,
  isActive: true,
  welcomeMessage: true,
  businessHours: true,
  availableServices: true,
  bookingEnabled: true,
  transcriptionEnabled: true,
  twilioPhoneNumber: true
});
var googleBusinessProfiles = pgTable("google_business_profiles", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  businessName: text("business_name").notNull(),
  googlePlaceId: text("google_place_id"),
  googleAccountId: text("google_account_id"),
  // Google account ID from OAuth
  locationId: text("location_id"),
  // Google Business Profile location ID
  oauthConnected: boolean("oauth_connected").default(false),
  verificationStatus: text("verification_status").notNull().default("UNLINKED"),
  // UNLINKED, LINKED_UNVERIFIED, PENDING_VERIFICATION, VERIFIED, FAILED
  verificationSource: text("verification_source"),
  // GOOGLE, MANUAL
  averageRating: real("average_rating"),
  totalReviews: integer("total_reviews").default(0),
  businessHours: text("business_hours"),
  // JSON string
  businessDescription: text("business_description"),
  businessCategories: text("business_categories").array().default([]),
  businessPhotos: text("business_photos").array().default([]),
  website: text("website"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  postalCode: text("postal_code"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertGoogleBusinessProfileSchema = createInsertSchema(googleBusinessProfiles).pick({
  clientId: true,
  businessName: true,
  googlePlaceId: true,
  googleAccountId: true,
  locationId: true,
  oauthConnected: true,
  verificationStatus: true,
  verificationSource: true,
  averageRating: true,
  totalReviews: true,
  businessHours: true,
  businessDescription: true,
  businessCategories: true,
  businessPhotos: true,
  website: true,
  phoneNumber: true,
  address: true,
  postalCode: true,
  city: true,
  state: true,
  country: true,
  latitude: true,
  longitude: true,
  lastSyncAt: true
});
var reviewPlatforms = pgTable("landing_review_platforms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // e.g., "Google", "Yelp", "Trust Pilot"
  displayName: text("display_name").notNull(),
  // e.g., "Google Reviews"
  rating: real("rating").notNull(),
  // e.g., 4.9
  maxRating: real("max_rating").notNull().default(5),
  // e.g., 5
  reviewCount: integer("review_count"),
  // Optional: number of reviews
  logoUrl: text("logo_url"),
  // Optional: logo image URL
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  // For ordering on frontend
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertReviewPlatformSchema = createInsertSchema(reviewPlatforms).pick({
  name: true,
  displayName: true,
  rating: true,
  maxRating: true,
  reviewCount: true,
  logoUrl: true,
  isActive: true,
  sortOrder: true
});
var domainConfigurations = pgTable("domain_configurations", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  domainType: text("domain_type").notNull(),
  // ADMIN_PORTAL, CLIENT_WEBSITE
  domain: text("domain").notNull(),
  // e.g., "admin.mybusiness.com" or "mybusiness.com"
  subdomain: text("subdomain"),
  // e.g., "admin" or "www" 
  isActive: boolean("is_active").default(false),
  verificationStatus: text("verification_status").default("PENDING"),
  // PENDING, VERIFIED, FAILED
  verificationToken: text("verification_token"),
  // For domain verification
  verificationMethod: text("verification_method").default("DNS_TXT"),
  // DNS_TXT, FILE_UPLOAD, CNAME
  sslStatus: text("ssl_status").default("PENDING"),
  // PENDING, ACTIVE, FAILED, EXPIRED
  sslCertificateId: text("ssl_certificate_id"),
  // External SSL cert reference
  sslIssuedAt: timestamp("ssl_issued_at"),
  sslExpiresAt: timestamp("ssl_expires_at"),
  dnsRecords: text("dns_records"),
  // JSON string of required DNS records
  redirectToHttps: boolean("redirect_to_https").default(true),
  // customSettings: text("custom_settings"), // Column doesn't exist in Coolify production DB
  // lastCheckedAt: timestamp("last_checked_at"), // Column doesn't exist in Coolify production DB
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertDomainConfigurationSchema = createInsertSchema(domainConfigurations).pick({
  clientId: true,
  domainType: true,
  domain: true,
  subdomain: true,
  isActive: true,
  verificationStatus: true,
  verificationToken: true,
  verificationMethod: true,
  sslStatus: true,
  sslCertificateId: true,
  sslIssuedAt: true,
  sslExpiresAt: true,
  dnsRecords: true,
  redirectToHttps: true,
  // customSettings: true, // Column doesn't exist in Coolify production DB
  // lastCheckedAt: true, // Column doesn't exist in Coolify production DB
  verifiedAt: true
});
var domainVerificationLogs = pgTable("domain_verification_logs", {
  id: text("id").primaryKey(),
  domainConfigId: text("domain_config_id").notNull(),
  verificationAttempt: integer("verification_attempt").default(1),
  verificationMethod: text("verification_method").notNull(),
  status: text("status").notNull(),
  // SUCCESS, FAILED, TIMEOUT
  errorMessage: text("error_message"),
  verificationData: text("verification_data"),
  // JSON string with verification details
  responseTime: integer("response_time"),
  // milliseconds
  createdAt: timestamp("created_at").defaultNow()
});
var insertDomainVerificationLogSchema = createInsertSchema(domainVerificationLogs).pick({
  domainConfigId: true,
  verificationAttempt: true,
  verificationMethod: true,
  status: true,
  errorMessage: true,
  verificationData: true,
  responseTime: true
});
var newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  status: text("status").notNull().default("ACTIVE"),
  // ACTIVE, UNSUBSCRIBED, BOUNCED
  source: text("source").default("WEBSITE"),
  // WEBSITE, ADMIN, IMPORT
  metadata: text("metadata"),
  // JSON string for additional data
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions).pick({
  clientId: true,
  email: true,
  name: true,
  status: true,
  source: true,
  metadata: true,
  subscribedAt: true,
  unsubscribedAt: true
});
var websiteStaff = pgTable("website_staff", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  // URL to profile image
  experience: text("experience"),
  // e.g., "8 years experience"
  specialties: text("specialties").array().default([]),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  teamMemberId: text("team_member_id"),
  // Link to team members table if applicable
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertWebsiteStaffSchema = createInsertSchema(websiteStaff).pick({
  clientId: true,
  name: true,
  title: true,
  bio: true,
  profileImage: true,
  experience: true,
  specialties: true,
  displayOrder: true,
  isActive: true,
  teamMemberId: true
});
var servicePricingTiers = pgTable("service_pricing_tiers", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  // e.g., "Hair Dryer", "Hair Washer"
  price: real("price").notNull(),
  currency: text("currency").default("USD"),
  duration: text("duration"),
  // e.g., "30 min", "1 hour"
  features: text("features").array().default([]),
  // Array of included features
  isPopular: boolean("is_popular").default(false),
  // Highlight this tier
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  buttonText: text("button_text").default("Book Now"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertServicePricingTierSchema = createInsertSchema(servicePricingTiers).pick({
  clientId: true,
  name: true,
  price: true,
  currency: true,
  duration: true,
  features: true,
  isPopular: true,
  displayOrder: true,
  isActive: true,
  buttonText: true,
  description: true
});
var websiteTestimonials = pgTable("website_testimonials", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerTitle: text("customer_title"),
  // e.g., "Hair Influencer"
  testimonialText: text("testimonial_text").notNull(),
  customerImage: text("customer_image"),
  // URL to customer photo
  rating: integer("rating").default(5),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  source: text("source").default("WEBSITE"),
  // WEBSITE, GOOGLE, YELP, MANUAL
  reviewId: text("review_id"),
  // Link to reviews table if applicable
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertWebsiteTestimonialSchema = createInsertSchema(websiteTestimonials).pick({
  clientId: true,
  customerName: true,
  customerTitle: true,
  testimonialText: true,
  customerImage: true,
  rating: true,
  isActive: true,
  displayOrder: true,
  source: true,
  reviewId: true
});
var stylists = pgTable("stylists", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  specializations: text("specializations").array().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertStylistSchema = createInsertSchema(stylists).pick({
  clientId: true,
  name: true,
  email: true,
  specializations: true,
  isActive: true
});
var reviewPlatformConnections = pgTable("review_platform_connections", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  platform: text("platform").notNull(),
  // GOOGLE, YELP, TRUSTPILOT
  platformAccountId: text("platform_account_id"),
  // External account ID
  apiKey: text("api_key"),
  // Encrypted API key
  accessToken: text("access_token"),
  // OAuth token if needed
  refreshToken: text("refresh_token"),
  // OAuth refresh token
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  averageRating: real("average_rating"),
  totalReviews: integer("total_reviews").default(0),
  platformUrl: text("platform_url"),
  // URL to the business profile on the platform
  syncFrequency: text("sync_frequency").default("DAILY"),
  // HOURLY, DAILY, WEEKLY
  errorMessage: text("error_message"),
  // Last sync error if any
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertReviewPlatformConnectionSchema = createInsertSchema(reviewPlatformConnections).pick({
  clientId: true,
  platform: true,
  platformAccountId: true,
  apiKey: true,
  accessToken: true,
  refreshToken: true,
  isActive: true,
  lastSyncAt: true,
  averageRating: true,
  totalReviews: true,
  platformUrl: true,
  syncFrequency: true,
  errorMessage: true
});
var platformReviews = pgTable("platform_reviews", {
  id: text("id").primaryKey(),
  connectionId: text("connection_id").notNull(),
  clientId: text("client_id").notNull(),
  platform: text("platform").notNull(),
  // GOOGLE, YELP, TRUSTPILOT
  externalReviewId: text("external_review_id").notNull(),
  // Platform's review ID
  customerName: text("customer_name").notNull(),
  customerAvatar: text("customer_avatar"),
  // Profile picture URL
  rating: integer("rating").notNull(),
  // 1-5 stars
  reviewText: text("review_text"),
  reviewDate: timestamp("review_date").notNull(),
  businessResponse: text("business_response"),
  // Business owner reply
  businessResponseDate: timestamp("business_response_date"),
  isVerified: boolean("is_verified").default(false),
  // Platform verification status
  helpfulCount: integer("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertPlatformReviewSchema = createInsertSchema(platformReviews).pick({
  connectionId: true,
  clientId: true,
  platform: true,
  externalReviewId: true,
  customerName: true,
  customerAvatar: true,
  rating: true,
  reviewText: true,
  reviewDate: true,
  businessResponse: true,
  businessResponseDate: true,
  isVerified: true,
  helpfulCount: true
});
var contactMessages = pgTable("contact_messages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  source: text("source").default("website"),
  // website, referral, etc.
  status: text("status").default("NEW"),
  // NEW, CONTACTED, CONVERTED, CLOSED
  notes: text("notes"),
  // Internal admin notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertContactMessageSchema = createInsertSchema(contactMessages).pick({
  name: true,
  email: true,
  subject: true,
  message: true,
  source: true,
  status: true,
  notes: true
});

// server/storage.ts
init_dns_verification();
import { promises as fs } from "fs";
import path from "path";

// server/db.ts
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as PgPool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import ws from "ws";
var isReplit = !!process.env.REPL_ID;
var isCoolify = process.env.DEPLOY_TARGET === "coolify";
var isProduction = true;
var hasDatabaseUrl = !!process.env.DATABASE_URL;
console.log(`\u{1F527} Database Environment Detection:`);
console.log(`  - Replit: ${isReplit ? "Yes" : "No"}`);
console.log(`  - Coolify: ${isCoolify ? "Yes" : "No"}`);
console.log(`  - Production: ${isProduction ? "Yes" : "No"}`);
console.log(`  - DATABASE_URL present: ${hasDatabaseUrl ? "Yes" : "No"}`);
var pool = null;
var db = null;
var requiresDatabase = (isCoolify || isProduction) && !isReplit;
if (hasDatabaseUrl) {
  if (isCoolify) {
    console.log(`\u2705 Initializing Coolify PostgreSQL connection`);
    pool = new PgPool({ connectionString: process.env.DATABASE_URL });
    db = drizzlePg(pool, { schema: schema_exports });
  } else {
    console.log(`\u2705 Initializing Neon PostgreSQL connection`);
    neonConfig.webSocketConstructor = ws;
    pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
    db = drizzleNeon(pool, { schema: schema_exports });
  }
} else if (requiresDatabase) {
  console.error(`\u274C DATABASE_URL is required for production deployment`);
  throw new Error(
    "DATABASE_URL must be set for production deployment. Please configure your database connection in Coolify."
  );
} else {
  console.log(`\u2139\uFE0F  DATABASE_URL not found - this is expected for development with MemStorage`);
}

// server/storage.ts
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
var MemStorage = class {
  static {
    __name(this, "MemStorage");
  }
  users = [];
  plans = [];
  onboardingSessions = [];
  clients = [];
  services = [];
  reviews = [];
  clientServices = [];
  appointments = [];
  appointmentTransfers = [];
  operatingHours = [];
  leads = [];
  payments = [];
  contactMessages = [];
  contactMessagesFile = path.join(process.cwd(), "data", "contact-messages.json");
  clientWebsites = [
    {
      id: "website_1",
      clientId: "client_1",
      subdomain: "abc-consulting",
      customDomain: null,
      title: "ABC Consulting - Professional Services",
      description: "ABC Consulting - Consulting services",
      heroImage: null,
      primaryColor: "#3B82F6",
      secondaryColor: "#F3F4F6",
      contactInfo: '{"phone": "555-0101", "email": "john@abcconsulting.com"}',
      socialLinks: "{}",
      sections: '[{"id":"hero","type":"hero","title":"Welcome to ABC Consulting","content":"Professional consulting services for all your needs.","settings":{"backgroundColor":"#3B82F6","textColor":"#FFFFFF","alignment":"center","padding":"large"}},{"id":"about","type":"about","title":"About ABC Consulting","content":"Located at 123 Main St, City, State, we are dedicated to providing exceptional consulting services.","settings":{"backgroundColor":"#FFFFFF","textColor":"#1F2937","alignment":"left","padding":"medium"}}]',
      showPrices: true,
      allowOnlineBooking: true,
      isPublished: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }
  ];
  appointmentSlots = [];
  teamMembers = [];
  googleBusinessProfiles = [];
  reviewPlatforms = [];
  reviewPlatformConnections = [];
  platformReviews = [];
  domainConfigurations = [];
  domainVerificationLogs = [];
  newsletterSubscriptions = [];
  websiteStaff = [];
  servicePricingTiers = [];
  websiteTestimonials = [];
  constructor() {
    const shouldSeedDemo = process.env.SEED_DEMO_DATA === "true" || false;
    if (shouldSeedDemo) {
      console.log("\u{1F331} Seeding demo data for development...");
      this.initializeData();
    } else {
      console.log("\u{1F6AB} Demo data seeding skipped (production environment)");
    }
  }
  async initializeData() {
    await this.createUser({
      email: "admin@saas.com",
      password: "admin123",
      role: "SUPER_ADMIN"
    });
    await this.createReviewPlatform({
      name: "google",
      displayName: "Google",
      rating: 4.9,
      maxRating: 5,
      reviewCount: 245,
      logoUrl: null,
      isActive: true,
      sortOrder: 1
    });
    await this.createReviewPlatform({
      name: "trustpilot",
      displayName: "Trust Pilot",
      rating: 4.8,
      maxRating: 5,
      reviewCount: 189,
      logoUrl: null,
      isActive: true,
      sortOrder: 2
    });
    await this.createReviewPlatform({
      name: "yelp",
      displayName: "Yelp",
      rating: 4.7,
      maxRating: 5,
      reviewCount: 132,
      logoUrl: null,
      isActive: true,
      sortOrder: 3
    });
    await this.createPlan({
      name: "Free Demo",
      monthlyPrice: 0,
      monthlyEnabled: true,
      features: ["7-day trial", "1 User", "2GB Storage", "Basic Features"],
      maxUsers: 1,
      storageGB: 2,
      isActive: true,
      isFreeTrial: true,
      trialDays: 7
    });
    await this.createPlan({
      name: "Basic",
      monthlyPrice: 15,
      monthlyEnabled: true,
      features: ["1 User", "10GB Storage", "Basic Support", "Online Booking", "Client Management"],
      maxUsers: 1,
      storageGB: 10,
      isActive: true,
      isFreeTrial: false,
      trialDays: 0
    });
    await this.createPlan({
      name: "Team",
      monthlyPrice: 99.99,
      monthlyEnabled: true,
      features: ["5 Users", "100GB Storage", "Priority Support", "Advanced Analytics"],
      maxUsers: 5,
      storageGB: 100,
      isActive: true,
      isFreeTrial: false,
      trialDays: 0
    });
    await this.createUser({
      email: "john@abcconsulting.com",
      password: "demo123",
      role: "CLIENT"
    });
    await this.createUser({
      email: "jane@techstartup.com",
      password: "demo123",
      role: "CLIENT"
    });
    await this.createClient({
      businessName: "ABC Consulting",
      contactPerson: "John Smith",
      email: "john@abcconsulting.com",
      phone: "555-0101",
      planId: "plan_2",
      status: "ACTIVE",
      userId: "user_2",
      businessAddress: "123 Main St, City, State",
      industry: "Consulting"
    });
    await this.createClient({
      businessName: "Tech Startup Inc",
      contactPerson: "Jane Doe",
      email: "jane@techstartup.com",
      phone: "555-0102",
      planId: "plan_3",
      status: "TRIAL",
      userId: "user_3",
      businessAddress: "456 Tech Ave, City, State",
      industry: "Technology"
    });
    await this.createClientService({
      clientId: "client_1",
      name: "Business Consultation",
      description: "Comprehensive business strategy and consultation services",
      price: 150,
      durationMinutes: 60,
      category: "Consulting",
      isActive: true
    });
    await this.createClientService({
      clientId: "client_1",
      name: "Financial Planning",
      description: "Expert financial planning and investment advice",
      price: 200,
      durationMinutes: 90,
      category: "Consulting",
      isActive: true
    });
    await this.createClientService({
      clientId: "client_1",
      name: "Market Analysis",
      description: "In-depth market research and competitive analysis",
      price: 300,
      durationMinutes: 120,
      category: "Research",
      isActive: true
    });
    await this.createAppointmentSlot({
      clientId: "client_1",
      dayOfWeek: 1,
      // Monday
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      isActive: true
    });
    await this.createAppointmentSlot({
      clientId: "client_1",
      dayOfWeek: 2,
      // Tuesday
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      isActive: true
    });
    await this.createAppointmentSlot({
      clientId: "client_1",
      dayOfWeek: 3,
      // Wednesday
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      isActive: true
    });
    await this.createAppointmentSlot({
      clientId: "client_1",
      dayOfWeek: 4,
      // Thursday
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      isActive: true
    });
    await this.createAppointmentSlot({
      clientId: "client_1",
      dayOfWeek: 5,
      // Friday
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      isActive: true
    });
    await this.createTeamMember({
      clientId: "client_1",
      name: "Khisal Test",
      email: "khisal@test.com",
      role: "MANAGER",
      password: "password123",
      permissions: ["overview.view", "appointments.view", "appointments.create", "appointments.edit", "services.view", "team.view"],
      isActive: true
    });
    await this.createWebsiteStaff({
      clientId: "client_1",
      name: "Mara Olsen",
      title: "Senior Stylist",
      bio: "Specialized in modern cuts and styling with over 8 years of experience.",
      profileImage: "/src/assets/Ellipse 54_1757064789129.png",
      experience: "8 years experience",
      specialties: ["Hair Cutting", "Styling", "Color"],
      displayOrder: 1,
      isActive: true
    });
    await this.createWebsiteStaff({
      clientId: "client_1",
      name: "Jess Nunez",
      title: "Hair Specialist",
      bio: "Expert in hair treatments and restoration with a passion for healthy hair.",
      profileImage: "/src/assets/Ellipse 55_1757064789130.png",
      experience: "6 years experience",
      specialties: ["Hair Treatment", "Restoration", "Conditioning"],
      displayOrder: 2,
      isActive: true
    });
    await this.createWebsiteStaff({
      clientId: "client_1",
      name: "Dana Welch",
      title: "Color Expert",
      bio: "Creative colorist specializing in bold and natural color transformations.",
      profileImage: "/src/assets/Ellipse 56_1757064789130.png",
      experience: "5 years experience",
      specialties: ["Hair Coloring", "Highlights", "Color Correction"],
      displayOrder: 3,
      isActive: true
    });
    await this.createServicePricingTier({
      clientId: "client_1",
      name: "Hair Dryer",
      price: 30,
      currency: "USD",
      duration: "30 min",
      features: ["Basic wash", "Blow dry", "Simple styling"],
      isPopular: false,
      displayOrder: 1,
      isActive: true,
      buttonText: "Book Now",
      description: "Quick wash and dry service"
    });
    await this.createServicePricingTier({
      clientId: "client_1",
      name: "Hair Washer",
      price: 40,
      currency: "USD",
      duration: "45 min",
      features: ["Deep cleanse", "Conditioning treatment", "Scalp massage", "Basic styling"],
      isPopular: false,
      displayOrder: 2,
      isActive: true,
      buttonText: "Book Now",
      description: "Premium wash and conditioning service"
    });
    await this.createServicePricingTier({
      clientId: "client_1",
      name: "Hair Developer",
      price: 70,
      currency: "USD",
      duration: "90 min",
      features: ["Professional cut & style", "Deep conditioning", "Hair treatment", "Styling consultation", "Product recommendations"],
      isPopular: true,
      displayOrder: 3,
      isActive: true,
      buttonText: "Book Now",
      description: "Complete hair transformation package"
    });
    await this.createServicePricingTier({
      clientId: "client_1",
      name: "Hair Color",
      price: 100,
      currency: "USD",
      duration: "120 min",
      features: ["Full color service", "Premium color products", "Expert color consultation", "After-care treatment", "Color protection"],
      isPopular: false,
      displayOrder: 4,
      isActive: true,
      buttonText: "Book Now",
      description: "Professional color transformation"
    });
    await this.createWebsiteTestimonial({
      clientId: "client_1",
      customerName: "Sarah Johnson",
      customerTitle: "Hair Influencer",
      testimonialText: "Hair has been my home for hair for years",
      customerImage: "/src/assets/Ellipse 57_1757064789131.png",
      rating: 5,
      isActive: true,
      displayOrder: 1,
      source: "WEBSITE"
    });
    await this.createWebsiteTestimonial({
      clientId: "client_1",
      customerName: "Emily Rodriguez",
      customerTitle: "Beauty Blogger",
      testimonialText: "The team at Graceful Hair transformed my look completely. I've never felt more confident!",
      customerImage: "/src/assets/Ellipse 57_1757064789131.png",
      rating: 5,
      isActive: true,
      displayOrder: 2,
      source: "WEBSITE"
    });
    console.log("\u2705 Sample data initialized for SaaS platform");
  }
  // User methods
  async getUser(id) {
    return this.users.find((u) => u.id === id);
  }
  async getUserByEmail(email) {
    return this.users.find((u) => u.email === email);
  }
  async createUser(user) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = {
      id: `user_${this.users.length + 1}`,
      email: user.email,
      password: hashedPassword,
      role: user.role || "CLIENT",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.users.push(newUser);
    return newUser;
  }
  // Plan methods
  async getPlans() {
    return this.plans.filter((p) => p.isActive);
  }
  async getPlan(id) {
    return this.plans.find((p) => p.id === id);
  }
  async createPlan(plan) {
    const newPlan = {
      id: `plan_${this.plans.length + 1}`,
      name: plan.name,
      createdAt: /* @__PURE__ */ new Date(),
      monthlyPrice: plan.monthlyPrice ?? null,
      monthlyDiscount: plan.monthlyDiscount ?? null,
      monthlyEnabled: plan.monthlyEnabled ?? true,
      yearlyPrice: plan.yearlyPrice ?? null,
      yearlyDiscount: plan.yearlyDiscount ?? null,
      yearlyEnabled: plan.yearlyEnabled ?? false,
      features: plan.features,
      maxUsers: plan.maxUsers,
      storageGB: plan.storageGB,
      isActive: plan.isActive ?? true,
      isFreeTrial: plan.isFreeTrial ?? false,
      trialDays: plan.trialDays ?? 0,
      monthlyStripePriceId: null,
      yearlyStripePriceId: null,
      stripeProductId: null
    };
    this.plans.push(newPlan);
    return newPlan;
  }
  async updatePlan(id, updates) {
    const index = this.plans.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Plan not found");
    this.plans[index] = { ...this.plans[index], ...updates };
    return this.plans[index];
  }
  async deletePlan(id) {
    const index = this.plans.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Plan not found");
    this.plans.splice(index, 1);
  }
  // Plan synchronization methods
  async syncClientPlans(planId) {
    console.log(`\u{1F504} Syncing plan ${planId} for all clients (MemStorage - no action needed)`);
  }
  async updatePlanPricing(planId, updates) {
    const planIndex = this.plans.findIndex((p) => p.id === planId);
    if (planIndex === -1) throw new Error("Plan not found");
    this.plans[planIndex] = { ...this.plans[planIndex], ...updates };
    await this.syncClientPlans(planId);
    return this.plans[planIndex];
  }
  async updateClientPlan(clientId, planId) {
    const clientIndex = this.clients.findIndex((c) => c.id === clientId);
    if (clientIndex === -1) throw new Error("Client not found");
    const plan = this.plans.find((p) => p.id === planId);
    if (!plan) throw new Error("Plan not found");
    this.clients[clientIndex] = { ...this.clients[clientIndex], planId, updatedAt: /* @__PURE__ */ new Date() };
    return this.clients[clientIndex];
  }
  // Onboarding methods
  async getOnboardingSessions() {
    return this.onboardingSessions;
  }
  async getOnboardingSession(sessionId) {
    return this.onboardingSessions.find((s) => s.sessionId === sessionId);
  }
  async createOnboardingSession(session) {
    const newSession = {
      id: `onb_${this.onboardingSessions.length + 1}`,
      sessionId: session.sessionId,
      planId: session.planId,
      currentStep: session.currentStep || 1,
      isCompleted: false,
      businessData: session.businessData || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      completedAt: null
    };
    this.onboardingSessions.push(newSession);
    return newSession;
  }
  async updateOnboardingSession(sessionId, updates) {
    const index = this.onboardingSessions.findIndex((s) => s.sessionId === sessionId);
    if (index === -1) throw new Error("Onboarding session not found");
    this.onboardingSessions[index] = {
      ...this.onboardingSessions[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.onboardingSessions[index];
  }
  async completeOnboarding(sessionId) {
    const index = this.onboardingSessions.findIndex((s) => s.sessionId === sessionId);
    if (index === -1) throw new Error("Onboarding session not found");
    this.onboardingSessions[index] = {
      ...this.onboardingSessions[index],
      isCompleted: true,
      completedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.onboardingSessions[index];
  }
  // Client methods
  async getClients() {
    return this.clients;
  }
  async getClient(id) {
    return this.clients.find((c) => c.id === id);
  }
  async getClientByEmail(email) {
    return this.clients.find((c) => c.email === email);
  }
  async getClientBySubdomain(subdomain) {
    const website = this.clientWebsites.find((w) => w.subdomain === subdomain);
    if (!website) return void 0;
    return this.clients.find((c) => c.id === website.clientId);
  }
  async createClient(client) {
    const newClient = {
      id: `client_${this.clients.length + 1}`,
      businessName: client.businessName,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone || null,
      businessAddress: client.businessAddress || null,
      industry: client.industry || null,
      businessDescription: client.businessDescription || null,
      logoUrl: client.logoUrl || null,
      operatingHours: client.operatingHours || null,
      timeZone: client.timeZone || null,
      planId: client.planId,
      status: client.status || "TRIAL",
      userId: client.userId,
      onboardingSessionId: client.onboardingSessionId || null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePublicKey: null,
      stripeSecretKey: null,
      stripeAccountId: null,
      // SMTP Configuration
      smtpHost: null,
      smtpPort: null,
      smtpUsername: null,
      smtpPassword: null,
      smtpFromEmail: null,
      smtpFromName: null,
      smtpSecure: true,
      smtpEnabled: false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      lastLogin: null
    };
    this.clients.push(newClient);
    return newClient;
  }
  async updateClient(id, updates) {
    const index = this.clients.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Client not found");
    this.clients[index] = {
      ...this.clients[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.clients[index];
  }
  async deleteClient(id) {
    const index = this.clients.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Client not found");
    this.clients.splice(index, 1);
  }
  // Legacy service methods
  async getServices() {
    return this.services;
  }
  async getService(id) {
    return this.services.find((s) => s.id === id);
  }
  async createService(service) {
    const newService = {
      id: this.services.length + 1,
      name: service.name,
      description: service.description,
      price: service.price,
      durationMinutes: service.durationMinutes,
      category: service.category || null
    };
    this.services.push(newService);
    return newService;
  }
  // Legacy review methods
  async getReviews() {
    return this.reviews;
  }
  async createReview(review) {
    const newReview = {
      id: this.reviews.length + 1,
      name: review.name,
      email: review.email,
      rating: review.rating,
      text: review.text,
      publishConsent: review.publishConsent ?? false,
      date: /* @__PURE__ */ new Date(),
      published: false
    };
    this.reviews.push(newReview);
    return newReview;
  }
  // Client services methods
  async getClientServices(clientId) {
    return this.clientServices.filter((s) => s.clientId === clientId);
  }
  async createClientService(service) {
    const newService = {
      id: `service_${this.clientServices.length + 1}`,
      clientId: service.clientId,
      name: service.name,
      description: service.description || null,
      price: service.price,
      durationMinutes: service.durationMinutes,
      category: service.category || null,
      isActive: service.isActive ?? true,
      stripePriceId: null,
      stripeProductId: null,
      enableOnlinePayments: false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.clientServices.push(newService);
    return newService;
  }
  async updateClientService(id, updates) {
    const index = this.clientServices.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Client service not found");
    this.clientServices[index] = {
      ...this.clientServices[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.clientServices[index];
  }
  async deleteClientService(id) {
    const index = this.clientServices.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Client service not found");
    this.clientServices.splice(index, 1);
  }
  // Appointments methods
  async getAppointments(clientId) {
    return this.appointments.filter((a) => a.clientId === clientId);
  }
  async getAppointment(id) {
    return this.appointments.find((a) => a.id === id);
  }
  async createAppointment(appointment) {
    const newAppointment = {
      id: `appt_${this.appointments.length + 1}`,
      clientId: appointment.clientId,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      customerPhone: appointment.customerPhone || null,
      serviceId: appointment.serviceId,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status || "SCHEDULED",
      notes: appointment.notes || null,
      totalPrice: appointment.totalPrice,
      paymentMethod: appointment.paymentMethod || "CASH",
      paymentStatus: appointment.paymentStatus || "PENDING",
      paymentIntentId: null,
      emailConfirmation: false,
      smsConfirmation: false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.appointments.push(newAppointment);
    return newAppointment;
  }
  async updateAppointment(id, updates) {
    const index = this.appointments.findIndex((a) => a.id === id);
    if (index === -1) throw new Error("Appointment not found");
    this.appointments[index] = {
      ...this.appointments[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.appointments[index];
  }
  async deleteAppointment(id) {
    const index = this.appointments.findIndex((a) => a.id === id);
    if (index === -1) throw new Error("Appointment not found");
    this.appointments.splice(index, 1);
  }
  // Appointment transfer methods
  async transferAppointment(appointmentId, toStaffId, transferredBy, reason) {
    const appointment = await this.getAppointment(appointmentId);
    if (!appointment) throw new Error("Appointment not found");
    const transfer = {
      id: `transfer_${this.appointmentTransfers.length + 1}`,
      appointmentId,
      clientId: appointment.clientId,
      fromStaffId: appointment.assignedTo || null,
      toStaffId,
      transferredBy,
      reason: reason || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.appointmentTransfers.push(transfer);
    return await this.updateAppointment(appointmentId, { assignedTo: toStaffId });
  }
  async getAppointmentTransfers(appointmentId) {
    return this.appointmentTransfers.filter((t) => t.appointmentId === appointmentId);
  }
  async getStaffTransfers(staffId) {
    return this.appointmentTransfers.filter(
      (t) => t.fromStaffId === staffId || t.toStaffId === staffId
    );
  }
  // Operating hours methods
  async getOperatingHours(clientId) {
    return this.operatingHours.filter((h) => h.clientId === clientId);
  }
  async setOperatingHours(clientId, hours) {
    this.operatingHours = this.operatingHours.filter((h) => h.clientId !== clientId);
    const newHours = hours.map((h, index) => ({
      id: `hours_${clientId}_${h.dayOfWeek}`,
      clientId: h.clientId,
      dayOfWeek: h.dayOfWeek,
      isOpen: h.isOpen ?? true,
      openTime: h.openTime || null,
      closeTime: h.closeTime || null,
      breakStartTime: h.breakStartTime || null,
      breakEndTime: h.breakEndTime || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }));
    this.operatingHours.push(...newHours);
    return newHours;
  }
  // Leads methods
  async getLeads(clientId) {
    return this.leads.filter((l) => l.clientId === clientId);
  }
  async getLead(id) {
    return this.leads.find((l) => l.id === id);
  }
  async createLead(lead) {
    const newLead = {
      id: `lead_${Date.now()}`,
      clientId: lead.clientId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || null,
      source: lead.source,
      status: lead.status || "NEW",
      notes: lead.notes || null,
      interestedServices: lead.interestedServices || [],
      estimatedValue: lead.estimatedValue || null,
      followUpDate: lead.followUpDate || null,
      convertedToAppointment: lead.convertedToAppointment ?? false,
      appointmentId: lead.appointmentId || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.leads.push(newLead);
    return newLead;
  }
  async updateLead(id, updates) {
    const index = this.leads.findIndex((l) => l.id === id);
    if (index === -1) throw new Error("Lead not found");
    this.leads[index] = {
      ...this.leads[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.leads[index];
  }
  async deleteLead(id) {
    const index = this.leads.findIndex((l) => l.id === id);
    if (index === -1) throw new Error("Lead not found");
    this.leads.splice(index, 1);
  }
  // Client website methods
  async getClientWebsite(clientId) {
    return this.clientWebsites.find((w) => w.clientId === clientId);
  }
  async createClientWebsite(website) {
    const newWebsite = {
      id: `website_${this.clientWebsites.length + 1}`,
      clientId: website.clientId,
      subdomain: website.subdomain,
      customDomain: website.customDomain || null,
      title: website.title,
      description: website.description || null,
      heroImage: website.heroImage || null,
      primaryColor: website.primaryColor || "#3B82F6",
      secondaryColor: website.secondaryColor || "#F3F4F6",
      contactInfo: website.contactInfo || null,
      socialLinks: website.socialLinks || null,
      sections: website.sections || null,
      showPrices: website.showPrices ?? true,
      allowOnlineBooking: website.allowOnlineBooking ?? true,
      isPublished: website.isPublished ?? false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.clientWebsites.push(newWebsite);
    return newWebsite;
  }
  async updateClientWebsite(clientId, updates) {
    const index = this.clientWebsites.findIndex((w) => w.clientId === clientId);
    if (index === -1) throw new Error("Client website not found");
    this.clientWebsites[index] = {
      ...this.clientWebsites[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.clientWebsites[index];
  }
  async getPublicWebsite(subdomain) {
    return this.clientWebsites.find((w) => w.subdomain === subdomain && w.isPublished);
  }
  // Appointment slots methods
  async getAppointmentSlots(clientId) {
    return this.appointmentSlots.filter((slot) => slot.clientId === clientId);
  }
  async createAppointmentSlot(slot) {
    const newSlot = {
      id: `slot_${this.appointmentSlots.length + 1}`,
      clientId: slot.clientId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotDuration: slot.slotDuration || 30,
      isActive: slot.isActive ?? true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.appointmentSlots.push(newSlot);
    return newSlot;
  }
  async updateAppointmentSlot(id, updates) {
    const index = this.appointmentSlots.findIndex((slot) => slot.id === id);
    if (index === -1) throw new Error("Appointment slot not found");
    this.appointmentSlots[index] = {
      ...this.appointmentSlots[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.appointmentSlots[index];
  }
  async deleteAppointmentSlot(id) {
    const index = this.appointmentSlots.findIndex((slot) => slot.id === id);
    if (index === -1) throw new Error("Appointment slot not found");
    this.appointmentSlots.splice(index, 1);
  }
  async getAvailableSlots(clientId, date) {
    const [year, month, day] = date.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    const dayOfWeek = localDate.getDay();
    console.log(`getAvailableSlots: date=${date}, parsed=(${year},${month},${day}), dayOfWeek=${dayOfWeek}`);
    const daySlots = this.appointmentSlots.filter(
      (slot) => slot.clientId === clientId && slot.dayOfWeek === dayOfWeek && slot.isActive
    );
    console.log(`Found ${daySlots.length} slot configurations for dayOfWeek ${dayOfWeek}`);
    if (daySlots.length === 0) return [];
    const existingAppointments = this.appointments.filter(
      (apt) => apt.clientId === clientId && new Date(apt.appointmentDate).toDateString() === localDate.toDateString()
    );
    const bookedTimes = existingAppointments.map((apt) => apt.startTime);
    const availableSlots = /* @__PURE__ */ new Set();
    for (const slotConfig of daySlots) {
      const start = this.timeToMinutes(slotConfig.startTime);
      const end = this.timeToMinutes(slotConfig.endTime);
      const duration = slotConfig.slotDuration || 30;
      for (let time = start; time < end; time += duration) {
        const timeString = this.minutesToTime(time);
        if (!bookedTimes.includes(timeString)) {
          availableSlots.add(timeString);
        }
      }
    }
    const result = Array.from(availableSlots).sort();
    return result;
  }
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }
  // Team Members
  async getTeamMembers(clientId) {
    return this.teamMembers.filter((member) => member.clientId === clientId);
  }
  async getTeamMember(id) {
    return this.teamMembers.find((member) => member.id === id);
  }
  async createTeamMember(member) {
    const newMember = {
      id: `team_${this.teamMembers.length + 1}`,
      clientId: member.clientId,
      name: member.name,
      email: member.email,
      phone: member.phone || null,
      role: member.role || "STAFF",
      permissions: member.permissions || [],
      isActive: member.isActive ?? true,
      hourlyRate: member.hourlyRate || null,
      specializations: member.specializations || [],
      workingHours: member.workingHours || null,
      password: member.password,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.teamMembers.push(newMember);
    return newMember;
  }
  async updateTeamMember(id, updates) {
    const index = this.teamMembers.findIndex((member) => member.id === id);
    if (index === -1) throw new Error("Team member not found");
    this.teamMembers[index] = {
      ...this.teamMembers[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.teamMembers[index];
  }
  async deleteTeamMember(id) {
    const index = this.teamMembers.findIndex((member) => member.id === id);
    if (index === -1) throw new Error("Team member not found");
    this.teamMembers.splice(index, 1);
  }
  // Review Platforms methods
  async getReviewPlatforms() {
    return this.reviewPlatforms.filter((platform) => platform.isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  async getReviewPlatform(id) {
    return this.reviewPlatforms.find((platform) => platform.id === id);
  }
  async createReviewPlatform(platform) {
    const newPlatform = {
      id: `review_platform_${this.reviewPlatforms.length + 1}`,
      name: platform.name,
      displayName: platform.displayName,
      rating: platform.rating,
      maxRating: platform.maxRating || 5,
      reviewCount: platform.reviewCount || null,
      logoUrl: platform.logoUrl || null,
      isActive: platform.isActive ?? true,
      sortOrder: platform.sortOrder || 0,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.reviewPlatforms.push(newPlatform);
    return newPlatform;
  }
  async updateReviewPlatform(id, updates) {
    const index = this.reviewPlatforms.findIndex((platform) => platform.id === id);
    if (index === -1) throw new Error("Review platform not found");
    this.reviewPlatforms[index] = {
      ...this.reviewPlatforms[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.reviewPlatforms[index];
  }
  async deleteReviewPlatform(id) {
    const index = this.reviewPlatforms.findIndex((platform) => platform.id === id);
    if (index === -1) throw new Error("Review platform not found");
    this.reviewPlatforms.splice(index, 1);
  }
  // Review Platform Connections Implementation
  async getReviewPlatformConnections(clientId) {
    return this.reviewPlatformConnections.filter((c) => c.clientId === clientId);
  }
  async getReviewPlatformConnection(id) {
    return this.reviewPlatformConnections.find((c) => c.id === id);
  }
  async createReviewPlatformConnection(connection) {
    const newConnection = {
      id: `connection_${this.reviewPlatformConnections.length + 1}`,
      clientId: connection.clientId,
      platform: connection.platform,
      platformAccountId: connection.platformAccountId || null,
      apiKey: connection.apiKey || null,
      accessToken: connection.accessToken || null,
      refreshToken: connection.refreshToken || null,
      isActive: connection.isActive ?? true,
      lastSyncAt: connection.lastSyncAt || null,
      averageRating: connection.averageRating || null,
      totalReviews: connection.totalReviews || 0,
      platformUrl: connection.platformUrl || null,
      syncFrequency: connection.syncFrequency || "DAILY",
      errorMessage: connection.errorMessage || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.reviewPlatformConnections.push(newConnection);
    return newConnection;
  }
  async updateReviewPlatformConnection(id, updates) {
    const index = this.reviewPlatformConnections.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Review platform connection not found");
    this.reviewPlatformConnections[index] = {
      ...this.reviewPlatformConnections[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.reviewPlatformConnections[index];
  }
  async deleteReviewPlatformConnection(id) {
    const index = this.reviewPlatformConnections.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Review platform connection not found");
    this.reviewPlatformConnections.splice(index, 1);
  }
  async syncReviewPlatformData(connectionId) {
    const connection = await this.getReviewPlatformConnection(connectionId);
    if (!connection) throw new Error("Review platform connection not found");
    const mockReviewData = this.generateMockReviewData(connection.platform);
    return this.updateReviewPlatformConnection(connectionId, {
      averageRating: mockReviewData.averageRating,
      totalReviews: mockReviewData.totalReviews,
      lastSyncAt: /* @__PURE__ */ new Date(),
      errorMessage: null
    });
  }
  // Platform Reviews Implementation
  async getPlatformReviews(clientId, platform) {
    let reviews3 = this.platformReviews.filter((r) => r.clientId === clientId);
    if (platform) {
      reviews3 = reviews3.filter((r) => r.platform === platform);
    }
    return reviews3;
  }
  async getPlatformReview(id) {
    return this.platformReviews.find((r) => r.id === id);
  }
  async createPlatformReview(review) {
    const newReview = {
      id: `review_${this.platformReviews.length + 1}`,
      connectionId: review.connectionId,
      clientId: review.clientId,
      platform: review.platform,
      externalReviewId: review.externalReviewId,
      customerName: review.customerName,
      customerAvatar: review.customerAvatar || null,
      rating: review.rating,
      reviewText: review.reviewText || null,
      reviewDate: review.reviewDate,
      businessResponse: review.businessResponse || null,
      businessResponseDate: review.businessResponseDate || null,
      isVerified: review.isVerified ?? false,
      helpfulCount: review.helpfulCount || 0,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.platformReviews.push(newReview);
    return newReview;
  }
  async updatePlatformReview(id, updates) {
    const index = this.platformReviews.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Platform review not found");
    this.platformReviews[index] = {
      ...this.platformReviews[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.platformReviews[index];
  }
  async deletePlatformReview(id) {
    const index = this.platformReviews.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Platform review not found");
    this.platformReviews.splice(index, 1);
  }
  generateMockReviewData(platform) {
    const mockData = {
      GOOGLE: { averageRating: 4.8, totalReviews: 127 },
      YELP: { averageRating: 4.5, totalReviews: 89 },
      TRUSTPILOT: { averageRating: 4.9, totalReviews: 203 }
    };
    return mockData[platform] || { averageRating: 4, totalReviews: 50 };
  }
  // Domain Configuration methods
  async getDomainConfigurations(clientId) {
    return this.domainConfigurations.filter((d) => d.clientId === clientId);
  }
  async getDomainConfiguration(id) {
    return this.domainConfigurations.find((d) => d.id === id);
  }
  async getDomainConfigurationByDomain(domain) {
    return this.domainConfigurations.find((d) => d.domain === domain);
  }
  async createDomainConfiguration(domainConfig) {
    const newDomainConfig = {
      id: `domain_${this.domainConfigurations.length + 1}`,
      clientId: domainConfig.clientId,
      domainType: domainConfig.domainType,
      domain: domainConfig.domain,
      subdomain: domainConfig.subdomain || null,
      isActive: domainConfig.isActive ?? false,
      verificationStatus: domainConfig.verificationStatus || "PENDING",
      verificationToken: this.generateVerificationToken(),
      verificationMethod: domainConfig.verificationMethod || "DNS_TXT",
      sslStatus: domainConfig.sslStatus || "PENDING",
      sslCertificateId: domainConfig.sslCertificateId || null,
      sslIssuedAt: domainConfig.sslIssuedAt || null,
      sslExpiresAt: domainConfig.sslExpiresAt || null,
      dnsRecords: domainConfig.dnsRecords || this.generateDnsRecords(domainConfig.domain),
      redirectToHttps: domainConfig.redirectToHttps ?? true,
      // customSettings: domainConfig.customSettings || null, // Column doesn't exist in Coolify production DB
      // lastCheckedAt: null, // Column doesn't exist in Coolify production DB
      verifiedAt: domainConfig.verifiedAt || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.domainConfigurations.push(newDomainConfig);
    return newDomainConfig;
  }
  async updateDomainConfiguration(id, updates) {
    const index = this.domainConfigurations.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Domain configuration not found");
    this.domainConfigurations[index] = {
      ...this.domainConfigurations[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.domainConfigurations[index];
  }
  async deleteDomainConfiguration(id) {
    const index = this.domainConfigurations.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Domain configuration not found");
    this.domainConfigurations.splice(index, 1);
  }
  async verifyDomain(id) {
    const domain = await this.getDomainConfiguration(id);
    if (!domain) throw new Error("Domain configuration not found");
    const existingLogs = await this.getDomainVerificationLogs(id);
    const attemptNumber = existingLogs.length + 1;
    let verificationResult;
    try {
      if (domain.verificationMethod === "DNS_TXT") {
        verificationResult = await dnsVerificationService.verifyDomainViaDNS(
          domain.domain,
          domain.verificationToken || ""
        );
      } else if (domain.verificationMethod === "CNAME") {
        verificationResult = await dnsVerificationService.verifyDomainViaCNAME(
          domain.domain,
          "scheduled-platform.com"
        );
      } else {
        throw new Error(`Unsupported verification method: ${domain.verificationMethod}`);
      }
      await this.createDomainVerificationLog({
        domainConfigId: id,
        verificationAttempt: attemptNumber,
        verificationMethod: domain.verificationMethod,
        status: verificationResult.success ? "SUCCESS" : "FAILED",
        errorMessage: verificationResult.errorMessage || null,
        verificationData: JSON.stringify(verificationResult.verificationData),
        responseTime: verificationResult.responseTime
      });
      if (verificationResult.success) {
        return this.updateDomainConfiguration(id, {
          verificationStatus: "VERIFIED",
          isActive: true,
          verifiedAt: /* @__PURE__ */ new Date()
          // lastCheckedAt: new Date() // Column doesn't exist in Coolify production DB
        });
      } else {
        return this.updateDomainConfiguration(id, {
          verificationStatus: "FAILED"
          // lastCheckedAt: new Date() // Column doesn't exist in Coolify production DB
        });
      }
    } catch (error) {
      await this.createDomainVerificationLog({
        domainConfigId: id,
        verificationAttempt: attemptNumber,
        verificationMethod: domain.verificationMethod || "DNS_TXT",
        status: "FAILED",
        errorMessage: `Verification error: ${error.message}`,
        verificationData: JSON.stringify({
          expected: domain.verificationToken,
          found: null,
          recordName: `_scheduled-verification.${domain.domain}`,
          error: error.message
        }),
        responseTime: 0
      });
      return this.updateDomainConfiguration(id, {
        verificationStatus: "FAILED"
        // lastCheckedAt: new Date() // Column doesn't exist in Coolify production DB
      });
    }
  }
  // Domain Verification Log methods
  async getDomainVerificationLogs(domainConfigId) {
    return this.domainVerificationLogs.filter((l) => l.domainConfigId === domainConfigId);
  }
  async createDomainVerificationLog(log2) {
    const newLog = {
      id: `log_${this.domainVerificationLogs.length + 1}`,
      domainConfigId: log2.domainConfigId,
      verificationAttempt: log2.verificationAttempt || 1,
      verificationMethod: log2.verificationMethod,
      status: log2.status,
      errorMessage: log2.errorMessage || null,
      verificationData: log2.verificationData || null,
      responseTime: log2.responseTime || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.domainVerificationLogs.push(newLog);
    return newLog;
  }
  // Helper methods for domain functionality
  generateVerificationToken() {
    return `verify-domain-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }
  generateDnsRecords(domain) {
    return JSON.stringify([
      {
        type: "TXT",
        name: `_scheduled-verification.${domain}`,
        value: this.generateVerificationToken(),
        ttl: 300
      },
      {
        type: "CNAME",
        name: domain,
        value: "scheduled-platform.com",
        ttl: 300
      }
    ]);
  }
  // Google Business Profile methods
  async getGoogleBusinessProfile(clientId) {
    return this.googleBusinessProfiles.find((profile) => profile.clientId === clientId);
  }
  async createGoogleBusinessProfile(profile) {
    const newProfile = {
      id: `google_business_${this.googleBusinessProfiles.length + 1}`,
      clientId: profile.clientId,
      businessName: profile.businessName,
      googlePlaceId: profile.googlePlaceId || null,
      googleAccountId: profile.googleAccountId || null,
      locationId: profile.locationId || null,
      oauthConnected: profile.oauthConnected || false,
      verificationStatus: profile.verificationStatus || "UNLINKED",
      verificationSource: profile.verificationSource || null,
      averageRating: profile.averageRating || null,
      totalReviews: profile.totalReviews || 0,
      businessHours: profile.businessHours || null,
      businessDescription: profile.businessDescription || null,
      businessCategories: profile.businessCategories || [],
      businessPhotos: profile.businessPhotos || [],
      website: profile.website || null,
      phoneNumber: profile.phoneNumber || null,
      address: profile.address || null,
      postalCode: profile.postalCode || null,
      city: profile.city || null,
      state: profile.state || null,
      country: profile.country || null,
      latitude: profile.latitude || null,
      longitude: profile.longitude || null,
      lastSyncAt: profile.lastSyncAt || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.googleBusinessProfiles.push(newProfile);
    return newProfile;
  }
  async updateGoogleBusinessProfile(clientId, updates) {
    const index = this.googleBusinessProfiles.findIndex((profile) => profile.clientId === clientId);
    if (index === -1) throw new Error("Google Business Profile not found");
    this.googleBusinessProfiles[index] = {
      ...this.googleBusinessProfiles[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.googleBusinessProfiles[index];
  }
  async deleteGoogleBusinessProfile(clientId) {
    const index = this.googleBusinessProfiles.findIndex((profile) => profile.clientId === clientId);
    if (index === -1) throw new Error("Google Business Profile not found");
    this.googleBusinessProfiles.splice(index, 1);
  }
  async syncGoogleBusinessProfile(clientId) {
    const profile = await this.getGoogleBusinessProfile(clientId);
    if (!profile) throw new Error("Google Business Profile not found");
    if (!profile.oauthConnected) {
      throw new Error("Google Business Profile sync requires OAuth authentication. Please connect your Google account first.");
    }
    return this.updateGoogleBusinessProfile(clientId, {
      verificationStatus: "VERIFIED",
      lastSyncAt: /* @__PURE__ */ new Date()
    });
  }
  // Newsletter Subscriptions methods
  async getNewsletterSubscriptions(clientId) {
    return this.newsletterSubscriptions.filter((sub) => sub.clientId === clientId);
  }
  async getNewsletterSubscription(id) {
    return this.newsletterSubscriptions.find((sub) => sub.id === id);
  }
  async createNewsletterSubscription(subscription) {
    const newSubscription = {
      id: `newsletter_${this.newsletterSubscriptions.length + 1}`,
      clientId: subscription.clientId,
      email: subscription.email,
      name: subscription.name || null,
      status: subscription.status || "ACTIVE",
      source: subscription.source || "WEBSITE",
      metadata: subscription.metadata || null,
      subscribedAt: subscription.subscribedAt || /* @__PURE__ */ new Date(),
      unsubscribedAt: subscription.unsubscribedAt || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.newsletterSubscriptions.push(newSubscription);
    return newSubscription;
  }
  async updateNewsletterSubscription(id, updates) {
    const index = this.newsletterSubscriptions.findIndex((sub) => sub.id === id);
    if (index === -1) throw new Error("Newsletter subscription not found");
    this.newsletterSubscriptions[index] = {
      ...this.newsletterSubscriptions[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.newsletterSubscriptions[index];
  }
  async deleteNewsletterSubscription(id) {
    const index = this.newsletterSubscriptions.findIndex((sub) => sub.id === id);
    if (index === -1) throw new Error("Newsletter subscription not found");
    this.newsletterSubscriptions.splice(index, 1);
  }
  // Website Staff methods
  async getWebsiteStaff(clientId) {
    return this.websiteStaff.filter((staff) => staff.clientId === clientId && staff.isActive).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }
  async getWebsiteStaffMember(id) {
    return this.websiteStaff.find((staff) => staff.id === id);
  }
  async createWebsiteStaff(staff) {
    const newStaff = {
      id: `staff_${this.websiteStaff.length + 1}`,
      clientId: staff.clientId,
      name: staff.name,
      title: staff.title,
      bio: staff.bio || null,
      profileImage: staff.profileImage || null,
      experience: staff.experience || null,
      specialties: staff.specialties || [],
      displayOrder: staff.displayOrder || 0,
      isActive: staff.isActive !== void 0 ? staff.isActive : true,
      teamMemberId: staff.teamMemberId || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.websiteStaff.push(newStaff);
    return newStaff;
  }
  async updateWebsiteStaff(id, updates) {
    const index = this.websiteStaff.findIndex((staff) => staff.id === id);
    if (index === -1) throw new Error("Website staff member not found");
    this.websiteStaff[index] = {
      ...this.websiteStaff[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.websiteStaff[index];
  }
  async deleteWebsiteStaff(id) {
    const index = this.websiteStaff.findIndex((staff) => staff.id === id);
    if (index === -1) throw new Error("Website staff member not found");
    this.websiteStaff.splice(index, 1);
  }
  // Service Pricing Tiers methods
  async getServicePricingTiers(clientId) {
    return this.servicePricingTiers.filter((tier) => tier.clientId === clientId && tier.isActive).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }
  async getServicePricingTier(id) {
    return this.servicePricingTiers.find((tier) => tier.id === id);
  }
  async createServicePricingTier(tier) {
    const newTier = {
      id: `tier_${this.servicePricingTiers.length + 1}`,
      clientId: tier.clientId,
      name: tier.name,
      price: tier.price,
      currency: tier.currency || "USD",
      duration: tier.duration || null,
      features: tier.features || [],
      isPopular: tier.isPopular || false,
      displayOrder: tier.displayOrder || 0,
      isActive: tier.isActive !== void 0 ? tier.isActive : true,
      buttonText: tier.buttonText || "Book Now",
      description: tier.description || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.servicePricingTiers.push(newTier);
    return newTier;
  }
  async updateServicePricingTier(id, updates) {
    const index = this.servicePricingTiers.findIndex((tier) => tier.id === id);
    if (index === -1) throw new Error("Service pricing tier not found");
    this.servicePricingTiers[index] = {
      ...this.servicePricingTiers[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.servicePricingTiers[index];
  }
  async deleteServicePricingTier(id) {
    const index = this.servicePricingTiers.findIndex((tier) => tier.id === id);
    if (index === -1) throw new Error("Service pricing tier not found");
    this.servicePricingTiers.splice(index, 1);
  }
  // Website Testimonials methods
  async getWebsiteTestimonials(clientId) {
    return this.websiteTestimonials.filter((testimonial) => testimonial.clientId === clientId && testimonial.isActive).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }
  async getWebsiteTestimonial(id) {
    return this.websiteTestimonials.find((testimonial) => testimonial.id === id);
  }
  async createWebsiteTestimonial(testimonial) {
    const newTestimonial = {
      id: `testimonial_${this.websiteTestimonials.length + 1}`,
      clientId: testimonial.clientId,
      customerName: testimonial.customerName,
      customerTitle: testimonial.customerTitle || null,
      testimonialText: testimonial.testimonialText,
      customerImage: testimonial.customerImage || null,
      rating: testimonial.rating || 5,
      isActive: testimonial.isActive !== void 0 ? testimonial.isActive : true,
      displayOrder: testimonial.displayOrder || 0,
      source: testimonial.source || "WEBSITE",
      reviewId: testimonial.reviewId || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.websiteTestimonials.push(newTestimonial);
    return newTestimonial;
  }
  async updateWebsiteTestimonial(id, updates) {
    const index = this.websiteTestimonials.findIndex((testimonial) => testimonial.id === id);
    if (index === -1) throw new Error("Website testimonial not found");
    this.websiteTestimonials[index] = {
      ...this.websiteTestimonials[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.websiteTestimonials[index];
  }
  async deleteWebsiteTestimonial(id) {
    const index = this.websiteTestimonials.findIndex((testimonial) => testimonial.id === id);
    if (index === -1) throw new Error("Website testimonial not found");
    this.websiteTestimonials.splice(index, 1);
  }
  // ====================================
  // SECURE PAYMENT OPERATIONS
  // ====================================
  async getPayments(clientId) {
    return this.payments.filter((payment) => payment.clientId === clientId);
  }
  async getPayment(id) {
    return this.payments.find((payment) => payment.id === id);
  }
  async createPayment(payment) {
    const newPayment = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId: payment.clientId,
      appointmentId: payment.appointmentId || null,
      paymentMethod: payment.paymentMethod,
      paymentProvider: payment.paymentProvider || null,
      paymentIntentId: payment.paymentIntentId || null,
      amount: payment.amount,
      currency: payment.currency || "USD",
      status: payment.status || "PENDING",
      customerName: payment.customerName,
      customerEmail: payment.customerEmail,
      description: payment.description || null,
      metadata: payment.metadata || null,
      processingFee: payment.processingFee || null,
      netAmount: payment.netAmount || null,
      paidAt: payment.paidAt || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.payments.push(newPayment);
    return newPayment;
  }
  async updatePayment(id, updates) {
    const index = this.payments.findIndex((payment) => payment.id === id);
    if (index === -1) throw new Error("Payment not found");
    this.payments[index] = {
      ...this.payments[index],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.payments[index];
  }
  async getPaymentsByAppointment(appointmentId) {
    return this.payments.filter((payment) => payment.appointmentId === appointmentId);
  }
  // ====================================
  // SECURE SERVICE PRICE CALCULATION (SERVER-SIDE ONLY)
  // ====================================
  async calculateServiceAmount(clientId, serviceId) {
    const service = this.clientServices.find(
      (s) => s.clientId === clientId && s.id === serviceId && s.isActive
    );
    if (!service) {
      throw new Error("Service not found or inactive");
    }
    return service.price;
  }
  async calculateTotalWithTip(baseAmount, tipPercentage) {
    if (!tipPercentage || tipPercentage <= 0) {
      return baseAmount;
    }
    const tipAmount = baseAmount * tipPercentage / 100;
    return baseAmount + tipAmount;
  }
  // ====================================
  // SECURE STRIPE CONFIGURATION (NO SECRET KEY EXPOSURE)
  // ====================================
  async updateStripeConfig(clientId, publicKey, secretKey) {
    const clientIndex = this.clients.findIndex((c) => c.id === clientId);
    if (clientIndex === -1) throw new Error("Client not found");
    this.clients[clientIndex] = {
      ...this.clients[clientIndex],
      stripePublicKey: publicKey,
      // NOTE: In production, secretKey should be encrypted before storage
      stripeSecretKey: secretKey,
      // This should be encrypted
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  async getStripePublicKey(clientId) {
    const client = this.clients.find((c) => c.id === clientId);
    return client?.stripePublicKey || null;
  }
  async getStripeSecretKey(clientId) {
    const client = this.clients.find((c) => c.id === clientId);
    return client?.stripeSecretKey || null;
  }
  async validateStripeConfig(clientId) {
    const client = this.clients.find((c) => c.id === clientId);
    const hasClientConfig = !!(client?.stripePublicKey && client?.stripeSecretKey);
    const hasGlobalConfig = !!(process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY);
    return hasClientConfig || hasGlobalConfig;
  }
  async clearStripeConfig(clientId) {
    const clientIndex = this.clients.findIndex((c) => c.id === clientId);
    if (clientIndex === -1) throw new Error("Client not found");
    this.clients[clientIndex] = {
      ...this.clients[clientIndex],
      stripePublicKey: null,
      stripeSecretKey: null,
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  // ====================================
  // SMTP EMAIL CONFIGURATION MANAGEMENT
  // ====================================
  async updateSmtpConfig(clientId, config) {
    const clientIndex = this.clients.findIndex((c) => c.id === clientId);
    if (clientIndex === -1) throw new Error("Client not found");
    this.clients[clientIndex] = {
      ...this.clients[clientIndex],
      ...config,
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  async getSmtpConfig(clientId) {
    const client = this.clients.find((c) => c.id === clientId);
    if (!client) throw new Error("Client not found");
    const isConfigured = !!(client.smtpHost && client.smtpPort && client.smtpUsername && client.smtpPassword && client.smtpFromEmail);
    console.log("SMTP getConfig for", clientId, {
      smtpHost: client.smtpHost,
      smtpPort: client.smtpPort,
      smtpUsername: client.smtpUsername,
      smtpPassword: "***",
      smtpFromEmail: client.smtpFromEmail,
      isConfigured
    });
    return {
      smtpHost: client.smtpHost || null,
      smtpPort: client.smtpPort || null,
      smtpUsername: client.smtpUsername || null,
      smtpPassword: null,
      // Never return password for security
      smtpFromEmail: client.smtpFromEmail || null,
      smtpFromName: client.smtpFromName || null,
      smtpSecure: client.smtpSecure !== false ? true : false,
      // default to true
      smtpEnabled: client.smtpEnabled || false,
      isConfigured
    };
  }
  async testSmtpConfig(clientId) {
    const client = this.clients.find((c) => c.id === clientId);
    if (!client || !client.smtpEnabled) return false;
    return !!(client.smtpHost && client.smtpPort && client.smtpUsername && client.smtpPassword && client.smtpFromEmail);
  }
  async clearSmtpConfig(clientId) {
    const clientIndex = this.clients.findIndex((c) => c.id === clientId);
    if (clientIndex === -1) throw new Error("Client not found");
    this.clients[clientIndex] = {
      ...this.clients[clientIndex],
      smtpHost: null,
      smtpPort: null,
      smtpUsername: null,
      smtpPassword: null,
      smtpFromEmail: null,
      smtpFromName: null,
      smtpSecure: true,
      smtpEnabled: false,
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  // Contact Messages / Super Admin Leads Methods
  async loadContactMessages() {
    try {
      await fs.mkdir(path.dirname(this.contactMessagesFile), { recursive: true });
      const data = await fs.readFile(this.contactMessagesFile, "utf8");
      this.contactMessages = JSON.parse(data);
      console.log(`\u2705 Loaded ${this.contactMessages.length} contact messages from file`);
    } catch (error) {
      this.contactMessages = [];
      console.log("\u{1F4DD} Starting with empty contact messages (file not found)");
    }
  }
  async saveContactMessages() {
    try {
      await fs.mkdir(path.dirname(this.contactMessagesFile), { recursive: true });
      await fs.writeFile(this.contactMessagesFile, JSON.stringify(this.contactMessages, null, 2));
    } catch (error) {
      console.error("\u274C Failed to save contact messages:", error);
    }
  }
  async getContactMessages() {
    if (this.contactMessages.length === 0) {
      await this.loadContactMessages();
    }
    return this.contactMessages;
  }
  async getContactMessage(id) {
    return this.contactMessages.find((m) => m.id === id);
  }
  async createContactMessage(message) {
    if (this.contactMessages.length === 0) {
      await this.loadContactMessages();
    }
    const newMessage = {
      id: `contact_${Date.now()}`,
      name: message.name,
      email: message.email,
      subject: message.subject,
      message: message.message,
      source: message.source || "website",
      status: message.status || "NEW",
      notes: message.notes || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.contactMessages.push(newMessage);
    await this.saveContactMessages();
    return newMessage;
  }
  async updateContactMessage(id, updates) {
    if (this.contactMessages.length === 0) {
      await this.loadContactMessages();
    }
    const messageIndex = this.contactMessages.findIndex((m) => m.id === id);
    if (messageIndex === -1) throw new Error("Contact message not found");
    this.contactMessages[messageIndex] = {
      ...this.contactMessages[messageIndex],
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    await this.saveContactMessages();
    return this.contactMessages[messageIndex];
  }
  async deleteContactMessage(id) {
    if (this.contactMessages.length === 0) {
      await this.loadContactMessages();
    }
    const messageIndex = this.contactMessages.findIndex((m) => m.id === id);
    if (messageIndex === -1) throw new Error("Contact message not found");
    this.contactMessages.splice(messageIndex, 1);
    await this.saveContactMessages();
  }
};
var PostgreSQLStorage = class {
  static {
    __name(this, "PostgreSQLStorage");
  }
  initialized = false;
  constructor() {
    this.initializeDatabase();
  }
  ensureDB() {
    if (!db) {
      throw new Error("Database connection not available. Please check your DATABASE_URL configuration.");
    }
    return db;
  }
  async createTables() {
    const dbInstance = this.ensureDB();
    try {
      console.log("\u{1F527} Creating database tables if they don't exist...");
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" text PRIMARY KEY NOT NULL,
          "email" text NOT NULL UNIQUE,
          "password" text NOT NULL,
          "role" text DEFAULT 'CLIENT' NOT NULL,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "plans" (
          "id" text PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "monthly_price" real,
          "monthly_discount" real DEFAULT 0,
          "monthly_enabled" boolean DEFAULT true,
          "yearly_price" real,
          "yearly_discount" real DEFAULT 0,
          "yearly_enabled" boolean DEFAULT true,
          "features" text[] NOT NULL,
          "max_users" integer NOT NULL,
          "storage_gb" integer NOT NULL,
          "is_active" boolean DEFAULT true,
          "is_free_trial" boolean DEFAULT false,
          "trial_days" integer DEFAULT 0,
          "monthly_stripe_price_id" text,
          "yearly_stripe_price_id" text,
          "stripe_product_id" text,
          "created_at" timestamp DEFAULT now()
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "review_platforms" (
          "id" text PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "display_name" text NOT NULL,
          "rating" real NOT NULL,
          "max_rating" real NOT NULL,
          "review_count" integer NOT NULL,
          "logo_url" text,
          "is_active" boolean DEFAULT true,
          "sort_order" integer DEFAULT 0,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "onboarding_sessions" (
          "id" text PRIMARY KEY NOT NULL,
          "session_id" text NOT NULL UNIQUE,
          "plan_id" text NOT NULL,
          "current_step" integer DEFAULT 1,
          "is_completed" boolean DEFAULT false,
          "business_data" text,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          "completed_at" timestamp
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "contact_messages" (
          "id" text PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "email" text NOT NULL,
          "subject" text NOT NULL,
          "message" text NOT NULL,
          "source" text DEFAULT 'website',
          "status" text DEFAULT 'NEW',
          "notes" text,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "clients" (
          "id" text PRIMARY KEY NOT NULL,
          "business_name" text NOT NULL,
          "contact_person" text NOT NULL,
          "email" text NOT NULL UNIQUE,
          "phone" text,
          "business_address" text,
          "industry" text,
          "business_description" text,
          "logo_url" text,
          "operating_hours" text,
          "time_zone" text,
          "plan_id" text NOT NULL,
          "status" text DEFAULT 'TRIAL' NOT NULL,
          "user_id" text NOT NULL UNIQUE,
          "onboarding_session_id" text,
          "stripe_customer_id" text,
          "stripe_subscription_id" text,
          "stripe_public_key" text,
          "stripe_secret_key" text,
          "stripe_account_id" text,
          "smtp_host" text,
          "smtp_port" integer,
          "smtp_username" text,
          "smtp_password" text,
          "smtp_from_email" text,
          "smtp_from_name" text,
          "smtp_secure" boolean DEFAULT true,
          "smtp_enabled" boolean DEFAULT false,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          "last_login" timestamp
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "services" (
          "id" text PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "description" text NOT NULL,
          "price" text NOT NULL,
          "duration_minutes" integer NOT NULL,
          "category" text
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "client_services" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL,
          "name" text NOT NULL,
          "description" text,
          "price" real NOT NULL,
          "duration_minutes" integer NOT NULL,
          "category" text,
          "is_active" boolean DEFAULT true,
          "stripe_product_id" text,
          "stripe_price_id" text,
          "enable_online_payments" boolean DEFAULT false,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "appointments" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL,
          "customer_name" text NOT NULL,
          "customer_email" text NOT NULL,
          "customer_phone" text,
          "service_id" text NOT NULL,
          "appointment_date" timestamp NOT NULL,
          "start_time" text NOT NULL,
          "end_time" text NOT NULL,
          "status" text DEFAULT 'SCHEDULED' NOT NULL,
          "notes" text,
          "total_price" real NOT NULL,
          "payment_method" text DEFAULT 'CASH',
          "payment_status" text DEFAULT 'PENDING',
          "payment_intent_id" text,
          "email_confirmation" boolean DEFAULT true,
          "sms_confirmation" boolean DEFAULT false,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "appointment_slots" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL,
          "day_of_week" integer NOT NULL,
          "start_time" text NOT NULL,
          "end_time" text NOT NULL,
          "slot_duration" integer NOT NULL,
          "is_active" boolean DEFAULT true,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "leads" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL,
          "name" text NOT NULL,
          "email" text NOT NULL,
          "phone" text,
          "source" text NOT NULL,
          "status" text DEFAULT 'NEW' NOT NULL,
          "notes" text,
          "interested_services" text[] DEFAULT ARRAY[]::text[],
          "estimated_value" real,
          "follow_up_date" timestamp,
          "converted_to_appointment" boolean DEFAULT false,
          "appointment_id" text,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "team_members" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL,
          "name" text NOT NULL,
          "email" text NOT NULL,
          "phone" text,
          "role" text DEFAULT 'STAFF' NOT NULL,
          "permissions" text[] DEFAULT ARRAY[]::text[],
          "is_active" boolean DEFAULT true,
          "hourly_rate" real,
          "specializations" text[] DEFAULT ARRAY[]::text[],
          "working_hours" text,
          "password" text NOT NULL,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "payments" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL,
          "appointment_id" text,
          "payment_method" text NOT NULL,
          "payment_provider" text,
          "payment_intent_id" text,
          "amount" real NOT NULL,
          "currency" text DEFAULT 'USD',
          "status" text DEFAULT 'PENDING' NOT NULL,
          "customer_name" text NOT NULL,
          "customer_email" text NOT NULL,
          "description" text,
          "metadata" text,
          "processing_fee" real,
          "net_amount" real,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          "paid_at" timestamp
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "contact_messages" (
          "id" text PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "email" text NOT NULL,
          "subject" text NOT NULL,
          "message" text NOT NULL,
          "source" text DEFAULT 'website',
          "status" text DEFAULT 'NEW',
          "notes" text,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "domain_configurations" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL,
          "domain_type" text NOT NULL,
          "domain" text NOT NULL,
          "subdomain" text,
          "is_active" boolean DEFAULT false,
          "verification_status" text DEFAULT 'PENDING',
          "verification_token" text,
          "verification_method" text DEFAULT 'DNS_TXT',
          "ssl_status" text DEFAULT 'PENDING',
          "ssl_certificate_id" text,
          "ssl_issued_at" timestamp,
          "ssl_expires_at" timestamp,
          "dns_records" text,
          "redirect_to_https" boolean DEFAULT true,
          "status" text DEFAULT 'PENDING',
          "verified_at" timestamp,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "client_websites" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL UNIQUE,
          "subdomain" text NOT NULL UNIQUE,
          "custom_domain" text,
          "title" text NOT NULL,
          "description" text,
          "hero_image" text,
          "primary_color" text DEFAULT '#3B82F6',
          "secondary_color" text DEFAULT '#F3F4F6',
          "contact_info" text,
          "social_links" text,
          "sections" text,
          "show_prices" boolean DEFAULT true,
          "allow_online_booking" boolean DEFAULT true,
          "is_published" boolean DEFAULT false,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      console.log("\u2705 Database tables created successfully");
    } catch (error) {
      console.error("\u274C Table creation failed:", error);
      throw error;
    }
  }
  async runMigrations() {
    const dbInstance = this.ensureDB();
    try {
      console.log("\u{1F527} Running database migrations for missing columns...");
      const clientServicesColumns = await dbInstance.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'client_services' 
          AND column_name IN ('stripe_product_id', 'stripe_price_id', 'enable_online_payments');
      `);
      const existingColumns = new Set(clientServicesColumns.rows.map((row) => row.column_name));
      if (!existingColumns.has("stripe_product_id")) {
        console.log("Adding stripe_product_id to client_services table...");
        await dbInstance.execute(sql`ALTER TABLE client_services ADD COLUMN stripe_product_id text;`);
      }
      if (!existingColumns.has("stripe_price_id")) {
        console.log("Adding stripe_price_id to client_services table...");
        await dbInstance.execute(sql`ALTER TABLE client_services ADD COLUMN stripe_price_id text;`);
      }
      if (!existingColumns.has("enable_online_payments")) {
        console.log("Adding enable_online_payments to client_services table...");
        await dbInstance.execute(sql`ALTER TABLE client_services ADD COLUMN enable_online_payments boolean DEFAULT false;`);
        await dbInstance.execute(sql`UPDATE client_services SET enable_online_payments = false WHERE enable_online_payments IS NULL;`);
      }
      console.log("\u2705 Database migrations completed successfully");
    } catch (error) {
      console.error("\u274C Migration failed:", error);
      console.log("\u26A0\uFE0F Continuing with initialization despite migration errors...");
    }
  }
  async initializeDatabase() {
    if (this.initialized) return;
    try {
      const dbInstance = this.ensureDB();
      console.log("\u{1F504} Initializing PostgreSQL database tables...");
      await this.createTables();
      await this.runMigrations();
      await this.ensureSuperAdmin();
      await this.seedDemoData();
      this.initialized = true;
      console.log("\u2705 PostgreSQL database initialized successfully");
    } catch (error) {
      console.error("\u274C Database initialization failed:", error);
    }
  }
  async ensureSuperAdmin() {
    const dbInstance = this.ensureDB();
    try {
      const existingAdmin = await dbInstance.select().from(users).where(eq(users.email, "admin@scheduled-platform.com")).limit(1);
      if (existingAdmin.length > 0) {
        console.log("\u{1F464} Super admin user already exists, skipping creation");
        return;
      }
      const adminPassword = "SecurePlatform2025!@#$%";
      console.log("\u{1F464} Creating super admin user...");
      await this.createUser({
        email: "admin@scheduled-platform.com",
        password: adminPassword,
        role: "SUPER_ADMIN"
      });
      console.log("\u2705 Super admin user created successfully");
      console.log(`\u{1F4E7} Admin Email: admin@scheduled-platform.com`);
      console.log(`\u{1F511} Admin Password: ${adminPassword}`);
    } catch (error) {
      console.error("\u274C Super admin creation failed:", error);
    }
  }
  async seedDemoData() {
    const dbInstance = this.ensureDB();
    try {
      const existingPlans = await dbInstance.select().from(plans).limit(1);
      if (existingPlans.length > 0) {
        console.log("\u{1F4CA} Demo data already exists, skipping seed");
        return;
      }
      console.log("\u{1F331} Seeding demo data for production...");
      await dbInstance.insert(plans).values([
        {
          id: "plan_1",
          name: "Free Demo",
          monthlyPrice: 0,
          yearlyPrice: 0,
          features: ["7-day trial", "1 User", "2GB Storage", "Basic Features"],
          maxUsers: 1,
          storageGB: 2,
          isFreeTrial: true,
          trialDays: 7
        },
        {
          id: "plan_2",
          name: "Basic",
          monthlyPrice: 15,
          yearlyPrice: 150,
          features: ["1 User", "10GB Storage", "Basic Support", "Online Booking", "Client Management"],
          maxUsers: 1,
          storageGB: 10
        },
        {
          id: "plan_3",
          name: "Team",
          monthlyPrice: 99.99,
          yearlyPrice: 999.99,
          features: ["5 Users", "100GB Storage", "Priority Support", "Advanced Analytics"],
          maxUsers: 5,
          storageGB: 100
        }
      ]);
      await dbInstance.insert(reviewPlatforms).values([
        {
          id: "review_platform_1",
          name: "Google",
          displayName: "Google Business Profile",
          rating: 4.9,
          maxRating: 5,
          reviewCount: 2500,
          logoUrl: "/icons/google.svg",
          isActive: true,
          sortOrder: 1
        }
      ]);
      console.log("\u2705 Demo data seeded successfully");
    } catch (error) {
      console.error("\u274C Demo data seeding failed:", error);
    }
  }
  // Authentication & Users
  async getUser(id) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  async getUserByEmail(email) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  async createUser(user) {
    const dbInstance = this.ensureDB();
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [newUser] = await dbInstance.insert(users).values({
      ...user,
      password: hashedPassword,
      id: `user_${Date.now()}`,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newUser;
  }
  // Plans Management  
  async getPlans() {
    await this.initializeDatabase();
    const dbInstance = this.ensureDB();
    return dbInstance.select().from(plans);
  }
  async getPlan(id) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(plans).where(eq(plans.id, id)).limit(1);
    return result[0];
  }
  async createPlan(plan) {
    const dbInstance = this.ensureDB();
    const [newPlan] = await dbInstance.insert(plans).values({
      ...plan,
      id: `plan_${Date.now()}`
    }).returning();
    return newPlan;
  }
  async updatePlan(id, updates) {
    const dbInstance = this.ensureDB();
    const [updatedPlan] = await dbInstance.update(plans).set(updates).where(eq(plans.id, id)).returning();
    if (!updatedPlan) throw new Error("Plan not found");
    return updatedPlan;
  }
  async deletePlan(id) {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(plans).where(eq(plans.id, id));
  }
  // Plan synchronization methods
  async syncClientPlans(planId) {
    const dbInstance = this.ensureDB();
    const affectedClients = await dbInstance.select().from(clients).where(eq(clients.planId, planId));
    console.log(`\u{1F504} Syncing plan ${planId} for ${affectedClients.length} clients`);
  }
  async updatePlanPricing(planId, updates) {
    const dbInstance = this.ensureDB();
    const [updatedPlan] = await dbInstance.update(plans).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(plans.id, planId)).returning();
    if (!updatedPlan) throw new Error("Plan not found");
    await this.syncClientPlans(planId);
    return updatedPlan;
  }
  async updateClientPlan(clientId, planId) {
    const dbInstance = this.ensureDB();
    const plan = await dbInstance.select().from(plans).where(eq(plans.id, planId)).limit(1);
    if (plan.length === 0) throw new Error("Plan not found");
    const [updatedClient] = await dbInstance.update(clients).set({ planId, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clients.id, clientId)).returning();
    if (!updatedClient) throw new Error("Client not found");
    return updatedClient;
  }
  // Contact Messages / Super Admin Leads  
  async getContactMessages() {
    const dbInstance = this.ensureDB();
    return dbInstance.select().from(contactMessages).orderBy(sql`${contactMessages.createdAt} DESC`);
  }
  async getContactMessage(id) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1);
    return result[0];
  }
  async createContactMessage(message) {
    const dbInstance = this.ensureDB();
    const [newMessage] = await dbInstance.insert(contactMessages).values({
      ...message,
      id: `contact_${Date.now()}`,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newMessage;
  }
  async updateContactMessage(id, updates) {
    const dbInstance = this.ensureDB();
    const [updatedMessage] = await dbInstance.update(contactMessages).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(contactMessages.id, id)).returning();
    if (!updatedMessage) throw new Error("Contact message not found");
    return updatedMessage;
  }
  async deleteContactMessage(id) {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(contactMessages).where(eq(contactMessages.id, id));
  }
  // Note: For brevity, implementing key methods first. Other methods would follow same pattern
  // using Drizzle ORM operations instead of in-memory arrays
  // Onboarding session implementations 
  async getOnboardingSessions() {
    const dbInstance = this.ensureDB();
    const sessions = await dbInstance.select().from(onboardingSessions);
    return sessions;
  }
  async getOnboardingSession(sessionId) {
    const dbInstance = this.ensureDB();
    const sessions = await dbInstance.select().from(onboardingSessions).where(eq(onboardingSessions.sessionId, sessionId)).limit(1);
    return sessions.length > 0 ? sessions[0] : void 0;
  }
  async createOnboardingSession(session) {
    const dbInstance = this.ensureDB();
    const sessionId = `onb_${Date.now()}`;
    const result = await dbInstance.insert(onboardingSessions).values({
      id: sessionId,
      sessionId: session.sessionId,
      planId: session.planId,
      currentStep: session.currentStep || 1,
      isCompleted: false,
      businessData: session.businessData || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      completedAt: null
    }).returning();
    return result[0];
  }
  async updateOnboardingSession(sessionId, updates) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.update(onboardingSessions).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(onboardingSessions.sessionId, sessionId)).returning();
    if (result.length === 0) throw new Error("Onboarding session not found");
    return result[0];
  }
  async completeOnboarding(sessionId) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.update(onboardingSessions).set({
      isCompleted: true,
      completedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(onboardingSessions.sessionId, sessionId)).returning();
    if (result.length === 0) throw new Error("Onboarding session not found");
    return result[0];
  }
  async getClients() {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(clients);
    return result;
  }
  async getClient(id) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(clients).where(eq(clients.id, id)).limit(1);
    return result.length > 0 ? result[0] : void 0;
  }
  async getClientByEmail(email) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(clients).where(eq(clients.email, email)).limit(1);
    return result.length > 0 ? result[0] : void 0;
  }
  async getClientBySubdomain(subdomain) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select({
      id: clients.id,
      businessName: clients.businessName,
      contactPerson: clients.contactPerson,
      email: clients.email,
      phone: clients.phone,
      businessAddress: clients.businessAddress,
      industry: clients.industry,
      businessDescription: clients.businessDescription,
      logoUrl: clients.logoUrl,
      operatingHours: clients.operatingHours,
      timeZone: clients.timeZone,
      planId: clients.planId,
      status: clients.status,
      userId: clients.userId,
      onboardingSessionId: clients.onboardingSessionId,
      stripeCustomerId: clients.stripeCustomerId,
      stripeSubscriptionId: clients.stripeSubscriptionId,
      stripePublicKey: clients.stripePublicKey,
      stripeSecretKey: clients.stripeSecretKey,
      stripeAccountId: clients.stripeAccountId,
      smtpHost: clients.smtpHost,
      smtpPort: clients.smtpPort,
      smtpUsername: clients.smtpUsername,
      smtpPassword: clients.smtpPassword,
      smtpFromEmail: clients.smtpFromEmail,
      smtpFromName: clients.smtpFromName,
      smtpSecure: clients.smtpSecure,
      smtpEnabled: clients.smtpEnabled,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
      lastLogin: clients.lastLogin
    }).from(clientWebsites).innerJoin(clients, eq(clientWebsites.clientId, clients.id)).where(eq(clientWebsites.subdomain, subdomain)).limit(1);
    return result.length > 0 ? result[0] : void 0;
  }
  async createClient(client) {
    const dbInstance = this.ensureDB();
    const clientId = `client_${Date.now()}`;
    const [newClient] = await dbInstance.insert(clients).values({
      id: clientId,
      businessName: client.businessName,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone || null,
      businessAddress: client.businessAddress || null,
      industry: client.industry || null,
      businessDescription: client.businessDescription || null,
      logoUrl: client.logoUrl || null,
      operatingHours: client.operatingHours || null,
      timeZone: client.timeZone || null,
      planId: client.planId,
      status: client.status || "TRIAL",
      userId: client.userId,
      onboardingSessionId: client.onboardingSessionId || null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePublicKey: null,
      stripeSecretKey: null,
      stripeAccountId: null,
      smtpHost: null,
      smtpPort: null,
      smtpUsername: null,
      smtpPassword: null,
      smtpFromEmail: null,
      smtpFromName: null,
      smtpSecure: true,
      smtpEnabled: false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      lastLogin: null
    }).returning();
    return newClient;
  }
  async updateClient(id, updates) {
    const dbInstance = this.ensureDB();
    const [updatedClient] = await dbInstance.update(clients).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clients.id, id)).returning();
    if (!updatedClient) throw new Error("Client not found");
    return updatedClient;
  }
  async deleteClient(id) {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(clients).where(eq(clients.id, id));
  }
  async getServices() {
    return [];
  }
  async getService(id) {
    return void 0;
  }
  async createService(service) {
    const dbInstance = this.ensureDB();
    const id = `service_${Date.now()}`;
    const [createdService] = await dbInstance.insert(services).values({ ...service, id }).returning();
    return createdService;
  }
  async getReviews() {
    return [];
  }
  async createReview(review) {
    throw new Error("Not implemented");
  }
  async getClientServices(clientId) {
    const dbInstance = this.ensureDB();
    const services2 = await dbInstance.select().from(clientServices).where(eq(clientServices.clientId, clientId));
    return services2;
  }
  async createClientService(service) {
    const dbInstance = this.ensureDB();
    const serviceId = `service_${Date.now()}`;
    const [newService] = await dbInstance.insert(clientServices).values({
      id: serviceId,
      clientId: service.clientId,
      name: service.name,
      description: service.description || null,
      price: service.price,
      durationMinutes: service.durationMinutes,
      category: service.category || null,
      isActive: service.isActive !== void 0 ? service.isActive : true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newService;
  }
  async updateClientService(id, updates) {
    const dbInstance = this.ensureDB();
    const [updatedService] = await dbInstance.update(clientServices).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clientServices.id, id)).returning();
    if (!updatedService) throw new Error("Client service not found");
    return updatedService;
  }
  async deleteClientService(id) {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(clientServices).where(eq(clientServices.id, id));
  }
  async getAppointments(clientId) {
    const dbInstance = this.ensureDB();
    const clientAppointments = await dbInstance.select().from(appointments).where(eq(appointments.clientId, clientId));
    return clientAppointments;
  }
  async getAppointment(id) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    return result.length > 0 ? result[0] : void 0;
  }
  async createAppointment(appointment) {
    const dbInstance = this.ensureDB();
    const appointmentId = `appt_${Date.now()}`;
    const [newAppointment] = await dbInstance.insert(appointments).values({
      id: appointmentId,
      clientId: appointment.clientId,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      customerPhone: appointment.customerPhone || null,
      serviceId: appointment.serviceId,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status || "SCHEDULED",
      notes: appointment.notes || null,
      totalPrice: appointment.totalPrice,
      paymentMethod: appointment.paymentMethod || "CASH",
      paymentStatus: appointment.paymentStatus || "PENDING",
      paymentIntentId: appointment.paymentIntentId || null,
      emailConfirmation: appointment.emailConfirmation !== void 0 ? appointment.emailConfirmation : true,
      smsConfirmation: appointment.smsConfirmation !== void 0 ? appointment.smsConfirmation : false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newAppointment;
  }
  async updateAppointment(id, updates) {
    const dbInstance = this.ensureDB();
    const [updatedAppointment] = await dbInstance.update(appointments).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(appointments.id, id)).returning();
    if (!updatedAppointment) throw new Error("Appointment not found");
    return updatedAppointment;
  }
  async deleteAppointment(id) {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(appointments).where(eq(appointments.id, id));
  }
  // Appointment transfer methods
  async transferAppointment(appointmentId, toStaffId, transferredBy, reason) {
    const dbInstance = this.ensureDB();
    const appointment = await this.getAppointment(appointmentId);
    if (!appointment) throw new Error("Appointment not found");
    const transferId = `transfer_${Date.now()}`;
    await dbInstance.insert(appointmentTransfers).values({
      id: transferId,
      appointmentId,
      clientId: appointment.clientId,
      fromStaffId: appointment.assignedTo || null,
      toStaffId,
      transferredBy,
      reason: reason || null,
      createdAt: /* @__PURE__ */ new Date()
    });
    return await this.updateAppointment(appointmentId, { assignedTo: toStaffId });
  }
  async getAppointmentTransfers(appointmentId) {
    const dbInstance = this.ensureDB();
    const transfers = await dbInstance.select().from(appointmentTransfers).where(eq(appointmentTransfers.appointmentId, appointmentId));
    return transfers;
  }
  async getStaffTransfers(staffId) {
    const dbInstance = this.ensureDB();
    const transfers = await dbInstance.select().from(appointmentTransfers).where(
      sql`${appointmentTransfers.fromStaffId} = ${staffId} OR ${appointmentTransfers.toStaffId} = ${staffId}`
    );
    return transfers;
  }
  async getOperatingHours(clientId) {
    return [];
  }
  async setOperatingHours(clientId, hours) {
    return [];
  }
  async getLeads(clientId) {
    const dbInstance = this.ensureDB();
    const clientLeads = await dbInstance.select().from(leads).where(eq(leads.clientId, clientId));
    return clientLeads;
  }
  async getLead(id) {
    return void 0;
  }
  async createLead(lead) {
    const dbInstance = this.ensureDB();
    const leadId = `lead_${Date.now()}`;
    const [newLead] = await dbInstance.insert(leads).values({
      id: leadId,
      clientId: lead.clientId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || null,
      source: lead.source,
      status: lead.status || "NEW",
      notes: lead.notes || null,
      interestedServices: lead.interestedServices || [],
      estimatedValue: lead.estimatedValue || null,
      followUpDate: lead.followUpDate || null,
      convertedToAppointment: lead.convertedToAppointment || false,
      appointmentId: lead.appointmentId || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newLead;
  }
  async updateLead(id, updates) {
    const dbInstance = this.ensureDB();
    const [updatedLead] = await dbInstance.update(leads).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(leads.id, id)).returning();
    if (!updatedLead) throw new Error("Lead not found");
    return updatedLead;
  }
  async deleteLead(id) {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(leads).where(eq(leads.id, id));
  }
  async getClientWebsite(clientId) {
    const dbInstance = this.ensureDB();
    const [website] = await dbInstance.select().from(clientWebsites).where(eq(clientWebsites.clientId, clientId)).limit(1);
    return website;
  }
  async createClientWebsite(website) {
    const dbInstance = this.ensureDB();
    const id = `website_${Date.now()}`;
    const [createdWebsite] = await dbInstance.insert(clientWebsites).values({ ...website, id }).returning();
    return createdWebsite;
  }
  async updateClientWebsite(clientId, updates) {
    const dbInstance = this.ensureDB();
    const [updatedWebsite] = await dbInstance.update(clientWebsites).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clientWebsites.clientId, clientId)).returning();
    if (!updatedWebsite) {
      const websiteId = `website_${Date.now()}`;
      const [newWebsite] = await dbInstance.insert(clientWebsites).values({
        id: websiteId,
        clientId,
        title: "My Business",
        description: "Professional services",
        primaryColor: "#3B82F6",
        showServices: true,
        showBooking: true,
        contactEmail: "",
        contactPhone: "",
        subdomain: `client-${clientId.replace("client_", "")}`,
        isPublished: false,
        ...updates,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      return newWebsite;
    }
    return updatedWebsite;
  }
  async getPublicWebsite(subdomain) {
    const dbInstance = this.ensureDB();
    const [website] = await dbInstance.select().from(clientWebsites).where(eq(clientWebsites.subdomain, subdomain)).limit(1);
    return website;
  }
  async getAppointmentSlots(clientId) {
    const dbInstance = this.ensureDB();
    const slots = await dbInstance.select().from(appointmentSlots).where(eq(appointmentSlots.clientId, clientId));
    return slots;
  }
  async createAppointmentSlot(slot) {
    const dbInstance = this.ensureDB();
    const slotId = `slot_${Date.now()}`;
    const [newSlot] = await dbInstance.insert(appointmentSlots).values({
      id: slotId,
      clientId: slot.clientId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotDuration: slot.slotDuration,
      isActive: slot.isActive !== void 0 ? slot.isActive : true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newSlot;
  }
  async updateAppointmentSlot(id, updates) {
    throw new Error("Not implemented");
  }
  async deleteAppointmentSlot(id) {
    throw new Error("Not implemented");
  }
  async getAvailableSlots(clientId, date) {
    const dbInstance = this.ensureDB();
    const [year, month, day] = date.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    const dayOfWeek = localDate.getDay();
    console.log(`DBStorage.getAvailableSlots: date=${date}, parsed=(${year},${month},${day}), dayOfWeek=${dayOfWeek}`);
    const daySlots = await dbInstance.select().from(appointmentSlots).where(
      and(
        eq(appointmentSlots.clientId, clientId),
        eq(appointmentSlots.dayOfWeek, dayOfWeek),
        eq(appointmentSlots.isActive, true)
      )
    );
    console.log(`Found ${daySlots.length} slot configurations for dayOfWeek ${dayOfWeek}`);
    if (daySlots.length === 0) return [];
    const existingAppointments = await dbInstance.select().from(appointments).where(eq(appointments.clientId, clientId));
    const bookedTimes = existingAppointments.filter((apt) => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate.toDateString() === localDate.toDateString();
    }).map((apt) => apt.startTime);
    const availableSlots = /* @__PURE__ */ new Set();
    for (const slotConfig of daySlots) {
      const start = this.timeToMinutes(slotConfig.startTime);
      const end = this.timeToMinutes(slotConfig.endTime);
      const duration = slotConfig.slotDuration || 30;
      for (let time = start; time < end; time += duration) {
        const timeString = this.minutesToTime(time);
        if (!bookedTimes.includes(timeString)) {
          availableSlots.add(timeString);
        }
      }
    }
    const result = Array.from(availableSlots).sort();
    console.log(`DBStorage.getAvailableSlots returning ${result.length} slots:`, result);
    return result;
  }
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }
  async getTeamMembers(clientId) {
    const dbInstance = this.ensureDB();
    const members = await dbInstance.select().from(teamMembers).where(eq(teamMembers.clientId, clientId));
    return members;
  }
  async getTeamMember(id) {
    return void 0;
  }
  async createTeamMember(member) {
    const dbInstance = this.ensureDB();
    const memberId = `team_${Date.now()}`;
    const [newMember] = await dbInstance.insert(teamMembers).values({
      id: memberId,
      clientId: member.clientId,
      name: member.name,
      email: member.email,
      phone: member.phone || null,
      role: member.role || "STAFF",
      permissions: member.permissions || [],
      isActive: member.isActive !== void 0 ? member.isActive : true,
      hourlyRate: member.hourlyRate || null,
      specializations: member.specializations || [],
      workingHours: member.workingHours || null,
      password: member.password,
      // Should be hashed before calling this method
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newMember;
  }
  async updateTeamMember(id, updates) {
    const dbInstance = this.ensureDB();
    const [updatedMember] = await dbInstance.update(teamMembers).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(teamMembers.id, id)).returning();
    if (!updatedMember) throw new Error("Team member not found");
    return updatedMember;
  }
  async deleteTeamMember(id) {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(teamMembers).where(eq(teamMembers.id, id));
  }
  async getReviewPlatforms() {
    return [];
  }
  async getReviewPlatform(id) {
    return void 0;
  }
  async createReviewPlatform(platform) {
    throw new Error("Not implemented");
  }
  async updateReviewPlatform(id, updates) {
    throw new Error("Not implemented");
  }
  async deleteReviewPlatform(id) {
    throw new Error("Not implemented");
  }
  async getReviewPlatformConnections(clientId) {
    return [];
  }
  async getReviewPlatformConnection(id) {
    return void 0;
  }
  async createReviewPlatformConnection(connection) {
    throw new Error("Not implemented");
  }
  async updateReviewPlatformConnection(id, updates) {
    throw new Error("Not implemented");
  }
  async deleteReviewPlatformConnection(id) {
    throw new Error("Not implemented");
  }
  async syncReviewPlatformData(connectionId) {
    throw new Error("Not implemented");
  }
  async getPlatformReviews(clientId, platform) {
    return [];
  }
  async getPlatformReview(id) {
    return void 0;
  }
  async createPlatformReview(review) {
    throw new Error("Not implemented");
  }
  async updatePlatformReview(id, updates) {
    throw new Error("Not implemented");
  }
  async deletePlatformReview(id) {
    throw new Error("Not implemented");
  }
  async getDomainConfigurations(clientId) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(domainConfigurations).where(eq(domainConfigurations.clientId, clientId));
    return result;
  }
  async getDomainConfiguration(id) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(domainConfigurations).where(eq(domainConfigurations.id, id)).limit(1);
    return result.length > 0 ? result[0] : void 0;
  }
  async getDomainConfigurationByDomain(domain) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(domainConfigurations).where(eq(domainConfigurations.domain, domain)).limit(1);
    return result.length > 0 ? result[0] : void 0;
  }
  async createDomainConfiguration(domain) {
    const dbInstance = this.ensureDB();
    const id = `domain_${Date.now()}`;
    const [createdDomain] = await dbInstance.insert(domainConfigurations).values({
      id,
      clientId: domain.clientId,
      domainType: domain.domainType,
      domain: domain.domain,
      subdomain: domain.subdomain,
      isActive: domain.isActive,
      verificationStatus: domain.verificationStatus,
      verificationToken: domain.verificationToken,
      verificationMethod: domain.verificationMethod,
      sslStatus: domain.sslStatus,
      sslCertificateId: domain.sslCertificateId,
      sslIssuedAt: domain.sslIssuedAt,
      sslExpiresAt: domain.sslExpiresAt,
      dnsRecords: domain.dnsRecords,
      redirectToHttps: domain.redirectToHttps,
      // customSettings: domain.customSettings, // Column doesn't exist in Coolify production DB
      // lastCheckedAt: domain.lastCheckedAt, // Column doesn't exist in Coolify production DB
      verifiedAt: domain.verifiedAt
    }).returning();
    return createdDomain;
  }
  async updateDomainConfiguration(id, updates) {
    const dbInstance = this.ensureDB();
    const [updatedDomain] = await dbInstance.update(domainConfigurations).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(domainConfigurations.id, id)).returning();
    if (!updatedDomain) throw new Error("Domain configuration not found");
    return updatedDomain;
  }
  async deleteDomainConfiguration(id) {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(domainConfigurations).where(eq(domainConfigurations.id, id));
  }
  async verifyDomain(id) {
    const dbInstance = this.ensureDB();
    const [domain] = await dbInstance.update(domainConfigurations).set({ status: "VERIFIED", verifiedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(domainConfigurations.id, id)).returning();
    if (!domain) throw new Error("Domain configuration not found");
    return domain;
  }
  async getGoogleBusinessProfile(clientId) {
    return void 0;
  }
  async createGoogleBusinessProfile(profile) {
    throw new Error("Not implemented");
  }
  async updateGoogleBusinessProfile(clientId, updates) {
    throw new Error("Not implemented");
  }
  async deleteGoogleBusinessProfile(clientId) {
    throw new Error("Not implemented");
  }
  async syncGoogleBusinessProfile(clientId) {
    throw new Error("Not implemented");
  }
  async getDomainVerificationLogs(domainConfigId) {
    return [];
  }
  async createDomainVerificationLog(log2) {
    throw new Error("Not implemented");
  }
  async getNewsletterSubscriptions(clientId) {
    return [];
  }
  async getNewsletterSubscription(id) {
    return void 0;
  }
  async createNewsletterSubscription(subscription) {
    throw new Error("Not implemented");
  }
  async updateNewsletterSubscription(id, updates) {
    throw new Error("Not implemented");
  }
  async deleteNewsletterSubscription(id) {
    throw new Error("Not implemented");
  }
  async getWebsiteStaff(clientId) {
    return [];
  }
  async getWebsiteStaffMember(id) {
    return void 0;
  }
  async createWebsiteStaff(staff) {
    throw new Error("Not implemented");
  }
  async updateWebsiteStaff(id, updates) {
    throw new Error("Not implemented");
  }
  async deleteWebsiteStaff(id) {
    throw new Error("Not implemented");
  }
  async getServicePricingTiers(clientId) {
    return [];
  }
  async getServicePricingTier(id) {
    return void 0;
  }
  async createServicePricingTier(tier) {
    throw new Error("Not implemented");
  }
  async updateServicePricingTier(id, updates) {
    throw new Error("Not implemented");
  }
  async deleteServicePricingTier(id) {
    throw new Error("Not implemented");
  }
  async getWebsiteTestimonials(clientId) {
    return [];
  }
  async getWebsiteTestimonial(id) {
    return void 0;
  }
  async createWebsiteTestimonial(testimonial) {
    throw new Error("Not implemented");
  }
  async updateWebsiteTestimonial(id, updates) {
    throw new Error("Not implemented");
  }
  async deleteWebsiteTestimonial(id) {
    throw new Error("Not implemented");
  }
  async getPayments(clientId) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(payments).where(eq(payments.clientId, clientId));
    return result;
  }
  async getPayment(id) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(payments).where(eq(payments.id, id)).limit(1);
    return result.length > 0 ? result[0] : void 0;
  }
  async createPayment(payment) {
    const dbInstance = this.ensureDB();
    const paymentId = `payment_${Date.now()}`;
    const [newPayment] = await dbInstance.insert(payments).values({
      id: paymentId,
      clientId: payment.clientId,
      appointmentId: payment.appointmentId || null,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentProvider: payment.paymentProvider || null,
      paymentIntentId: payment.paymentIntentId || null,
      status: payment.status || "PENDING",
      currency: payment.currency || "USD",
      description: payment.description || null,
      customerName: payment.customerName,
      customerEmail: payment.customerEmail,
      metadata: payment.metadata || null,
      processingFee: payment.processingFee || null,
      netAmount: payment.netAmount || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      paidAt: payment.paidAt || null
    }).returning();
    return newPayment;
  }
  async updatePayment(id, updates) {
    const dbInstance = this.ensureDB();
    const [updatedPayment] = await dbInstance.update(payments).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(payments.id, id)).returning();
    if (!updatedPayment) throw new Error("Payment not found");
    return updatedPayment;
  }
  async getPaymentsByAppointment(appointmentId) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(payments).where(eq(payments.appointmentId, appointmentId));
    return result;
  }
  async calculateServiceAmount(clientId, serviceId) {
    return 0;
  }
  async calculateTotalWithTip(baseAmount, tipPercentage) {
    return baseAmount;
  }
  async updateStripeConfig(clientId, publicKey, secretKey) {
    const dbInstance = this.ensureDB();
    const [updatedClient] = await dbInstance.update(clients).set({
      stripePublicKey: publicKey,
      stripeSecretKey: secretKey,
      // Note: In production, this should be encrypted
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(clients.id, clientId)).returning();
    if (!updatedClient) throw new Error("Client not found");
  }
  async getStripePublicKey(clientId) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select({ stripePublicKey: clients.stripePublicKey }).from(clients).where(eq(clients.id, clientId)).limit(1);
    return result.length > 0 ? result[0].stripePublicKey : null;
  }
  async getStripeSecretKey(clientId) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select({ stripeSecretKey: clients.stripeSecretKey }).from(clients).where(eq(clients.id, clientId)).limit(1);
    return result.length > 0 ? result[0].stripeSecretKey : null;
  }
  async validateStripeConfig(clientId) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select({
      stripePublicKey: clients.stripePublicKey,
      stripeSecretKey: clients.stripeSecretKey
    }).from(clients).where(eq(clients.id, clientId)).limit(1);
    const hasClientConfig = result.length > 0 && !!(result[0].stripePublicKey && result[0].stripeSecretKey);
    const hasGlobalConfig = !!(process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY);
    return hasClientConfig || hasGlobalConfig;
  }
  async clearStripeConfig(clientId) {
    const dbInstance = this.ensureDB();
    const [updatedClient] = await dbInstance.update(clients).set({
      stripePublicKey: null,
      stripeSecretKey: null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(clients.id, clientId)).returning();
    if (!updatedClient) throw new Error("Client not found");
  }
  async updateSmtpConfig(clientId, config) {
    const dbInstance = this.ensureDB();
    const [updatedClient] = await dbInstance.update(clients).set({
      ...config,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(clients.id, clientId)).returning();
    if (!updatedClient) throw new Error("Client not found");
  }
  async getSmtpConfig(clientId) {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select({
      smtpHost: clients.smtpHost,
      smtpPort: clients.smtpPort,
      smtpUsername: clients.smtpUsername,
      smtpPassword: clients.smtpPassword,
      smtpFromEmail: clients.smtpFromEmail,
      smtpFromName: clients.smtpFromName,
      smtpSecure: clients.smtpSecure,
      smtpEnabled: clients.smtpEnabled
    }).from(clients).where(eq(clients.id, clientId)).limit(1);
    if (result.length === 0) {
      return { isConfigured: false, smtpHost: null, smtpPort: null, smtpUsername: null, smtpPassword: null, smtpFromEmail: null, smtpFromName: null, smtpSecure: null, smtpEnabled: null };
    }
    const client = result[0];
    const isConfigured = !!(client.smtpHost && client.smtpPort && client.smtpUsername && client.smtpPassword && client.smtpFromEmail);
    return {
      isConfigured,
      smtpHost: client.smtpHost,
      smtpPort: client.smtpPort,
      smtpUsername: client.smtpUsername,
      smtpPassword: client.smtpPassword,
      smtpFromEmail: client.smtpFromEmail,
      smtpFromName: client.smtpFromName,
      smtpSecure: client.smtpSecure,
      smtpEnabled: client.smtpEnabled
    };
  }
  async testSmtpConfig(clientId) {
    const config = await this.getSmtpConfig(clientId);
    return config.isConfigured;
  }
  async clearSmtpConfig(clientId) {
    const dbInstance = this.ensureDB();
    const [updatedClient] = await dbInstance.update(clients).set({
      smtpHost: null,
      smtpPort: null,
      smtpUsername: null,
      smtpPassword: null,
      smtpFromEmail: null,
      smtpFromName: null,
      smtpSecure: null,
      smtpEnabled: false,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(clients.id, clientId)).returning();
    if (!updatedClient) throw new Error("Client not found");
  }
};
function createStorage() {
  const isReplit2 = !!process.env.REPL_ID || process.env.DEPLOY_TARGET === "replit";
  const isVercel = !!process.env.VERCEL || process.env.DEPLOY_TARGET === "vercel";
  const isCoolify2 = process.env.DEPLOY_TARGET === "coolify" || !!process.env.COOLIFY_BRANCH || !!process.env.COOLIFY_PROJECT_UUID;
  const isProduction2 = true;
  const hasDatabaseUrl2 = !!process.env.DATABASE_URL;
  console.log(`\u{1F527} Database Environment Detection:`);
  console.log(`  - Replit: ${isReplit2 ? "Yes" : "No"}`);
  console.log(`  - Coolify: ${isCoolify2 ? "Yes" : "No"}`);
  console.log(`  - Production: ${isProduction2 ? "Yes" : "No"}`);
  console.log(`  - DATABASE_URL present: ${hasDatabaseUrl2 ? "Yes" : "No"}`);
  const useDatabase = (isCoolify2 || isVercel || isProduction2) && hasDatabaseUrl2;
  const storageType = useDatabase ? "PostgreSQL" : "MemStorage";
  const environment = isReplit2 ? "Replit" : isCoolify2 ? "Coolify" : isVercel ? "Vercel" : "Unknown";
  console.log(`\u{1F527} Environment: ${environment}`);
  console.log(`\u{1F4BE} Storage: ${storageType}`);
  console.log(`\u{1F5C4}\uFE0F  Database URL present: ${hasDatabaseUrl2 ? "Yes" : "No"}`);
  console.log(`\u{1F680} Production mode: ${isProduction2 ? "Yes" : "No"}`);
  console.log(`\u{1F4CA} Demo data: ${useDatabase ? "Disabled (Production)" : "Enabled (Development)"}`);
  if (useDatabase) {
    console.log(`\u2705 Using PostgreSQL database for production data`);
    return new PostgreSQLStorage();
  } else {
    console.log(`\u2705 Using MemStorage with demo data for development`);
    return new MemStorage();
  }
}
__name(createStorage, "createStorage");
var storage = createStorage();

// server/glossgenius-integration.ts
var GlossGeniusIntegration = class {
  static {
    __name(this, "GlossGeniusIntegration");
  }
  config;
  constructor(config) {
    this.config = config;
  }
  async makeRequest(endpoint) {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`GlossGenius API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
  async getAppointments(startDate, endDate) {
    let endpoint = `/v1/businesses/${this.config.businessId}/appointments`;
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    const data = await this.makeRequest(endpoint);
    return data.appointments || [];
  }
  async getClients() {
    const endpoint = `/v1/businesses/${this.config.businessId}/clients`;
    const data = await this.makeRequest(endpoint);
    return data.clients || [];
  }
  async getServices() {
    const endpoint = `/v1/businesses/${this.config.businessId}/services`;
    const data = await this.makeRequest(endpoint);
    return data.services || [];
  }
  // Convert GlossGenius appointments to our app format (for import)
  convertAppointments(ggAppointments) {
    return ggAppointments.map((appointment) => ({
      clientName: appointment.client_name,
      clientEmail: appointment.client_email,
      clientPhone: appointment.client_phone,
      serviceName: appointment.service_name,
      stylistName: appointment.staff_name,
      date: new Date(appointment.start_time).toISOString().split("T")[0],
      time: new Date(appointment.start_time).toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit"
      }),
      duration: Math.round((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / (1e3 * 60)),
      price: appointment.price,
      status: appointment.status,
      notes: appointment.notes || "",
      originalId: appointment.id
    }));
  }
  // EXPORT: Create appointment in GlossGenius
  async createAppointment(appointmentData) {
    const endpoint = `/v1/businesses/${this.config.businessId}/appointments`;
    const ggAppointment = {
      client_id: appointmentData.clientId,
      service_id: appointmentData.serviceId,
      staff_id: appointmentData.staffId,
      start_time: appointmentData.startTime,
      end_time: appointmentData.endTime,
      notes: appointmentData.notes || "",
      status: appointmentData.status || "confirmed"
    };
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
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
  async findOrCreateClient(clientData) {
    const clients2 = await this.getClients();
    const existingClient = clients2.find((c) => c.email === clientData.email);
    if (existingClient) {
      return existingClient.id;
    }
    const endpoint = `/v1/businesses/${this.config.businessId}/clients`;
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        first_name: clientData.firstName,
        last_name: clientData.lastName,
        email: clientData.email,
        phone: clientData.phone,
        notes: clientData.notes || ""
      })
    });
    if (!response.ok) {
      throw new Error(`Failed to create client in GlossGenius: ${response.status}`);
    }
    const result = await response.json();
    return result.client.id;
  }
  // EXPORT: Convert our appointments to GlossGenius format and create them
  async exportAppointments(appointments2) {
    let success = 0;
    let failed = 0;
    const errors = [];
    for (const appointment of appointments2) {
      try {
        const nameParts = appointment.clientName.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        const clientId = await this.findOrCreateClient({
          firstName,
          lastName,
          email: appointment.clientEmail,
          phone: appointment.clientPhone
        });
        const services2 = await this.getServices();
        const service = services2.find(
          (s) => s.name.toLowerCase() === appointment.serviceName.toLowerCase()
        );
        if (!service) {
          throw new Error(`Service "${appointment.serviceName}" not found in GlossGenius`);
        }
        const startTime = /* @__PURE__ */ new Date(`${appointment.date}T${appointment.time}`);
        const endTime = new Date(startTime.getTime() + (appointment.duration || 60) * 6e4);
        await this.createAppointment({
          clientId,
          serviceId: service.id,
          staffId: appointment.staffId || "",
          // Will need to be provided or mapped
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: appointment.notes || "",
          status: appointment.status || "confirmed"
        });
        success++;
      } catch (error) {
        failed++;
        errors.push({
          appointment: appointment.clientName,
          error: error.message
        });
      }
    }
    return { success, failed, errors };
  }
};

// server/domain-validation.ts
import { z } from "zod";
var VALID_TLDS = /* @__PURE__ */ new Set([
  "com",
  "org",
  "net",
  "edu",
  "gov",
  "mil",
  "int",
  "co",
  "io",
  "ai",
  "app",
  "dev",
  "tech",
  "info",
  "biz",
  "name",
  "pro",
  "us",
  "uk",
  "ca",
  "au",
  "de",
  "fr",
  "jp",
  "br",
  "in",
  "cn",
  "ru"
]);
var DomainValidationError = class extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = "DomainValidationError";
  }
  static {
    __name(this, "DomainValidationError");
  }
};
function normalizeDomain(domain) {
  if (!domain || typeof domain !== "string") {
    throw new DomainValidationError("Domain must be a non-empty string", "INVALID_INPUT");
  }
  let normalized = domain.toLowerCase().trim();
  normalized = normalized.replace(/^https?:\/\//, "");
  normalized = normalized.replace(/^www\./, "");
  normalized = normalized.replace(/\/$/, "");
  return normalized;
}
__name(normalizeDomain, "normalizeDomain");
function validateDomainFormat(domain) {
  const normalizedDomain = normalizeDomain(domain);
  if (!normalizedDomain) {
    throw new DomainValidationError("Domain cannot be empty", "EMPTY_DOMAIN");
  }
  if (normalizedDomain.includes("*")) {
    throw new DomainValidationError("Wildcard domains are not allowed", "WILDCARD_NOT_ALLOWED");
  }
  const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (ipRegex.test(normalizedDomain)) {
    throw new DomainValidationError("IP addresses are not allowed as domains", "IP_NOT_ALLOWED");
  }
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;
  if (!domainRegex.test(normalizedDomain)) {
    throw new DomainValidationError("Invalid domain format", "INVALID_FORMAT");
  }
  if (normalizedDomain.length > 253) {
    throw new DomainValidationError("Domain name too long (max 253 characters)", "TOO_LONG");
  }
  if (normalizedDomain.includes("..")) {
    throw new DomainValidationError("Domain cannot contain consecutive dots", "CONSECUTIVE_DOTS");
  }
  if (normalizedDomain.startsWith(".") || normalizedDomain.endsWith(".") || normalizedDomain.startsWith("-") || normalizedDomain.endsWith("-")) {
    throw new DomainValidationError("Domain cannot start or end with dots or hyphens", "INVALID_BOUNDARIES");
  }
}
__name(validateDomainFormat, "validateDomainFormat");
function validateTLD(domain) {
  const normalizedDomain = normalizeDomain(domain);
  const parts = normalizedDomain.split(".");
  if (parts.length < 2) {
    throw new DomainValidationError("Domain must have at least one dot (e.g., example.com)", "MISSING_TLD");
  }
  const tld = parts[parts.length - 1];
  if (!VALID_TLDS.has(tld)) {
    throw new DomainValidationError(`TLD '${tld}' is not supported`, "UNSUPPORTED_TLD");
  }
}
__name(validateTLD, "validateTLD");
function validateDomain(domain) {
  const normalizedDomain = normalizeDomain(domain);
  validateDomainFormat(normalizedDomain);
  validateTLD(normalizedDomain);
  return normalizedDomain;
}
__name(validateDomain, "validateDomain");
var domainValidationSchema = z.string().transform((domain, ctx) => {
  try {
    return validateDomain(domain);
  } catch (error) {
    if (error instanceof DomainValidationError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error.message,
        path: []
      });
    } else {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Domain validation failed",
        path: []
      });
    }
    return z.NEVER;
  }
});
var enhancedDomainConfigurationSchema = z.object({
  domain: domainValidationSchema,
  domainType: z.enum(["ADMIN_PORTAL", "CLIENT_WEBSITE"]),
  subdomain: z.string().optional().transform((sub) => {
    if (!sub) return void 0;
    const normalizedSub = sub.toLowerCase().trim();
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(normalizedSub)) {
      throw new Error("Invalid subdomain format");
    }
    return normalizedSub;
  }),
  verificationMethod: z.enum(["DNS_TXT", "FILE_UPLOAD", "CNAME"]).default("DNS_TXT"),
  redirectToHttps: z.boolean().default(true)
  // customSettings: z.string().optional() // Temporarily disabled until database migration
});

// server/routes.ts
import { v4 as uuidv4 } from "uuid";

// server/rate-limiter.ts
var RateLimiter = class {
  static {
    __name(this, "RateLimiter");
  }
  store = {};
  maxRequests;
  windowMs;
  constructor(maxRequests = 100, windowMs = 15 * 60 * 1e3) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    setInterval(() => this.cleanup(), 5 * 60 * 1e3);
  }
  check(identifier) {
    const now = Date.now();
    const key = identifier;
    if (!this.store[key] || now > this.store[key].resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: this.store[key].resetTime
      };
    }
    this.store[key].count++;
    return {
      allowed: this.store[key].count <= this.maxRequests,
      remaining: Math.max(0, this.maxRequests - this.store[key].count),
      resetTime: this.store[key].resetTime
    };
  }
  cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    });
  }
};
var generalLimiter = new RateLimiter(100, 15 * 60 * 1e3);
var paymentLimiter = new RateLimiter(10, 60 * 1e3);
var emailLimiter = new RateLimiter(20, 60 * 60 * 1e3);
var contactFormLimiter = new RateLimiter(5, 15 * 60 * 1e3);
function createRateLimitMiddleware(limiter) {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress || "unknown";
    const result = limiter.check(identifier);
    res.set({
      "X-RateLimit-Limit": limiter["maxRequests"],
      "X-RateLimit-Remaining": result.remaining,
      "X-RateLimit-Reset": Math.ceil(result.resetTime / 1e3)
    });
    if (!result.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1e3)
      });
    }
    next();
  };
}
__name(createRateLimitMiddleware, "createRateLimitMiddleware");

// server/routes.ts
import bcrypt2 from "bcrypt";
var stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
var requireAdmin = /* @__PURE__ */ __name(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Admin authentication required" });
    }
    const userSession = req.headers["x-admin-user"];
    if (!userSession) {
      return res.status(401).json({ error: "Admin user session required" });
    }
    try {
      const userData = JSON.parse(userSession);
      if (!userData.role || userData.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Super admin privileges required" });
      }
      const user = await storage.getUserByEmail(userData.email);
      if (!user || user.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Invalid admin credentials" });
      }
      req.adminUser = userData;
      next();
    } catch (parseError) {
      return res.status(401).json({ error: "Invalid admin session format" });
    }
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ error: "Admin authentication failed" });
  }
}, "requireAdmin");
var requirePermission = /* @__PURE__ */ __name((requiredPermission) => {
  return async (req, res, next) => {
    try {
      const teamMemberSession = req.headers["x-team-member-session"];
      if (teamMemberSession) {
        try {
          const sessionData = JSON.parse(teamMemberSession);
          if (sessionData.permissions && sessionData.permissions.includes("*")) {
            console.log(`Business owner access granted for ${requiredPermission}`);
            return next();
          }
          const { clientId } = req.params;
          if (!clientId || sessionData.clientId !== clientId) {
            return res.status(403).json({ error: "Access denied: Client ID mismatch or missing" });
          }
          if (!sessionData.permissions.includes(requiredPermission)) {
            return res.status(403).json({
              error: `Access denied: Missing required permission '${requiredPermission}'`
            });
          }
          return next();
        } catch (parseError) {
          return res.status(401).json({ error: "Invalid team member session format" });
        }
      }
      return res.status(401).json({ error: "Authentication required: Missing team member session" });
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ error: "Permission validation failed" });
    }
  };
}, "requirePermission");
async function registerRoutes(app2) {
  app2.use(express.json({ limit: "50mb" }));
  app2.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Team-Member-Session");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  app2.get("/api/health", (req, res) => {
    res.json({ status: "healthy", service: "SaaS Platform API" });
  });
  app2.post("/api/payments/create-payment-intent", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }
    try {
      const { planId, clientEmail, billingPeriod = "monthly" } = req.body;
      const plan = await storage.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      let amount = 0;
      let finalBillingPeriod = billingPeriod;
      if (plan.monthlyPrice !== void 0 || plan.yearlyPrice !== void 0) {
        const requestedPrice = billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
        const requestedDiscount = billingPeriod === "monthly" ? plan.monthlyDiscount || 0 : plan.yearlyDiscount || 0;
        const requestedEnabled = billingPeriod === "monthly" ? plan.monthlyEnabled !== false : plan.yearlyEnabled !== false;
        if (requestedEnabled && requestedPrice) {
          amount = requestedPrice * (1 - requestedDiscount / 100);
        } else {
          if (plan.monthlyEnabled && plan.monthlyPrice) {
            amount = plan.monthlyPrice * (1 - (plan.monthlyDiscount || 0) / 100);
            finalBillingPeriod = "monthly";
          } else if (plan.yearlyEnabled && plan.yearlyPrice) {
            amount = plan.yearlyPrice * (1 - (plan.yearlyDiscount || 0) / 100);
            finalBillingPeriod = "yearly";
          }
        }
      } else {
        amount = plan.price || 0;
      }
      if (amount <= 0) {
        return res.status(400).json({
          error: "No valid pricing available for this plan and billing period"
        });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        // Convert to cents
        currency: "usd",
        metadata: {
          planId: plan.id,
          planName: plan.name,
          clientEmail,
          billingPeriod: finalBillingPeriod
        }
      });
      res.json({
        clientSecret: paymentIntent.client_secret,
        planName: plan.name,
        amount,
        billingPeriod: finalBillingPeriod
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });
  app2.post("/api/payments/confirm", async (req, res) => {
    try {
      const { paymentIntentId, clientId } = req.body;
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status === "succeeded") {
        const planId = paymentIntent.metadata.planId;
        if (clientId && planId) {
          await storage.updateClient(clientId, {
            status: "ACTIVE",
            planId
          });
        }
        res.json({ success: true, status: paymentIntent.status });
      } else {
        res.json({ success: false, status: paymentIntent.status });
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });
  app2.get("/api/client/:clientId/stripe-status", requirePermission("stripe.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const isConfigured = await storage.validateStripeConfig(clientId);
      const publicKey = await storage.getStripePublicKey(clientId);
      res.json({
        isConfigured,
        hasValidKeys: isConfigured,
        publicKey
        // Only return public key
        // NEVER expose secret key to frontend
      });
    } catch (error) {
      console.error("Error fetching Stripe status:", error);
      res.status(500).json({ error: "Failed to fetch Stripe status" });
    }
  });
  app2.post("/api/client/:clientId/stripe-config", requirePermission("stripe.edit"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { stripePublicKey, stripeSecretKey } = req.body;
      if (!stripePublicKey?.startsWith("pk_")) {
        return res.status(400).json({ error: "Invalid Stripe public key format" });
      }
      if (!stripeSecretKey?.startsWith("sk_")) {
        return res.status(400).json({ error: "Invalid Stripe secret key format" });
      }
      await storage.updateStripeConfig(clientId, stripePublicKey, stripeSecretKey);
      res.json({
        success: true,
        message: "Stripe configuration saved securely",
        publicKey: stripePublicKey
        // Only return public key in response
      });
    } catch (error) {
      console.error("Error saving Stripe config:", error);
      res.status(500).json({ error: "Failed to save Stripe configuration" });
    }
  });
  app2.get("/api/client/:clientId/payments", requirePermission("payments.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const payments2 = await storage.getPayments(clientId);
      res.json(payments2);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });
  app2.post("/api/client/:clientId/generate-stripe-product", requirePermission("services.edit"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { name, price, description } = req.body;
      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({
          error: "Invalid name: Must be a string with at least 2 characters"
        });
      }
      if (!description || typeof description !== "string" || description.trim().length < 10) {
        return res.status(400).json({
          error: "Invalid description: Must be a string with at least 10 characters"
        });
      }
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return res.status(400).json({
          error: "Invalid price: Must be a positive number"
        });
      }
      const numericPrice = parseFloat(price);
      if (numericPrice > 99999.99) {
        return res.status(400).json({
          error: "Price too high: Maximum allowed is $99,999.99"
        });
      }
      if (numericPrice < 0.5) {
        return res.status(400).json({
          error: "Price too low: Minimum allowed is $0.50"
        });
      }
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      const isConfigured = await storage.validateStripeConfig(clientId);
      if (!isConfigured) {
        return res.status(400).json({
          error: "Stripe not configured for this client",
          details: "Please configure your Stripe keys in payment settings first"
        });
      }
      const stripeSecretKey = await storage.getStripeSecretKey(clientId);
      if (!stripeSecretKey) {
        return res.status(400).json({
          error: "Stripe secret key not found",
          details: "Missing Stripe secret key configuration"
        });
      }
      if (!stripeSecretKey.startsWith("sk_")) {
        return res.status(400).json({
          error: "Invalid Stripe secret key format",
          details: "Stripe secret key must start with 'sk_'"
        });
      }
      const clientStripe = new Stripe(stripeSecretKey);
      const product = await clientStripe.products.create({
        name: name.trim(),
        description: description.trim(),
        type: "service",
        metadata: {
          client_id: clientId,
          created_via: "saas_platform_auto_generation"
        }
      });
      const stripePrice = await clientStripe.prices.create({
        product: product.id,
        unit_amount: Math.round(numericPrice * 100),
        // Ensure proper cents conversion
        currency: "usd",
        metadata: {
          client_id: clientId,
          original_price: numericPrice.toString()
        }
      });
      res.json({
        success: true,
        productId: product.id,
        priceId: stripePrice.id,
        message: `Stripe product "${name.trim()}" created successfully`,
        details: {
          price_in_cents: Math.round(numericPrice * 100),
          price_formatted: `$${numericPrice.toFixed(2)}`
        }
      });
    } catch (error) {
      console.error("Error generating Stripe product:", error);
      if (error.type === "StripeCardError" || error.type === "StripeInvalidRequestError") {
        return res.status(400).json({
          error: "Stripe API error",
          details: error.message
        });
      }
      if (error.type === "StripeAuthenticationError") {
        return res.status(401).json({
          error: "Invalid Stripe credentials",
          details: "Please check your Stripe secret key configuration"
        });
      }
      res.status(500).json({
        error: "Failed to generate Stripe product",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/bookings/payment-intent", async (req, res) => {
    try {
      const { clientId, serviceId, tipPercentage, customerEmail, customerName } = req.body;
      const baseAmount = await storage.calculateServiceAmount(clientId, serviceId);
      const totalAmount = await storage.calculateTotalWithTip(baseAmount, tipPercentage);
      const isConfigured = await storage.validateStripeConfig(clientId);
      if (!isConfigured) {
        return res.status(400).json({ error: "Stripe not configured for this business" });
      }
      let stripeInstance = null;
      const client = await storage.getClient(clientId);
      if (client?.stripeSecretKey) {
        try {
          stripeInstance = new Stripe(client.stripeSecretKey);
          await stripeInstance.balance.retrieve();
        } catch (error) {
          console.warn(`Client Stripe key failed (${error.message}), falling back to global config`);
          stripeInstance = null;
          await storage.clearStripeConfig(clientId);
        }
      }
      if (!stripeInstance && process.env.STRIPE_SECRET_KEY) {
        try {
          stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
          await stripeInstance.balance.retrieve();
        } catch (error) {
          console.error(`Global Stripe key also failed: ${error.message}`);
          return res.status(500).json({ error: "No valid Stripe configuration available" });
        }
      }
      if (!stripeInstance) {
        return res.status(500).json({ error: "No Stripe configuration found" });
      }
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        // Convert to cents
        currency: "usd",
        metadata: {
          clientId,
          serviceId,
          baseAmount: baseAmount.toString(),
          tipPercentage: tipPercentage?.toString() || "0",
          customerEmail,
          customerName
        }
      });
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: totalAmount,
        baseAmount,
        tipAmount: totalAmount - baseAmount,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });
  app2.post("/api/bookings/confirm", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }
      const {
        paymentIntentId,
        customerName,
        customerEmail,
        customerPhone,
        appointmentDate,
        startTime,
        endTime,
        notes
      } = req.body;
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ error: "Payment not successful" });
      }
      const { clientId, serviceId, baseAmount } = paymentIntent.metadata;
      const totalAmount = paymentIntent.amount / 100;
      const appointment = await storage.createAppointment({
        clientId,
        customerName,
        customerEmail,
        customerPhone,
        serviceId,
        appointmentDate: new Date(appointmentDate),
        startTime,
        endTime,
        notes,
        totalPrice: totalAmount,
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        paymentIntentId,
        status: "CONFIRMED"
      });
      const payment = await storage.createPayment({
        clientId,
        appointmentId: appointment.id,
        paymentMethod: "STRIPE",
        paymentProvider: "stripe",
        paymentIntentId,
        amount: totalAmount,
        currency: "USD",
        status: "COMPLETED",
        customerName,
        customerEmail,
        description: `Service payment - ${customerName}`,
        processingFee: totalAmount * 0.029 + 0.3,
        // 2.9% + $0.30
        netAmount: totalAmount - (totalAmount * 0.029 + 0.3),
        paidAt: /* @__PURE__ */ new Date()
      });
      res.json({
        success: true,
        appointment,
        payment,
        message: "Booking confirmed and payment processed"
      });
    } catch (error) {
      console.error("Error confirming booking payment:", error);
      res.status(500).json({ error: "Failed to confirm booking payment" });
    }
  });
  app2.get("/api/client/:clientId/subscription", requirePermission("subscription.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      const plan = await storage.getPlan(client.planId);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      const subscription = {
        id: `sub_${clientId}`,
        planId: plan.id,
        planName: plan.name,
        planPrice: plan.monthlyPrice || 0,
        billing: "monthly",
        // Default billing period
        status: client.status,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
        // 30 days from now
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
        features: plan.features,
        maxUsers: plan.maxUsers,
        storageGB: plan.storageGB,
        stripeSubscriptionId: client.stripeSubscriptionId,
        trialEndsAt: client.status === "TRIAL" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3).toISOString() : null,
        cancelAtPeriodEnd: false
      };
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription details" });
    }
  });
  app2.post("/api/client/:clientId/subscription/update-plan", requirePermission("subscription.edit"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }
      const newPlan = await storage.getPlan(planId);
      if (!newPlan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      await storage.updateClient(clientId, {
        planId: newPlan.id,
        status: "ACTIVE"
        // Activate the new plan
      });
      if (stripe && client.stripeSubscriptionId && newPlan.monthlyStripePriceId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(client.stripeSubscriptionId);
          const subscriptionItemId = subscription.items.data[0]?.id;
          if (subscriptionItemId) {
            await stripe.subscriptions.update(client.stripeSubscriptionId, {
              items: [{
                id: subscriptionItemId,
                price: newPlan.monthlyStripePriceId
              }],
              proration_behavior: "always_invoice"
            });
            console.log(`Stripe subscription updated: ${client.stripeSubscriptionId} -> ${newPlan.monthlyStripePriceId}`);
          }
        } catch (stripeError) {
          console.error("Stripe subscription update error:", stripeError);
        }
      }
      res.json({
        success: true,
        message: "Subscription plan updated successfully",
        newPlan: {
          id: newPlan.id,
          name: newPlan.name,
          price: newPlan.monthlyPrice || 0
        }
      });
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ error: "Failed to update subscription plan" });
    }
  });
  app2.post("/api/client/:clientId/subscription/cancel", requirePermission("subscription.edit"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      await storage.updateClient(clientId, {
        status: "CANCELLED"
      });
      if (stripe && client.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.update(client.stripeSubscriptionId, {
            cancel_at_period_end: true
          });
        } catch (stripeError) {
          console.error("Stripe subscription cancellation error:", stripeError);
        }
      }
      res.json({
        success: true,
        message: "Subscription cancelled successfully. You'll retain access until the end of your billing period."
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });
  app2.get("/api/client/:clientId/payment-methods", requirePermission("payments.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      const paymentMethods = [
        {
          id: "pm_1234567890",
          brand: "visa",
          last4: "4242",
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true
        }
      ];
      if (stripe && client.stripeCustomerId) {
        try {
          const stripePaymentMethods = await stripe.paymentMethods.list({
            customer: client.stripeCustomerId,
            type: "card"
          });
          const formattedMethods = stripePaymentMethods.data.map((pm) => ({
            id: pm.id,
            brand: pm.card?.brand || "unknown",
            last4: pm.card?.last4 || "0000",
            expiryMonth: pm.card?.exp_month || 1,
            expiryYear: pm.card?.exp_year || 2025,
            isDefault: false
            // Would need to check default payment method
          }));
          return res.json(formattedMethods);
        } catch (stripeError) {
          console.error("Stripe payment methods error:", stripeError);
        }
      }
      res.json(paymentMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });
  app2.post("/api/client/:clientId/subscription/update-payment", requirePermission("payments.edit"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { paymentMethodId, setAsDefault } = req.body;
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      if (stripe && client.stripeCustomerId && paymentMethodId) {
        try {
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: client.stripeCustomerId
          });
          if (setAsDefault) {
            await stripe.customers.update(client.stripeCustomerId, {
              invoice_settings: {
                default_payment_method: paymentMethodId
              }
            });
          }
        } catch (stripeError) {
          console.error("Stripe payment method update error:", stripeError);
          return res.status(400).json({ error: "Failed to update payment method with Stripe" });
        }
      }
      res.json({
        success: true,
        message: "Payment method updated successfully"
      });
    } catch (error) {
      console.error("Error updating payment method:", error);
      res.status(500).json({ error: "Failed to update payment method" });
    }
  });
  app2.get("/api/client/:clientId/billing-history", requirePermission("payments.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      const billingHistory = [
        {
          id: "inv_1234567890",
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString(),
          // 30 days ago
          amount: 79,
          status: "PAID",
          description: "Professional Plan - Monthly",
          invoiceUrl: "https://invoice.stripe.com/example"
        },
        {
          id: "inv_0987654321",
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1e3).toISOString(),
          // 60 days ago
          amount: 79,
          status: "PAID",
          description: "Professional Plan - Monthly",
          invoiceUrl: "https://invoice.stripe.com/example2"
        }
      ];
      if (stripe && client.stripeCustomerId) {
        try {
          const invoices = await stripe.invoices.list({
            customer: client.stripeCustomerId,
            limit: 20
          });
          const formattedHistory = invoices.data.map((invoice) => ({
            id: invoice.id,
            date: new Date(invoice.created * 1e3).toISOString(),
            amount: invoice.amount_paid / 100,
            // Convert from cents
            status: invoice.status === "paid" ? "PAID" : invoice.status?.toUpperCase() || "UNKNOWN",
            description: invoice.description || "Subscription Payment",
            invoiceUrl: invoice.hosted_invoice_url
          }));
          return res.json(formattedHistory);
        } catch (stripeError) {
          console.error("Stripe invoices error:", stripeError);
        }
      }
      res.json(billingHistory);
    } catch (error) {
      console.error("Error fetching billing history:", error);
      res.status(500).json({ error: "Failed to fetch billing history" });
    }
  });
  app2.post("/api/client/:clientId/setup-intent", requirePermission("payments.edit"), async (req, res) => {
    try {
      const { clientId } = req.params;
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      let customerId = client.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: client.email,
          name: client.contactPerson,
          metadata: {
            clientId: client.id,
            businessName: client.businessName
          }
        });
        customerId = customer.id;
        await storage.updateClient(clientId, { stripeCustomerId: customerId });
      }
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ["card"],
        usage: "off_session",
        // For future payments
        metadata: {
          clientId: client.id
        }
      });
      res.json({
        success: true,
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
        message: "SetupIntent created successfully for secure payment method update"
      });
    } catch (error) {
      console.error("Error creating SetupIntent:", error);
      res.status(500).json({ error: "Failed to create secure payment setup" });
    }
  });
  app2.post("/api/client/:clientId/confirm-setup-intent", requirePermission("payments.edit"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { setupIntentId, setAsDefault } = req.body;
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      if (setupIntent.status !== "succeeded") {
        return res.status(400).json({ error: "SetupIntent not completed successfully" });
      }
      const paymentMethodId = setupIntent.payment_method;
      if (setAsDefault && client.stripeCustomerId) {
        await stripe.customers.update(client.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
      }
      res.json({
        success: true,
        message: "Payment method saved successfully",
        paymentMethodId
      });
    } catch (error) {
      console.error("Error confirming SetupIntent:", error);
      res.status(500).json({ error: "Failed to confirm payment method setup" });
    }
  });
  app2.post("/api/client/:clientId/payment-methods/:paymentMethodId/set-default", requirePermission("payments.edit"), async (req, res) => {
    try {
      const { clientId, paymentMethodId } = req.params;
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      if (!client.stripeCustomerId) {
        return res.status(400).json({ error: "Client has no Stripe customer ID" });
      }
      await stripe.customers.update(client.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      res.json({
        success: true,
        message: "Default payment method updated successfully"
      });
    } catch (error) {
      console.error("Error setting default payment method:", error);
      res.status(500).json({ error: "Failed to set default payment method" });
    }
  });
  app2.delete("/api/client/:clientId/payment-methods/:paymentMethodId", requirePermission("payments.edit"), async (req, res) => {
    try {
      const { clientId, paymentMethodId } = req.params;
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      await stripe.paymentMethods.detach(paymentMethodId);
      res.json({
        success: true,
        message: "Payment method removed successfully"
      });
    } catch (error) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ error: "Failed to delete payment method" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const passwordMatch = await bcrypt2.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        message: "Login successful"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.post("/api/auth/client-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== "CLIENT") {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const passwordMatch = await bcrypt2.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const client = await storage.getClientByEmail(email);
      if (!client) {
        return res.status(404).json({ error: "Client profile not found" });
      }
      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        client,
        message: "Client login successful"
      });
    } catch (error) {
      console.error("Client login error:", error);
      res.status(500).json({ error: "Client login failed" });
    }
  });
  app2.get("/api/plans", async (req, res) => {
    try {
      const plans2 = await storage.getPlans();
      res.json(plans2);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });
  app2.post("/api/plans", async (req, res) => {
    try {
      const planData = insertPlanSchema.parse(req.body);
      const plan = await storage.createPlan(planData);
      res.json(plan);
    } catch (error) {
      console.error("Error creating plan:", error);
      res.status(500).json({ error: "Failed to create plan" });
    }
  });
  app2.put("/api/plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const plan = await storage.updatePlan(id, updates);
      res.json(plan);
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ error: "Failed to update plan" });
    }
  });
  app2.delete("/api/plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePlan(id);
      res.json({ message: "Plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ error: "Failed to delete plan" });
    }
  });
  app2.put("/api/plans/:id/pricing", async (req, res) => {
    try {
      const updates = req.body;
      const plan = await storage.updatePlanPricing(req.params.id, updates);
      res.json(plan);
    } catch (error) {
      console.error("Error updating plan pricing:", error);
      res.status(500).json({ error: "Failed to update plan pricing" });
    }
  });
  app2.post("/api/plans/:id/sync", async (req, res) => {
    try {
      await storage.syncClientPlans(req.params.id);
      res.json({ success: true, message: "Plan synchronized with all clients" });
    } catch (error) {
      console.error("Error syncing plan:", error);
      res.status(500).json({ error: "Failed to sync plan" });
    }
  });
  app2.put("/api/clients/:clientId/plan", async (req, res) => {
    try {
      const { planId } = req.body;
      const client = await storage.updateClientPlan(req.params.clientId, planId);
      res.json(client);
    } catch (error) {
      console.error("Error updating client plan:", error);
      res.status(500).json({ error: "Failed to update client plan" });
    }
  });
  app2.get("/api/contact-messages", async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      res.status(500).json({ error: "Failed to fetch contact messages" });
    }
  });
  app2.post("/api/contact", createRateLimitMiddleware(contactFormLimiter), async (req, res) => {
    try {
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);
      console.log("\u{1F4E7} New contact form submission:", {
        id: message.id,
        name: message.name,
        email: message.email,
        subject: message.subject
      });
      res.json({
        message: "Contact form submitted successfully",
        id: message.id
      });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ error: "Failed to submit contact form" });
    }
  });
  app2.post("/api/contact_messages", createRateLimitMiddleware(contactFormLimiter), async (req, res) => {
    try {
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);
      console.log("\u{1F4E7} New contact form submission:", {
        id: message.id,
        name: message.name,
        email: message.email,
        subject: message.subject
      });
      res.json({
        message: "Contact form submitted successfully",
        id: message.id
      });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ error: "Failed to submit contact form" });
    }
  });
  app2.get("/api/contact_messages", async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      res.status(500).json({ error: "Failed to fetch contact messages" });
    }
  });
  app2.put("/api/contact-messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const message = await storage.updateContactMessage(id, updates);
      res.json(message);
    } catch (error) {
      console.error("Error updating contact message:", error);
      res.status(500).json({ error: "Failed to update contact message" });
    }
  });
  app2.delete("/api/contact-messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteContactMessage(id);
      res.json({ message: "Contact message deleted successfully" });
    } catch (error) {
      console.error("Error deleting contact message:", error);
      res.status(500).json({ error: "Failed to delete contact message" });
    }
  });
  app2.get("/api/review-platforms", async (req, res) => {
    try {
      const platforms = await storage.getReviewPlatforms();
      res.json(platforms);
    } catch (error) {
      console.error("Error fetching review platforms:", error);
      res.status(500).json({ error: "Failed to fetch review platforms" });
    }
  });
  app2.post("/api/review-platforms", async (req, res) => {
    try {
      const platformData = insertReviewPlatformSchema.parse(req.body);
      const platform = await storage.createReviewPlatform(platformData);
      res.json(platform);
    } catch (error) {
      console.error("Error creating review platform:", error);
      res.status(500).json({ error: "Failed to create review platform" });
    }
  });
  app2.put("/api/review-platforms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const platform = await storage.updateReviewPlatform(id, updates);
      res.json(platform);
    } catch (error) {
      console.error("Error updating review platform:", error);
      res.status(500).json({ error: "Failed to update review platform" });
    }
  });
  app2.delete("/api/review-platforms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReviewPlatform(id);
      res.json({ message: "Review platform deleted successfully" });
    } catch (error) {
      console.error("Error deleting review platform:", error);
      res.status(500).json({ error: "Failed to delete review platform" });
    }
  });
  app2.get("/api/clients/:clientId/review-connections", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const connections = await storage.getReviewPlatformConnections(clientId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching review platform connections:", error);
      res.status(500).json({ error: "Failed to fetch review platform connections" });
    }
  });
  app2.post("/api/clients/:clientId/review-connections", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const connectionData = insertReviewPlatformConnectionSchema.parse({
        ...req.body,
        clientId
      });
      const connection = await storage.createReviewPlatformConnection(connectionData);
      res.json(connection);
    } catch (error) {
      console.error("Error creating review platform connection:", error);
      res.status(500).json({ error: "Failed to create review platform connection" });
    }
  });
  app2.put("/api/clients/:clientId/review-connections/:id", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const connection = await storage.updateReviewPlatformConnection(id, updates);
      res.json(connection);
    } catch (error) {
      console.error("Error updating review platform connection:", error);
      res.status(500).json({ error: "Failed to update review platform connection" });
    }
  });
  app2.delete("/api/clients/:clientId/review-connections/:id", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReviewPlatformConnection(id);
      res.json({ message: "Review platform connection deleted successfully" });
    } catch (error) {
      console.error("Error deleting review platform connection:", error);
      res.status(500).json({ error: "Failed to delete review platform connection" });
    }
  });
  app2.post("/api/clients/:clientId/review-connections/:id/sync", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { id } = req.params;
      const connection = await storage.syncReviewPlatformData(id);
      res.json(connection);
    } catch (error) {
      console.error("Error syncing review platform data:", error);
      res.status(500).json({ error: "Failed to sync review platform data" });
    }
  });
  app2.get("/api/clients/:clientId/platform-reviews", requirePermission("VIEW_REVIEWS"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { platform } = req.query;
      const reviews3 = await storage.getPlatformReviews(clientId, platform);
      res.json(reviews3);
    } catch (error) {
      console.error("Error fetching platform reviews:", error);
      res.status(500).json({ error: "Failed to fetch platform reviews" });
    }
  });
  app2.post("/api/clients/:clientId/platform-reviews", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const reviewData = insertPlatformReviewSchema.parse({
        ...req.body,
        clientId
      });
      const review = await storage.createPlatformReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Error creating platform review:", error);
      res.status(500).json({ error: "Failed to create platform review" });
    }
  });
  app2.put("/api/clients/:clientId/platform-reviews/:id", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const review = await storage.updatePlatformReview(id, updates);
      res.json(review);
    } catch (error) {
      console.error("Error updating platform review:", error);
      res.status(500).json({ error: "Failed to update platform review" });
    }
  });
  app2.delete("/api/clients/:clientId/platform-reviews/:id", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePlatformReview(id);
      res.json({ message: "Platform review deleted successfully" });
    } catch (error) {
      console.error("Error deleting platform review:", error);
      res.status(500).json({ error: "Failed to delete platform review" });
    }
  });
  app2.get("/api/admin/platform-reviews", requireAdmin, async (req, res) => {
    try {
      const { platform, clientId } = req.query;
      if (clientId) {
        const reviews3 = await storage.getPlatformReviews(clientId, platform);
        res.json(reviews3);
      } else {
        const clients2 = await storage.getClients();
        const allReviews = [];
        for (const client of clients2) {
          const clientReviews = await storage.getPlatformReviews(client.id, platform);
          allReviews.push(...clientReviews);
        }
        res.json(allReviews);
      }
    } catch (error) {
      console.error("Error fetching admin platform reviews:", error);
      res.status(500).json({ error: "Failed to fetch platform reviews" });
    }
  });
  app2.get("/api/admin/review-analytics", requireAdmin, async (req, res) => {
    try {
      const clients2 = await storage.getClients();
      const analytics = [];
      for (const client of clients2) {
        const connections = await storage.getReviewPlatformConnections(client.id);
        const reviews3 = await storage.getPlatformReviews(client.id);
        const clientAnalytics = {
          clientId: client.id,
          clientName: client.businessName,
          totalConnections: connections.length,
          activeConnections: connections.filter((c) => c.isActive).length,
          totalReviews: reviews3.length,
          averageRating: reviews3.length > 0 ? reviews3.reduce((sum, review) => sum + review.rating, 0) / reviews3.length : 0,
          platforms: connections.map((conn) => ({
            platform: conn.platform,
            isActive: conn.isActive,
            averageRating: conn.averageRating,
            totalReviews: conn.totalReviews,
            lastSyncAt: conn.lastSyncAt
          }))
        };
        analytics.push(clientAnalytics);
      }
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching review analytics:", error);
      res.status(500).json({ error: "Failed to fetch review analytics" });
    }
  });
  app2.get("/api/clients", async (req, res) => {
    try {
      const clients2 = await storage.getClients();
      const enhancedClients = await Promise.all(
        clients2.map(async (client) => {
          const plan = await storage.getPlan(client.planId);
          return {
            ...client,
            plan: plan ? plan.name : "Unknown",
            planPrice: plan ? plan.monthlyPrice || 0 : 0,
            monthlyRevenue: plan ? plan.monthlyPrice || 0 : 0
          };
        })
      );
      res.json(enhancedClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });
  app2.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ error: "Failed to create client" });
    }
  });
  app2.put("/api/clients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const client = await storage.updateClient(id, updates);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ error: "Failed to update client" });
    }
  });
  app2.delete("/api/clients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClient(id);
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ error: "Failed to delete client" });
    }
  });
  app2.get("/api/analytics/revenue", async (req, res) => {
    try {
      const clients2 = await storage.getClients();
      const plans2 = await storage.getPlans();
      let totalMRR = 0;
      const planDistribution = {};
      for (const client of clients2) {
        const plan = plans2.find((p) => p.id === client.planId);
        if (plan && client.status === "ACTIVE") {
          totalMRR += plan.monthlyPrice || 0;
          planDistribution[plan.name] = (planDistribution[plan.name] || 0) + 1;
        }
      }
      const now = /* @__PURE__ */ new Date();
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyData.push({
          month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          revenue: totalMRR * (0.8 + Math.random() * 0.4),
          // Simulate growth
          clients: Math.floor(clients2.length * (0.7 + i * 0.05))
        });
      }
      res.json({
        totalMRR,
        totalClients: clients2.length,
        activeClients: clients2.filter((c) => c.status === "ACTIVE").length,
        averageRevenuePerClient: clients2.length > 0 ? totalMRR / clients2.length : 0,
        planDistribution,
        monthlyData,
        churnRate: 2.5
        // Sample churn rate
      });
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
  app2.get("/api/analytics/clients", async (req, res) => {
    try {
      const clients2 = await storage.getClients();
      const statusDistribution = clients2.reduce((acc, client) => {
        acc[client.status] = (acc[client.status] || 0) + 1;
        return acc;
      }, {});
      const industryDistribution = clients2.reduce((acc, client) => {
        const industry = client.industry || "Other";
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {});
      res.json({
        statusDistribution,
        industryDistribution,
        totalClients: clients2.length,
        newClientsThisMonth: Math.floor(clients2.length * 0.2)
        // Sample data
      });
    } catch (error) {
      console.error("Error fetching client analytics:", error);
      res.status(500).json({ error: "Failed to fetch client analytics" });
    }
  });
  app2.get("/api/onboarding/sessions", async (req, res) => {
    try {
      const sessions = await storage.getOnboardingSessions();
      const enhancedSessions = await Promise.all(
        sessions.map(async (session) => {
          const plan = await storage.getPlan(session.planId);
          return {
            ...session,
            planName: plan ? plan.name : "Unknown",
            businessData: session.businessData ? JSON.parse(session.businessData) : null
          };
        })
      );
      res.json(enhancedSessions);
    } catch (error) {
      console.error("Error fetching onboarding sessions:", error);
      res.status(500).json({ error: "Failed to fetch onboarding sessions" });
    }
  });
  app2.get("/api/onboarding/analytics", async (req, res) => {
    try {
      const sessions = await storage.getOnboardingSessions();
      const completionRate = sessions.length > 0 ? sessions.filter((s) => s.isCompleted).length / sessions.length * 100 : 0;
      const stepAnalysis = {
        step1: sessions.filter((s) => (s.currentStep || 1) >= 1).length,
        step2: sessions.filter((s) => (s.currentStep || 1) >= 2).length,
        step3: sessions.filter((s) => (s.currentStep || 1) >= 3).length,
        step4: sessions.filter((s) => (s.currentStep || 1) >= 4).length,
        step5: sessions.filter((s) => (s.currentStep || 1) >= 5).length,
        step6: sessions.filter((s) => (s.currentStep || 1) >= 6).length,
        completed: sessions.filter((s) => s.isCompleted).length
      };
      res.json({
        totalSessions: sessions.length,
        completionRate: Math.round(completionRate),
        averageCompletionTime: "12 minutes",
        // Sample data
        dropOffPoints: [
          { step: "Step 2: Business Info", dropoff: "15%" },
          { step: "Step 4: Payment", dropoff: "35%" },
          { step: "Step 5: Setup", dropoff: "8%" }
        ],
        stepAnalysis
      });
    } catch (error) {
      console.error("Error fetching onboarding analytics:", error);
      res.status(500).json({ error: "Failed to fetch onboarding analytics" });
    }
  });
  app2.get("/api/public/plans", async (req, res) => {
    try {
      const plans2 = await storage.getPlans();
      res.json(plans2);
    } catch (error) {
      console.error("Error fetching public plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });
  app2.post("/api/onboarding/start", async (req, res) => {
    try {
      const { planId } = req.body;
      const sessionId = uuidv4();
      const session = await storage.createOnboardingSession({
        sessionId,
        planId,
        currentStep: 1,
        businessData: null
      });
      res.json({ sessionId: session.sessionId, session });
    } catch (error) {
      console.error("Error starting onboarding:", error);
      res.status(500).json({ error: "Failed to start onboarding" });
    }
  });
  app2.get("/api/onboarding/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getOnboardingSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Onboarding session not found" });
      }
      const plan = await storage.getPlan(session.planId);
      res.json({
        ...session,
        plan,
        businessData: session.businessData ? JSON.parse(session.businessData) : null
      });
    } catch (error) {
      console.error("Error fetching onboarding session:", error);
      res.status(500).json({ error: "Failed to fetch onboarding session" });
    }
  });
  app2.put("/api/onboarding/:sessionId/step/:stepNumber", async (req, res) => {
    try {
      const { sessionId, stepNumber } = req.params;
      const stepData = req.body;
      const session = await storage.getOnboardingSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Onboarding session not found" });
      }
      const existingData = session.businessData ? JSON.parse(session.businessData) : {};
      const updatedData = { ...existingData, [`step${stepNumber}`]: stepData };
      const updatedSession = await storage.updateOnboardingSession(sessionId, {
        currentStep: Math.max(parseInt(stepNumber), session.currentStep || 1),
        businessData: JSON.stringify(updatedData)
      });
      res.json(updatedSession);
    } catch (error) {
      console.error("Error saving step data:", error);
      res.status(500).json({ error: "Failed to save step data" });
    }
  });
  app2.post("/api/onboarding/:sessionId/complete", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getOnboardingSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Onboarding session not found" });
      }
      const businessData = session.businessData ? JSON.parse(session.businessData) : {};
      const userEmail = businessData.step3?.adminEmail || businessData.step2?.businessEmail;
      let user = await storage.getUserByEmail(userEmail);
      if (!user) {
        user = await storage.createUser({
          email: userEmail,
          password: businessData.step3?.password,
          role: "CLIENT"
        });
      }
      const client = await storage.createClient({
        businessName: businessData.step2?.businessName,
        contactPerson: businessData.step2?.contactPerson,
        email: businessData.step2?.businessEmail,
        phone: businessData.step2?.phone,
        businessAddress: businessData.step2?.businessAddress,
        industry: businessData.step2?.industry,
        businessDescription: businessData.step5?.businessDescription,
        operatingHours: businessData.step5?.operatingHours ? JSON.stringify(businessData.step5.operatingHours) : null,
        timeZone: businessData.step5?.timeZone,
        planId: session.planId,
        status: "TRIAL",
        userId: user.id,
        onboardingSessionId: session.id
      });
      await storage.completeOnboarding(sessionId);
      res.json({
        message: "Onboarding completed successfully",
        client,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });
  app2.post("/api/payment/process", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(400).json({ error: "Stripe not configured" });
      }
      const { amount, currency = "usd", paymentMethodId, planId } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        // Convert to cents
        currency,
        payment_method: paymentMethodId,
        confirm: true,
        return_url: `${req.headers.origin}/payment-success`
      });
      res.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status
        }
      });
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ error: "Payment processing failed" });
    }
  });
  app2.get("/api/client/:clientId/dashboard", async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      const services2 = await storage.getClientServices(clientId);
      const appointments2 = await storage.getAppointments(clientId);
      const leads2 = await storage.getLeads(clientId);
      const operatingHours3 = await storage.getOperatingHours(clientId);
      const website = await storage.getClientWebsite(clientId);
      const thisMonth = /* @__PURE__ */ new Date();
      const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
      const thisMonthAppointments = appointments2.filter(
        (a) => a.appointmentDate && new Date(a.appointmentDate) >= startOfMonth
      );
      const thisMonthRevenue = thisMonthAppointments.reduce((sum, a) => sum + a.totalPrice, 0);
      const newLeadsThisMonth = leads2.filter(
        (l) => l.createdAt && new Date(l.createdAt) >= startOfMonth
      );
      res.json({
        client,
        services: services2,
        appointments: appointments2.slice(-10),
        // Recent 10 appointments
        leads: leads2.slice(-10),
        // Recent 10 leads
        operatingHours: operatingHours3,
        website,
        metrics: {
          totalAppointments: appointments2.length,
          thisMonthAppointments: thisMonthAppointments.length,
          thisMonthRevenue,
          totalLeads: leads2.length,
          newLeadsThisMonth: newLeadsThisMonth.length,
          conversionRate: leads2.length > 0 ? leads2.filter((l) => l.convertedToAppointment).length / leads2.length * 100 : 0
        }
      });
    } catch (error) {
      console.error("Error fetching client dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
  app2.get("/api/client/:clientId/services", requirePermission("services.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const services2 = await storage.getClientServices(clientId);
      res.json(services2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client services" });
    }
  });
  app2.post("/api/client/:clientId/services", requirePermission("services.create"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { enableOnlinePayments, stripeProductId, stripePriceId, ...serviceData } = req.body;
      const parsedServiceData = { ...insertClientServiceSchema.parse(serviceData), clientId };
      const service = await storage.createClientService(parsedServiceData);
      if (enableOnlinePayments) {
        const client = await storage.getClient(clientId);
        if (client?.stripeSecretKey) {
          try {
            const clientStripe = new Stripe(client.stripeSecretKey);
            const product = await clientStripe.products.create({
              name: serviceData.name,
              description: serviceData.description || `${serviceData.name} service`,
              metadata: {
                clientId,
                serviceId: service.id
              }
            });
            const price = await clientStripe.prices.create({
              product: product.id,
              unit_amount: Math.round(parseFloat(serviceData.price) * 100),
              // Convert to cents
              currency: "usd",
              metadata: {
                clientId,
                serviceId: service.id
              }
            });
            await storage.updateClientService(service.id, {
              stripeProductId: product.id,
              stripePriceId: price.id,
              enableOnlinePayments: true
            });
            res.json({
              ...service,
              stripeProductId: product.id,
              stripePriceId: price.id,
              enableOnlinePayments: true
            });
          } catch (stripeError) {
            console.error("Stripe product creation failed:", stripeError);
            res.json({
              ...service,
              enableOnlinePayments: false,
              warning: "Service created but Stripe integration failed"
            });
          }
        } else {
          res.json({
            ...service,
            enableOnlinePayments: false,
            warning: "Stripe not configured for online payments"
          });
        }
      } else {
        res.json(service);
      }
    } catch (error) {
      console.error("Service creation error:", error);
      res.status(500).json({ error: "Failed to create service" });
    }
  });
  app2.put("/api/client/:clientId/services/:serviceId", requirePermission("services.edit"), async (req, res) => {
    try {
      const { clientId, serviceId } = req.params;
      const { enableOnlinePayments, stripeProductId, stripePriceId, ...updates } = req.body;
      const service = await storage.updateClientService(serviceId, updates);
      if (enableOnlinePayments !== void 0) {
        const client = await storage.getClient(clientId);
        if (enableOnlinePayments && client?.stripeSecretKey) {
          try {
            const clientStripe = new Stripe(client.stripeSecretKey);
            let productId = stripeProductId;
            let priceId = stripePriceId;
            if (!productId) {
              const product = await clientStripe.products.create({
                name: updates.name || service.name,
                description: updates.description || service.description || `${service.name} service`,
                metadata: {
                  clientId,
                  serviceId: service.id
                }
              });
              productId = product.id;
            } else {
              await clientStripe.products.update(productId, {
                name: updates.name || service.name,
                description: updates.description || service.description
              });
            }
            if (!priceId || updates.price) {
              const price = await clientStripe.prices.create({
                product: productId,
                unit_amount: Math.round(parseFloat(updates.price || service.price) * 100),
                currency: "usd",
                metadata: {
                  clientId,
                  serviceId: service.id
                }
              });
              priceId = price.id;
              if (stripePriceId && stripePriceId !== priceId) {
                try {
                  await clientStripe.prices.update(stripePriceId, { active: false });
                } catch (e) {
                  console.warn("Failed to deactivate old price:", e.message);
                }
              }
            }
            await storage.updateClientService(serviceId, {
              stripeProductId: productId,
              stripePriceId: priceId,
              enableOnlinePayments: true
            });
            res.json({
              ...service,
              stripeProductId: productId,
              stripePriceId: priceId,
              enableOnlinePayments: true
            });
          } catch (stripeError) {
            console.error("Stripe update failed:", stripeError);
            res.json({
              ...service,
              enableOnlinePayments: false,
              warning: "Service updated but Stripe integration failed"
            });
          }
        } else {
          await storage.updateClientService(serviceId, {
            enableOnlinePayments: false
          });
          res.json({
            ...service,
            enableOnlinePayments: false
          });
        }
      } else {
        res.json(service);
      }
    } catch (error) {
      console.error("Service update error:", error);
      res.status(500).json({ error: "Failed to update service" });
    }
  });
  app2.delete("/api/client/:clientId/services/:serviceId", requirePermission("services.delete"), async (req, res) => {
    try {
      const { serviceId } = req.params;
      await storage.deleteClientService(serviceId);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service" });
    }
  });
  app2.get("/api/client/:clientId/stripe-config", requirePermission("payments.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      const config = {
        stripePublicKey: client.stripePublicKey || "",
        stripeSecretKey: client.stripeSecretKey ? client.stripeSecretKey.substring(0, 8) + "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
        stripeAccountId: client.stripeAccountId || "",
        isConnected: !!(client.stripePublicKey && client.stripeSecretKey)
      };
      res.json(config);
    } catch (error) {
      console.error("Error fetching Stripe config:", error);
      res.status(500).json({ error: "Failed to fetch Stripe configuration" });
    }
  });
  app2.put("/api/client/:clientId/stripe-config", requirePermission("payments.manage"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { stripePublicKey, stripeSecretKey } = req.body;
      if (!stripePublicKey || !stripeSecretKey) {
        return res.status(400).json({ error: "Both public and secret keys are required" });
      }
      if (!stripePublicKey.startsWith("pk_")) {
        return res.status(400).json({ error: "Invalid public key format" });
      }
      if (!stripeSecretKey.startsWith("sk_")) {
        return res.status(400).json({ error: "Invalid secret key format" });
      }
      const updatedClient = await storage.updateClient(clientId, {
        stripePublicKey,
        stripeSecretKey
        // In production, encrypt this before storing
      });
      res.json({
        message: "Stripe configuration updated successfully",
        isConnected: true
      });
    } catch (error) {
      console.error("Error updating Stripe config:", error);
      res.status(500).json({ error: "Failed to update Stripe configuration" });
    }
  });
  app2.post("/api/client/:clientId/stripe-test", requirePermission("payments.manage"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClient(clientId);
      if (!client || !client.stripeSecretKey) {
        return res.status(400).json({ error: "Stripe not configured for this client" });
      }
      const clientStripe = new Stripe(client.stripeSecretKey);
      const account = await clientStripe.accounts.retrieve();
      res.json({
        success: true,
        accountName: account.business_profile?.name || account.email || "Account verified",
        accountId: account.id
      });
    } catch (error) {
      console.error("Stripe connection test failed:", error);
      res.status(400).json({
        error: "Failed to connect to Stripe",
        details: error.message
      });
    }
  });
  app2.get("/api/client/:clientId/smtp-config", requirePermission("settings.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const config = await storage.getSmtpConfig(clientId);
      const sanitizedConfig = {
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUsername: config.smtpUsername,
        smtpFromEmail: config.smtpFromEmail,
        smtpFromName: config.smtpFromName,
        smtpSecure: config.smtpSecure,
        smtpEnabled: config.smtpEnabled,
        isConfigured: !!(config.smtpHost && config.smtpPort && config.smtpUsername && config.smtpPassword && config.smtpFromEmail)
      };
      res.json(sanitizedConfig);
    } catch (error) {
      console.error("Get SMTP config error:", error);
      res.status(500).json({ error: "Failed to get SMTP configuration" });
    }
  });
  app2.put("/api/client/:clientId/smtp-config", requirePermission("settings.manage"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { smtpHost, smtpPort, smtpUsername, smtpPassword, smtpFromEmail, smtpFromName, smtpSecure, smtpEnabled } = req.body;
      if (smtpEnabled) {
        if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword || !smtpFromEmail) {
          return res.status(400).json({ error: "All SMTP fields are required when enabled" });
        }
        if (smtpPort < 1 || smtpPort > 65535) {
          return res.status(400).json({ error: "SMTP port must be between 1 and 65535" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(smtpFromEmail)) {
          return res.status(400).json({ error: "Invalid from email address" });
        }
      }
      console.log("SMTP config update data:", { smtpHost, smtpPort, smtpUsername, smtpPassword: "***", smtpFromEmail, smtpFromName, smtpSecure, smtpEnabled });
      await storage.updateSmtpConfig(clientId, {
        smtpHost: smtpHost || void 0,
        smtpPort: smtpPort ? parseInt(smtpPort) : void 0,
        smtpUsername: smtpUsername || void 0,
        smtpPassword: smtpPassword || void 0,
        // In production, encrypt this
        smtpFromEmail: smtpFromEmail || void 0,
        smtpFromName: smtpFromName || void 0,
        smtpSecure: smtpSecure !== void 0 ? smtpSecure : true,
        smtpEnabled: smtpEnabled !== void 0 ? smtpEnabled : false
      });
      res.json({ message: "SMTP configuration updated successfully" });
    } catch (error) {
      console.error("Update SMTP config error:", error);
      res.status(500).json({ error: "Failed to update SMTP configuration" });
    }
  });
  app2.post("/api/client/:clientId/smtp-test", requirePermission("settings.manage"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { testEmail } = req.body;
      if (!testEmail) {
        return res.status(400).json({ error: "Test email address is required" });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testEmail)) {
        return res.status(400).json({ error: "Invalid test email address" });
      }
      const { EmailService: EmailService2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
      const emailService = new EmailService2(storage);
      const result = await emailService.sendTestEmail(clientId, testEmail);
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error("Test SMTP error:", error);
      res.status(500).json({ error: "Failed to test SMTP configuration" });
    }
  });
  app2.delete("/api/client/:clientId/smtp-config", requirePermission("settings.manage"), async (req, res) => {
    try {
      const { clientId } = req.params;
      await storage.clearSmtpConfig(clientId);
      res.json({ message: "SMTP configuration cleared successfully" });
    } catch (error) {
      console.error("Clear SMTP config error:", error);
      res.status(500).json({ error: "Failed to clear SMTP configuration" });
    }
  });
  app2.get("/api/client/:clientId/appointments", requirePermission("appointments.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const appointments2 = await storage.getAppointments(clientId);
      res.json(appointments2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });
  app2.post("/api/client/:clientId/appointments", requirePermission("appointments.create"), async (req, res) => {
    try {
      const { clientId } = req.params;
      console.log("Creating appointment with data:", req.body);
      const dataWithClientId = {
        ...req.body,
        clientId,
        appointmentDate: new Date(req.body.appointmentDate)
      };
      const appointmentData = insertAppointmentSchema.parse(dataWithClientId);
      console.log("Parsed appointment data:", appointmentData);
      const appointment = await storage.createAppointment(appointmentData);
      try {
        const { EmailService: EmailService2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
        const emailService = new EmailService2(storage);
        const client = await storage.getClient(clientId);
        const services2 = await storage.getClientServices(clientId);
        const service = services2.find((s) => s.id === appointmentData.serviceId);
        if (client && service && appointmentData.customerEmail) {
          const emailResult = await emailService.sendAppointmentConfirmation(
            clientId,
            appointmentData.customerEmail,
            appointmentData.customerName,
            {
              id: appointment.id,
              serviceName: service.name,
              servicePrice: service.price,
              serviceDuration: service.durationMinutes,
              appointmentDate: new Date(appointment.appointmentDate),
              // Ensure Date object
              startTime: appointment.startTime,
              endTime: appointment.endTime,
              notes: appointment.notes || "",
              businessName: client.businessName,
              businessPhone: client.phone || "",
              businessEmail: client.email
            }
          );
          console.log(`\u{1F4E7} Admin appointment confirmation: ${emailResult.success ? "Success" : `Failed - ${emailResult.message}`}`);
        }
      } catch (error) {
        console.error("\u274C Failed to send admin appointment confirmation:", error);
      }
      res.json(appointment);
    } catch (error) {
      console.error("Failed to create appointment:", error);
      res.status(500).json({ error: "Failed to create appointment", details: error.message });
    }
  });
  app2.put("/api/client/:clientId/appointments/:appointmentId", requirePermission("appointments.edit"), async (req, res) => {
    try {
      const { appointmentId, clientId } = req.params;
      const updates = req.body;
      const originalAppointment = await storage.getAppointment(appointmentId);
      if (!originalAppointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      const appointment = await storage.updateAppointment(appointmentId, updates);
      if (updates.status && updates.status !== originalAppointment.status) {
        try {
          const client = await storage.getClient(clientId);
          const services2 = await storage.getClientServices(clientId);
          const service = services2.find((s) => s.id === appointment.serviceId);
          if (client && service && appointment.customerEmail) {
            const { EmailService: EmailService2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
            const emailService = new EmailService2(storage);
            const emailResult = await emailService.sendAppointmentStatusUpdate(
              clientId,
              appointment.customerEmail,
              appointment.customerName,
              {
                id: appointment.id,
                serviceName: service.name,
                servicePrice: service.price,
                appointmentDate: new Date(appointment.appointmentDate),
                // Ensure Date object
                startTime: appointment.startTime,
                endTime: appointment.endTime,
                status: appointment.status,
                businessName: client.businessName,
                businessPhone: client.phone || "",
                businessEmail: client.email
              }
            );
            console.log(`\u{1F4E7} Status update email: ${emailResult.success ? "Success" : `Failed - ${emailResult.message}`}`);
          }
        } catch (emailError) {
          console.error("\u274C Failed to send status update email:", emailError);
        }
      }
      res.json(appointment);
    } catch (error) {
      console.error("Failed to update appointment:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });
  app2.delete("/api/client/:clientId/appointments/:appointmentId", requirePermission("appointments.edit"), async (req, res) => {
    try {
      const { appointmentId } = req.params;
      await storage.deleteAppointment(appointmentId);
      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });
  app2.post("/api/client/:clientId/appointments/:appointmentId/transfer", requirePermission("appointments.edit"), async (req, res) => {
    try {
      const { clientId, appointmentId } = req.params;
      const { toStaffId, reason } = req.body;
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      if (appointment.clientId !== clientId) {
        return res.status(403).json({ error: "Unauthorized access to appointment" });
      }
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      const plan = await storage.getPlan(client.planId);
      if (!plan || !plan.features.includes("Appointment Transfer")) {
        return res.status(403).json({
          error: "Appointment transfer is only available on Team plan or higher",
          upgrade: true
        });
      }
      if (!toStaffId) {
        return res.status(400).json({ error: "toStaffId is required" });
      }
      const targetStaff = await storage.getTeamMember(toStaffId);
      if (!targetStaff || targetStaff.clientId !== clientId) {
        return res.status(400).json({ error: "Invalid staff member for this client" });
      }
      const transferredBy = clientId;
      const updatedAppointment = await storage.transferAppointment(
        appointmentId,
        toStaffId,
        transferredBy,
        reason
      );
      res.json({
        message: "Appointment transferred successfully",
        appointment: updatedAppointment
      });
    } catch (error) {
      console.error("Failed to transfer appointment:", error);
      res.status(500).json({ error: "Failed to transfer appointment" });
    }
  });
  app2.get("/api/client/:clientId/appointments/:appointmentId/transfers", requirePermission("appointments.view"), async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const transfers = await storage.getAppointmentTransfers(appointmentId);
      res.json(transfers);
    } catch (error) {
      console.error("Failed to fetch transfer history:", error);
      res.status(500).json({ error: "Failed to fetch transfer history" });
    }
  });
  app2.get("/api/client/:clientId/staff/:staffId/transfers", requirePermission("appointments.view"), async (req, res) => {
    try {
      const { staffId } = req.params;
      const transfers = await storage.getStaffTransfers(staffId);
      res.json(transfers);
    } catch (error) {
      console.error("Failed to fetch staff transfers:", error);
      res.status(500).json({ error: "Failed to fetch staff transfers" });
    }
  });
  app2.post("/api/appointments/:appointmentId/send-calendar-invite", async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const { recipientEmail } = req.body;
      if (!recipientEmail || !recipientEmail.includes("@")) {
        return res.status(400).json({ error: "Valid recipient email is required" });
      }
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      const client = await storage.getClient(appointment.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      const services2 = await storage.getClientServices(appointment.clientId);
      const service = services2.find((s) => s.id === appointment.serviceId);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      const { EmailService: EmailService2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
      const emailService = new EmailService2(storage);
      const result = await emailService.sendCalendarInvite(
        appointment.clientId,
        recipientEmail,
        {
          id: appointment.id,
          customerName: appointment.customerName,
          serviceName: service.name,
          appointmentDate: new Date(appointment.appointmentDate),
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          durationMinutes: service.durationMinutes,
          notes: appointment.notes || void 0,
          businessName: client.businessName,
          businessPhone: client.phone || void 0,
          businessEmail: client.email,
          businessAddress: client.businessAddress || void 0
        }
      );
      if (result.success) {
        res.json({ message: result.message, success: true });
      } else {
        res.status(500).json({ error: result.message, success: false });
      }
    } catch (error) {
      console.error("Failed to send calendar invite:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({ error: `Failed to send calendar invite: ${errorMessage}` });
    }
  });
  app2.get("/api/client/:clientId/operating-hours", async (req, res) => {
    try {
      const { clientId } = req.params;
      const hours = await storage.getOperatingHours(clientId);
      res.json(hours);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch operating hours" });
    }
  });
  app2.post("/api/client/:clientId/operating-hours", async (req, res) => {
    try {
      const { clientId } = req.params;
      const hoursData = req.body.map((h) => ({ ...h, clientId }));
      const hours = await storage.setOperatingHours(clientId, hoursData);
      res.json(hours);
    } catch (error) {
      res.status(500).json({ error: "Failed to update operating hours" });
    }
  });
  app2.post("/api/client/:clientId/export/glossgenius", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { appointmentIds, apiKey, businessId } = req.body;
      if (!apiKey || !businessId) {
        return res.status(400).json({
          error: "GlossGenius API Key and Business ID are required"
        });
      }
      if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
        return res.status(400).json({
          error: "At least one appointment must be selected"
        });
      }
      const glossGenius = new GlossGeniusIntegration({
        apiKey,
        businessId,
        baseUrl: "https://api.glossgenius.com"
        // GlossGenius API base URL
      });
      const appointments2 = [];
      for (const appointmentId of appointmentIds) {
        const appointment = await storage.getAppointment(appointmentId);
        if (appointment && appointment.clientId === clientId) {
          const client = await storage.getClient(appointment.clientId);
          const services2 = await storage.getClientServices(appointment.clientId);
          const service = services2.find((s) => s.id === appointment.serviceId);
          if (client && service) {
            appointments2.push({
              id: appointment.id,
              clientName: client.name,
              clientEmail: client.email,
              clientPhone: client.phone || "",
              serviceName: service.name,
              date: appointment.date,
              time: appointment.time,
              duration: appointment.duration || 60,
              price: service.price,
              status: appointment.status,
              notes: appointment.notes || "",
              staffId: appointment.teamMemberId || ""
            });
          }
        }
      }
      if (appointments2.length === 0) {
        return res.status(404).json({
          error: "No valid appointments found to export"
        });
      }
      const result = await glossGenius.exportAppointments(appointments2);
      res.json({
        success: result.success,
        failed: result.failed,
        total: appointments2.length,
        errors: result.errors
      });
    } catch (error) {
      console.error("GlossGenius export error:", error);
      res.status(500).json({
        error: error.message || "Failed to export appointments to GlossGenius"
      });
    }
  });
  app2.post("/api/client/:clientId/export/glossgenius/all", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { apiKey, businessId, dateFrom, dateTo } = req.body;
      if (!apiKey || !businessId) {
        return res.status(400).json({
          error: "GlossGenius API Key and Business ID are required"
        });
      }
      const glossGenius = new GlossGeniusIntegration({
        apiKey,
        businessId,
        baseUrl: "https://api.glossgenius.com"
      });
      const allAppointments = await storage.getClientAppointments(clientId);
      let filteredAppointments = allAppointments;
      if (dateFrom || dateTo) {
        filteredAppointments = allAppointments.filter((apt) => {
          const aptDate = new Date(apt.date);
          if (dateFrom && aptDate < new Date(dateFrom)) return false;
          if (dateTo && aptDate > new Date(dateTo)) return false;
          return true;
        });
      }
      const appointments2 = [];
      for (const appointment of filteredAppointments) {
        const client = await storage.getClient(appointment.clientId);
        const services2 = await storage.getClientServices(appointment.clientId);
        const service = services2.find((s) => s.id === appointment.serviceId);
        if (client && service) {
          appointments2.push({
            id: appointment.id,
            clientName: client.name,
            clientEmail: client.email,
            clientPhone: client.phone || "",
            serviceName: service.name,
            date: appointment.date,
            time: appointment.time,
            duration: appointment.duration || 60,
            price: service.price,
            status: appointment.status,
            notes: appointment.notes || "",
            staffId: appointment.teamMemberId || ""
          });
        }
      }
      if (appointments2.length === 0) {
        return res.status(404).json({
          error: "No appointments found to export"
        });
      }
      const result = await glossGenius.exportAppointments(appointments2);
      res.json({
        success: result.success,
        failed: result.failed,
        total: appointments2.length,
        errors: result.errors
      });
    } catch (error) {
      console.error("GlossGenius export error:", error);
      res.status(500).json({
        error: error.message || "Failed to export appointments to GlossGenius"
      });
    }
  });
  app2.get("/api/client/:clientId/leads", requirePermission("leads.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const leads2 = await storage.getLeads(clientId);
      res.json(leads2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });
  app2.post("/api/client/:clientId/leads", requirePermission("leads.create"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const leadData = insertLeadSchema.parse({ ...req.body, clientId });
      console.log("Creating lead with data:", leadData);
      const lead = await storage.createLead(leadData);
      console.log("Lead created successfully:", lead.id);
      res.json(lead);
    } catch (error) {
      console.error("Lead creation error:", error);
      res.status(500).json({ error: "Failed to create lead" });
    }
  });
  app2.put("/api/client/:clientId/leads/:leadId", requirePermission("leads.edit"), async (req, res) => {
    try {
      const { leadId } = req.params;
      const updates = req.body;
      const lead = await storage.updateLead(leadId, updates);
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lead" });
    }
  });
  app2.delete("/api/client/:clientId/leads/:leadId", requirePermission("leads.edit"), async (req, res) => {
    try {
      const { leadId } = req.params;
      await storage.deleteLead(leadId);
      res.json({ message: "Lead deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });
  app2.get("/api/client/:clientId/website", requirePermission("website.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const website = await storage.getClientWebsite(clientId);
      res.json(website);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch website settings" });
    }
  });
  app2.post("/api/client/:clientId/website", requirePermission("website.edit"), async (req, res) => {
    try {
      const { clientId } = req.params;
      console.log("POST website request body:", req.body);
      const websiteData = { ...insertClientWebsiteSchema.parse(req.body), clientId };
      const website = await storage.createClientWebsite(websiteData);
      res.json(website);
    } catch (error) {
      console.error("POST website error:", error);
      res.status(500).json({ error: "Failed to create website" });
    }
  });
  app2.put("/api/client/:clientId/website", requirePermission("website.edit"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { id, createdAt, updatedAt, ...updates } = req.body;
      if (false) {
        console.log("\u{1F504} PUT website request for client:", clientId);
        console.log("\u{1F504} Request body keys:", Object.keys(updates));
        if (updates.sections) {
          try {
            const parsedSections = typeof updates.sections === "string" ? JSON.parse(updates.sections) : updates.sections;
            console.log("\u{1F504} Parsed sections count:", parsedSections.length);
            parsedSections.forEach((section, idx) => {
              console.log(`\u{1F504} Section ${idx}: ${section.type} - ${section.title || "No title"}`);
              if (section.columns) {
                section.columns.forEach((col, colIdx) => {
                  console.log(`  \u{1F504} Column ${colIdx}: ${col.elements?.length || 0} elements`);
                  col.elements?.forEach((el, elIdx) => {
                    console.log(`    \u{1F504} Element ${elIdx}: ${el.type} - Content: "${el.content?.substring(0, 50) || "No content"}"`);
                  });
                });
              }
            });
          } catch (parseError) {
            console.error("\u{1F504} Error parsing sections:", parseError);
          }
        }
      }
      const website = await storage.updateClientWebsite(clientId, updates);
      res.json(website);
    } catch (error) {
      console.error("PUT website error:", error);
      res.status(500).json({ error: "Failed to update website" });
    }
  });
  app2.get("/api/public/:subdomain/website", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const client = await storage.getClientBySubdomain(subdomain);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      let website = await storage.getClientWebsite(client.id);
      if (!website) {
        console.log(`[Website Builder] Auto-initializing website for subdomain ${subdomain}`);
        const defaultWebsite = {
          clientId: client.id,
          subdomain,
          title: `${client.businessName} - Professional Services`,
          description: client.businessDescription || `${client.businessName} - Quality service you can trust`,
          heroImage: null,
          primaryColor: "#3B82F6",
          secondaryColor: "#F3F4F6",
          contactInfo: JSON.stringify({
            phone: client.phone || "",
            email: client.email || "",
            address: client.businessAddress || ""
          }),
          socialLinks: JSON.stringify({}),
          sections: JSON.stringify([
            {
              id: "hero",
              type: "hero",
              title: `Welcome to ${client.businessName}`,
              content: client.businessDescription || "Professional services for all your needs.",
              settings: {
                backgroundColor: "#3B82F6",
                textColor: "#FFFFFF",
                alignment: "center",
                padding: "large"
              }
            },
            {
              id: "about",
              type: "about",
              title: `About ${client.businessName}`,
              content: client.businessAddress || "We are dedicated to providing exceptional service.",
              settings: {
                backgroundColor: "#FFFFFF",
                textColor: "#1F2937",
                alignment: "left",
                padding: "medium"
              }
            }
          ])
        };
        try {
          website = await storage.createClientWebsite(defaultWebsite);
          console.log(`[Website Builder] Successfully initialized website ${website.id} for subdomain ${subdomain}`);
        } catch (createError) {
          if (createError.code === "23505") {
            console.log(`[Website Builder] Race condition detected, fetching existing website for subdomain ${subdomain}`);
            website = await storage.getClientWebsite(client.id);
          } else {
            throw createError;
          }
        }
      }
      res.json(website);
    } catch (error) {
      console.error("Error fetching public website:", error);
      res.status(500).json({ error: "Failed to fetch website" });
    }
  });
  app2.get("/api/public/client/:clientId/website", async (req, res) => {
    try {
      const { clientId } = req.params;
      let website = await storage.getClientWebsite(clientId);
      if (!website) {
        console.log(`[Website Builder] Auto-initializing website for client ${clientId}`);
        const client = await storage.getClient(clientId);
        if (!client) {
          return res.status(404).json({ error: "Client not found" });
        }
        const baseSubdomain = client.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "business";
        const clientSuffix = clientId.split("_")[1] || clientId.substring(clientId.length - 8);
        const subdomain = `${baseSubdomain}-${clientSuffix}`;
        const defaultWebsite = {
          clientId,
          subdomain,
          title: `${client.businessName} - Professional Services`,
          description: client.businessDescription || `${client.businessName} - Quality service you can trust`,
          heroImage: null,
          primaryColor: "#3B82F6",
          secondaryColor: "#F3F4F6",
          contactInfo: JSON.stringify({
            phone: client.phone || "",
            email: client.email || "",
            address: client.businessAddress || ""
          }),
          socialLinks: JSON.stringify({}),
          sections: JSON.stringify([
            {
              id: "hero",
              type: "hero",
              title: `Welcome to ${client.businessName}`,
              content: client.businessDescription || "Professional services for all your needs.",
              settings: {
                backgroundColor: "#3B82F6",
                textColor: "#FFFFFF",
                alignment: "center",
                padding: "large"
              }
            },
            {
              id: "about",
              type: "about",
              title: `About ${client.businessName}`,
              content: client.businessAddress || "We are dedicated to providing exceptional service.",
              settings: {
                backgroundColor: "#FFFFFF",
                textColor: "#1F2937",
                alignment: "left",
                padding: "medium"
              }
            }
          ]),
          showPrices: true,
          allowOnlineBooking: true,
          isPublished: false
        };
        try {
          website = await storage.createClientWebsite(defaultWebsite);
          console.log(`[Website Builder] Successfully initialized website ${website.id} for client ${clientId}`);
        } catch (createError) {
          if (createError?.code === "23505") {
            console.log(`[Website Builder] Website already exists (race condition), fetching existing record`);
            website = await storage.getClientWebsite(clientId);
            if (!website) {
              throw new Error("Website exists but cannot be retrieved");
            }
          } else {
            throw createError;
          }
        }
      }
      res.json(website);
    } catch (error) {
      console.error("[Website Builder] Error fetching/initializing website:", error);
      res.status(500).json({ error: "Failed to fetch website" });
    }
  });
  app2.get("/api/client/:clientId/appointment-slots", async (req, res) => {
    try {
      const { clientId } = req.params;
      const slots = await storage.getAppointmentSlots(clientId);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointment slots" });
    }
  });
  app2.post("/api/client/:clientId/appointment-slots", async (req, res) => {
    try {
      const { clientId } = req.params;
      console.log("Creating appointment slot - clientId:", clientId);
      console.log("Request body:", req.body);
      const slotData = { ...insertAppointmentSlotSchema.parse(req.body), clientId };
      console.log("Parsed slot data:", slotData);
      const slot = await storage.createAppointmentSlot(slotData);
      console.log("Created slot:", slot);
      res.json(slot);
    } catch (error) {
      console.error("Error creating appointment slot:", error);
      res.status(500).json({ error: "Failed to create appointment slot", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.put("/api/client/:clientId/appointment-slots/:slotId", async (req, res) => {
    try {
      const { slotId } = req.params;
      const updates = req.body;
      const slot = await storage.updateAppointmentSlot(slotId, updates);
      res.json(slot);
    } catch (error) {
      res.status(500).json({ error: "Failed to update appointment slot" });
    }
  });
  app2.delete("/api/client/:clientId/appointment-slots/:slotId", async (req, res) => {
    try {
      const { slotId } = req.params;
      await storage.deleteAppointmentSlot(slotId);
      res.json({ message: "Appointment slot deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete appointment slot" });
    }
  });
  app2.get("/api/client/:clientId/team", requirePermission("team.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const teamMembers2 = await storage.getTeamMembers(clientId);
      res.json(teamMembers2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });
  app2.post("/api/client/:clientId/team", async (req, res) => {
    try {
      const { clientId } = req.params;
      const memberData = { ...insertTeamMemberSchema.parse(req.body), clientId };
      const member = await storage.createTeamMember(memberData);
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to create team member" });
    }
  });
  app2.patch("/api/client/:clientId/team/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;
      const updates = req.body;
      const member = await storage.updateTeamMember(memberId, updates);
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to update team member" });
    }
  });
  app2.delete("/api/client/:clientId/team/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;
      await storage.deleteTeamMember(memberId);
      res.json({ message: "Team member deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete team member" });
    }
  });
  app2.get("/api/public/website/:subdomain", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const website = await storage.getPublicWebsite(subdomain);
      if (!website) {
        return res.status(404).json({ error: "Website not found" });
      }
      const client = await storage.getClient(website.clientId);
      const services2 = await storage.getClientServices(website.clientId);
      const operatingHours3 = await storage.getOperatingHours(website.clientId);
      res.json({
        website,
        client,
        services: services2.filter((s) => s.isActive),
        operatingHours: operatingHours3
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch public website" });
    }
  });
  app2.post("/api/public/website/:subdomain/book-appointment", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const website = await storage.getPublicWebsite(subdomain);
      if (!website || !website.allowOnlineBooking) {
        return res.status(404).json({ error: "Booking not available" });
      }
      const appointmentData = {
        ...insertAppointmentSchema.parse(req.body),
        clientId: website.clientId,
        status: "SCHEDULED"
      };
      const appointment = await storage.createAppointment(appointmentData);
      await storage.createLead({
        clientId: website.clientId,
        name: appointment.customerName,
        email: appointment.customerEmail,
        phone: appointment.customerPhone || "",
        source: "website",
        status: "CONVERTED",
        convertedToAppointment: true,
        appointmentId: appointment.id,
        interestedServices: [appointment.serviceId]
      });
      res.json({
        message: "Appointment booked successfully",
        appointment
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to book appointment" });
    }
  });
  app2.post("/api/auth/client-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (user && user.role === "CLIENT" && user.password === password) {
        const client = await storage.getClientByEmail(email);
        if (client) {
          res.json({
            user: {
              id: user.id,
              email: user.email,
              role: "BUSINESS_OWNER",
              clientId: client.id,
              permissions: ["*"],
              // Full access
              name: client.contactPerson
            },
            client,
            userType: "BUSINESS_OWNER"
          });
          return;
        }
      }
      console.log(`Looking for team member with email: ${email}`);
      const clients2 = await storage.getClients();
      const allTeamMembers = [];
      for (const client of clients2) {
        try {
          const clientTeamMembers = await storage.getTeamMembers(client.id);
          allTeamMembers.push(...clientTeamMembers);
        } catch (error) {
          console.error(`Error fetching team members for client ${client.id}:`, error);
        }
      }
      const teamMember = allTeamMembers.find(
        (member) => member.email === email && member.isActive !== false
      );
      if (teamMember && teamMember.password === password) {
        console.log(`Found team member: ${teamMember.name} (${teamMember.email})`);
        const client = await storage.getClient(teamMember.clientId);
        if (client) {
          console.log("Team login successful");
          res.json({
            user: {
              id: teamMember.id,
              email: teamMember.email,
              role: "TEAM_MEMBER",
              clientId: teamMember.clientId,
              permissions: teamMember.permissions,
              name: teamMember.name
            },
            client,
            userType: "TEAM_MEMBER",
            teamMember: {
              id: teamMember.id,
              name: teamMember.name,
              email: teamMember.email,
              role: teamMember.role,
              permissions: teamMember.permissions,
              clientId: teamMember.clientId
            }
          });
          return;
        }
      }
      res.status(401).json({ error: "Invalid credentials" });
    } catch (error) {
      console.error("Client login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.post("/api/auth/team-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const clients2 = await storage.getClients();
      const allTeamMembers = [];
      for (const client2 of clients2) {
        try {
          const clientTeamMembers = await storage.getTeamMembers(client2.id);
          allTeamMembers.push(...clientTeamMembers);
        } catch (error) {
          console.error(`Error fetching team members for client ${client2.id}:`, error);
        }
      }
      console.log(`Found ${allTeamMembers.length} total team members`);
      console.log(`Looking for team member with email: ${email}`);
      const teamMember = allTeamMembers.find(
        (member) => member.email === email && member.isActive !== false
      );
      if (!teamMember) {
        console.log("Team member not found or inactive");
        return res.status(401).json({ error: "Invalid credentials" });
      }
      console.log(`Found team member: ${teamMember.name} (${teamMember.email})`);
      if (teamMember.password !== password) {
        console.log("Password mismatch");
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const client = await storage.getClient(teamMember.clientId);
      if (!client) {
        console.log(`Client ${teamMember.clientId} not found`);
        return res.status(404).json({ error: "Client not found" });
      }
      console.log("Team login successful");
      res.json({
        teamMember: {
          id: teamMember.id,
          name: teamMember.name,
          email: teamMember.email,
          role: teamMember.role,
          permissions: teamMember.permissions,
          clientId: teamMember.clientId
        },
        client
      });
    } catch (error) {
      console.error("Team member login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.get("/api/public/:subdomain", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const client = await storage.getClientBySubdomain(subdomain);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching public client:", error);
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });
  app2.get("/api/public/client/:clientId", async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching public client:", error);
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });
  app2.get("/api/public/:subdomain/services", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const client = await storage.getClientBySubdomain(subdomain);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      const services2 = await storage.getClientServices(client.id);
      const activeServices = services2.filter((s) => s.isActive);
      res.json(activeServices);
    } catch (error) {
      console.error("Error fetching public services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });
  app2.get("/api/public/client/:clientId/services", async (req, res) => {
    try {
      const { clientId } = req.params;
      const services2 = await storage.getClientServices(clientId);
      const activeServices = services2.filter((s) => s.isActive);
      res.json(activeServices);
    } catch (error) {
      console.error("Error fetching public services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });
  app2.get("/api/public/client/:clientId/available-slots", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
      }
      const availableSlots = await storage.getAvailableSlots(clientId, date);
      res.json(availableSlots);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      res.status(500).json({ error: "Failed to fetch available slots" });
    }
  });
  app2.post("/api/public/client/:clientId/contact", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { name, email, phone, message } = req.body;
      const lead = await storage.createLead({
        clientId,
        name,
        email,
        phone: phone || "",
        source: "website",
        status: "NEW",
        notes: message,
        estimatedValue: 0,
        convertedToAppointment: false
      });
      res.json({
        message: "Contact form submitted successfully",
        lead
      });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ error: "Failed to submit contact form" });
    }
  });
  app2.post("/api/public/client/:clientId/submit-lead", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { name, email, phone, serviceInterest, estimatedBudget, contactMethod, notes } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }
      let estimatedValue = null;
      if (estimatedBudget && estimatedBudget.trim()) {
        const cleanBudget = estimatedBudget.replace(/[^\d.]/g, "");
        const parsedBudget = parseFloat(cleanBudget);
        if (!isNaN(parsedBudget)) {
          estimatedValue = parsedBudget;
        }
      }
      let sourceField = "website-lead-form";
      let interestedServicesArray = [];
      if (serviceInterest) {
        const isServiceId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serviceInterest);
        if (isServiceId) {
          try {
            const services2 = await storage.getClientServices(clientId);
            const service = services2.find((s) => s.id === serviceInterest);
            if (service) {
              sourceField = service.name;
              interestedServicesArray = [serviceInterest];
            } else {
              sourceField = "Unknown Service";
              interestedServicesArray = [serviceInterest];
            }
          } catch (error) {
            console.error("Error resolving service ID:", error);
            sourceField = "Service ID: " + serviceInterest;
            interestedServicesArray = [serviceInterest];
          }
        } else {
          sourceField = serviceInterest;
          interestedServicesArray = [serviceInterest];
        }
      }
      const lead = await storage.createLead({
        clientId,
        name,
        email,
        phone: phone || "",
        source: sourceField,
        status: "NEW",
        notes: notes || `Contact preference: ${contactMethod || "Not specified"}`,
        interestedServices: interestedServicesArray,
        estimatedValue,
        followUpDate: null,
        convertedToAppointment: false,
        appointmentId: null
      });
      res.json({ message: "Lead submitted successfully! We'll contact you within 24 hours.", leadId: lead.id });
    } catch (error) {
      console.error("Error submitting lead form:", error);
      res.status(500).json({ error: "Failed to submit lead form" });
    }
  });
  app2.post("/api/public/client/:clientId/book", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { serviceId, customerName, customerEmail, customerPhone, appointmentDate, startTime, notes, source } = req.body;
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      const service = await storage.getClientServices(clientId);
      const selectedService = service.find((s) => s.id === serviceId);
      if (!selectedService) {
        return res.status(404).json({ error: "Service not found" });
      }
      console.log(`Booking validation - clientId: ${clientId}, appointmentDate: ${appointmentDate}, startTime: ${startTime}`);
      const availableSlots = await storage.getAvailableSlots(clientId, appointmentDate);
      console.log(`Available slots for ${appointmentDate}:`, availableSlots);
      console.log(`Checking if '${startTime}' is in available slots:`, availableSlots.includes(startTime));
      if (!availableSlots.includes(startTime)) {
        console.log(`BOOKING FAILED: startTime '${startTime}' not found in available slots:`, availableSlots);
        return res.status(400).json({ error: "Time slot is not available" });
      }
      console.log(`BOOKING SUCCESS: Time slot ${startTime} is available!`);
      const startMinutes = parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]);
      const endMinutes = startMinutes + selectedService.durationMinutes;
      const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;
      const appointmentDateObj = /* @__PURE__ */ new Date(appointmentDate + "T00:00:00");
      const appointment = await storage.createAppointment({
        clientId,
        serviceId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || "",
        appointmentDate: appointmentDateObj,
        startTime,
        endTime,
        notes: notes || "",
        status: "PENDING",
        totalPrice: selectedService.price
      });
      await storage.createLead({
        clientId,
        name: customerName,
        email: customerEmail,
        phone: customerPhone || "",
        source: source || "website",
        status: "CONVERTED",
        estimatedValue: selectedService.price,
        convertedToAppointment: true,
        appointmentId: appointment.id,
        interestedServices: [serviceId]
      });
      try {
        const { EmailService: EmailService2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
        const emailService = new EmailService2(storage);
        const emailResult = await emailService.sendAppointmentConfirmation(
          clientId,
          customerEmail,
          customerName,
          {
            id: appointment.id,
            serviceName: selectedService.name,
            servicePrice: selectedService.price,
            serviceDuration: selectedService.durationMinutes,
            appointmentDate: new Date(appointmentDate),
            startTime,
            endTime,
            notes,
            businessName: client.businessName,
            businessPhone: client.phone || "",
            businessEmail: client.email
          }
        );
        console.log(`\u{1F4E7} Appointment confirmation email: ${emailResult.success ? "Success" : `Failed - ${emailResult.message}`}`);
      } catch (error) {
        console.error("\u274C Failed to send appointment confirmation email:", error);
      }
      res.json({
        message: "Appointment booked successfully",
        appointment
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      res.status(500).json({ error: "Failed to book appointment" });
    }
  });
  app2.get("/api/clients/:clientId/domains", requirePermission("domains.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const domains = await storage.getDomainConfigurations(clientId);
      res.json(domains);
    } catch (error) {
      console.error("Error fetching domain configurations:", error);
      res.status(500).json({ error: "Failed to fetch domain configurations" });
    }
  });
  app2.get("/api/domains/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const domain = await storage.getDomainConfiguration(id);
      if (!domain) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }
      res.json(domain);
    } catch (error) {
      console.error("Error fetching domain configuration:", error);
      res.status(500).json({ error: "Failed to fetch domain configuration" });
    }
  });
  app2.post("/api/domains/:id/verify", async (req, res) => {
    try {
      const { id } = req.params;
      const domain = await storage.getDomainConfiguration(id);
      if (!domain) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }
      const { DNSVerificationService: DNSVerificationService2 } = await Promise.resolve().then(() => (init_dns_verification(), dns_verification_exports));
      const dnsService = new DNSVerificationService2();
      const fullDomain = domain.subdomain ? `${domain.subdomain}.${domain.domain}` : domain.domain;
      const verificationResult = await dnsService.verifyDomainViaDNS(fullDomain, `scheduled-verify-${id}`);
      if (verificationResult.success) {
        const updatedDomain = await storage.updateDomainConfiguration(id, {
          ...domain,
          verificationStatus: "VERIFIED",
          verifiedAt: /* @__PURE__ */ new Date()
        });
        res.json({
          message: "Domain verified successfully",
          domain: updatedDomain,
          verificationResult
        });
      } else {
        res.status(400).json({
          error: "Domain verification failed",
          details: verificationResult.errorMessage,
          instructions: "Please ensure you have added the required DNS records and wait 5-10 minutes for propagation"
        });
      }
    } catch (error) {
      console.error("Error verifying domain:", error);
      res.status(500).json({ error: "Domain verification failed" });
    }
  });
  app2.delete("/api/domains/:id", requirePermission("domains.delete"), async (req, res) => {
    try {
      const { id } = req.params;
      const domain = await storage.getDomainConfiguration(id);
      if (!domain) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }
      await storage.deleteDomainConfiguration(id);
      res.json({
        message: "Domain configuration removed successfully",
        removedDomain: domain.domain
      });
    } catch (error) {
      console.error("Error deleting domain configuration:", error);
      res.status(500).json({ error: "Failed to delete domain configuration" });
    }
  });
  app2.post("/api/clients/:clientId/domains", requirePermission("domains.create"), async (req, res) => {
    try {
      const { clientId } = req.params;
      let validatedData;
      try {
        validatedData = enhancedDomainConfigurationSchema.parse(req.body);
      } catch (validationError) {
        return res.status(400).json({
          error: "Domain validation failed",
          details: validationError.errors || validationError.message
        });
      }
      const normalizedDomain = validateDomain(validatedData.domain);
      const existingDomain = await storage.getDomainConfigurationByDomain(normalizedDomain);
      if (existingDomain) {
        return res.status(400).json({
          error: "Domain already configured",
          domain: normalizedDomain
        });
      }
      const wwwDomain = `www.${normalizedDomain}`;
      const nonWwwDomain = normalizedDomain.replace(/^www\./, "");
      if (normalizedDomain !== wwwDomain) {
        const wwwExists = await storage.getDomainConfigurationByDomain(wwwDomain);
        if (wwwExists) {
          return res.status(400).json({
            error: "Domain conflict: www variant already configured",
            conflicting_domain: wwwDomain
          });
        }
      }
      if (normalizedDomain !== nonWwwDomain) {
        const nonWwwExists = await storage.getDomainConfigurationByDomain(nonWwwDomain);
        if (nonWwwExists) {
          return res.status(400).json({
            error: "Domain conflict: non-www variant already configured",
            conflicting_domain: nonWwwDomain
          });
        }
      }
      const domainData = {
        ...validatedData,
        clientId,
        domain: normalizedDomain
      };
      const domain = await storage.createDomainConfiguration(domainData);
      res.json(domain);
    } catch (error) {
      console.error("Error creating domain configuration:", error);
      if (error instanceof DomainValidationError) {
        return res.status(400).json({
          error: error.message,
          code: error.code
        });
      }
      res.status(500).json({ error: "Failed to create domain configuration" });
    }
  });
  app2.put("/api/domains/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const existingDomain = await storage.getDomainConfiguration(id);
      if (!existingDomain) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }
      const permissionCheck = await requirePermission("domains.edit")(
        { ...req, params: { ...req.params, clientId: existingDomain.clientId } },
        res,
        () => {
        }
      );
      if (res.headersSent) {
        return;
      }
      let validatedUpdates;
      try {
        validatedUpdates = enhancedDomainConfigurationSchema.partial().parse(req.body);
      } catch (validationError) {
        return res.status(400).json({
          error: "Domain validation failed",
          details: validationError.errors || validationError.message
        });
      }
      if (validatedUpdates.domain && validatedUpdates.domain !== existingDomain.domain) {
        const normalizedDomain = validateDomain(validatedUpdates.domain);
        const domainExists = await storage.getDomainConfigurationByDomain(normalizedDomain);
        if (domainExists && domainExists.id !== id) {
          return res.status(400).json({
            error: "Domain already configured by another configuration",
            domain: normalizedDomain
          });
        }
        validatedUpdates.domain = normalizedDomain;
      }
      const domain = await storage.updateDomainConfiguration(id, validatedUpdates);
      res.json(domain);
    } catch (error) {
      console.error("Error updating domain configuration:", error);
      if (error instanceof DomainValidationError) {
        return res.status(400).json({
          error: error.message,
          code: error.code
        });
      }
      res.status(500).json({ error: "Failed to update domain configuration" });
    }
  });
  app2.delete("/api/domains/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const existingDomain = await storage.getDomainConfiguration(id);
      if (!existingDomain) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }
      const permissionCheck = await requirePermission("domains.delete")(
        { ...req, params: { ...req.params, clientId: existingDomain.clientId } },
        res,
        () => {
        }
      );
      if (res.headersSent) {
        return;
      }
      await storage.deleteDomainConfiguration(id);
      res.json({ message: "Domain configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting domain configuration:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }
      res.status(500).json({ error: "Failed to delete domain configuration" });
    }
  });
  app2.post("/api/domains/:id/verify", async (req, res) => {
    try {
      const { id } = req.params;
      const existingDomain = await storage.getDomainConfiguration(id);
      if (!existingDomain) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }
      const permissionCheck = await requirePermission("domains.edit")(
        { ...req, params: { ...req.params, clientId: existingDomain.clientId } },
        res,
        () => {
        }
      );
      if (res.headersSent) {
        return;
      }
      const domain = await storage.verifyDomain(id);
      res.json(domain);
    } catch (error) {
      console.error("Error verifying domain:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }
      if (error instanceof Error && error.message.includes("verification")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to verify domain" });
    }
  });
  app2.get("/api/domains/:id/logs", async (req, res) => {
    try {
      const { id } = req.params;
      const existingDomain = await storage.getDomainConfiguration(id);
      if (!existingDomain) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }
      const permissionCheck = await requirePermission("domains.view")(
        { ...req, params: { ...req.params, clientId: existingDomain.clientId } },
        res,
        () => {
        }
      );
      if (res.headersSent) {
        return;
      }
      const logs = await storage.getDomainVerificationLogs(id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching domain verification logs:", error);
      res.status(500).json({ error: "Failed to fetch domain verification logs" });
    }
  });
  app2.get("/api/services", async (req, res) => {
    try {
      const services2 = await storage.getServices();
      res.json(services2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });
  app2.get("/api/reviews", async (req, res) => {
    try {
      const reviews3 = await storage.getReviews();
      res.json(reviews3);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });
  app2.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to create review" });
    }
  });
  app2.get("/api/clients/:clientId/google-business", requirePermission("google_business.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const profile = await storage.getGoogleBusinessProfile(clientId);
      if (!profile) {
        return res.json(null);
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching Google Business Profile:", error);
      res.status(500).json({ error: "Failed to fetch Google Business Profile" });
    }
  });
  app2.post("/api/clients/:clientId/google-business", requirePermission("google_business.create"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const existingProfile = await storage.getGoogleBusinessProfile(clientId);
      if (existingProfile) {
        return res.status(400).json({ error: "Google Business Profile already exists for this client" });
      }
      const validatedData = insertGoogleBusinessProfileSchema.parse({
        ...req.body,
        clientId
      });
      const profile = await storage.createGoogleBusinessProfile(validatedData);
      res.json(profile);
    } catch (error) {
      console.error("Error creating Google Business Profile:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({
          error: "Invalid profile data",
          details: error.message
        });
      }
      res.status(500).json({ error: "Failed to create Google Business Profile" });
    }
  });
  app2.put("/api/google-business/:clientId", requirePermission("google_business.edit"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const existingProfile = await storage.getGoogleBusinessProfile(clientId);
      if (!existingProfile) {
        return res.status(404).json({ error: "Google Business Profile not found" });
      }
      const validatedUpdates = insertGoogleBusinessProfileSchema.partial().parse(req.body);
      const profile = await storage.updateGoogleBusinessProfile(clientId, validatedUpdates);
      res.json(profile);
    } catch (error) {
      console.error("Error updating Google Business Profile:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({
          error: "Invalid profile data",
          details: error.message
        });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: "Google Business Profile not found" });
      }
      res.status(500).json({ error: "Failed to update Google Business Profile" });
    }
  });
  app2.delete("/api/google-business/:clientId", requirePermission("google_business.delete"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const existingProfile = await storage.getGoogleBusinessProfile(clientId);
      if (!existingProfile) {
        return res.status(404).json({ error: "Google Business Profile not found" });
      }
      await storage.deleteGoogleBusinessProfile(clientId);
      res.json({ message: "Google Business Profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting Google Business Profile:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: "Google Business Profile not found" });
      }
      res.status(500).json({ error: "Failed to delete Google Business Profile" });
    }
  });
  app2.post("/api/google-business/:clientId/sync", requirePermission("google_business.edit"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const existingProfile = await storage.getGoogleBusinessProfile(clientId);
      if (!existingProfile) {
        return res.status(404).json({ error: "Google Business Profile not found" });
      }
      const profile = await storage.syncGoogleBusinessProfile(clientId);
      res.json(profile);
    } catch (error) {
      console.error("Error syncing Google Business Profile:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: "Google Business Profile not found" });
      }
      if (error instanceof Error && error.message.includes("OAuth authentication")) {
        return res.status(401).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to sync Google Business Profile" });
    }
  });
  app2.get("/api/auth/google/start/:clientId", async (req, res) => {
    try {
      const { clientId } = req.params;
      const stateToken = `${clientId}_${crypto.randomUUID()}_${Date.now()}`;
      const googleOAuthURL = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      googleOAuthURL.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
      googleOAuthURL.searchParams.set("redirect_uri", `${process.env.BASE_URL || "http://localhost:5000"}/api/auth/google/callback`);
      googleOAuthURL.searchParams.set("response_type", "code");
      googleOAuthURL.searchParams.set("scope", "https://www.googleapis.com/auth/business.manage");
      googleOAuthURL.searchParams.set("state", stateToken);
      googleOAuthURL.searchParams.set("access_type", "offline");
      googleOAuthURL.searchParams.set("prompt", "consent");
      res.redirect(googleOAuthURL.toString());
    } catch (error) {
      console.error("Error starting Google OAuth:", error);
      res.status(500).json({ error: "Failed to start Google authentication" });
    }
  });
  app2.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      const clientId = typeof state === "string" ? state.split("_")[0] : null;
      if (!code || !clientId) {
        return res.status(400).json({ error: "Missing authorization code or client ID" });
      }
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          code,
          grant_type: "authorization_code",
          redirect_uri: `${process.env.BASE_URL || "http://localhost:5000"}/api/auth/google/callback`
        })
      });
      const tokenData = await tokenResponse.json();
      if (tokenData.error) {
        console.error("Google OAuth error:", tokenData.error);
        return res.redirect(`/google-business-setup?error=oauth_failed`);
      }
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      });
      const userData = await userResponse.json();
      await storage.updateGoogleBusinessProfile(clientId, {
        oauthConnected: true,
        googleAccountId: userData.id,
        verificationStatus: "LINKED_UNVERIFIED",
        // Will become VERIFIED after successful sync
        verificationSource: "GOOGLE"
        // Store tokens securely (in real app, encrypt these)
        // For now, we'll just mark as connected
      });
      res.redirect("/google-business-setup?connected=true");
    } catch (error) {
      console.error("Error handling Google OAuth callback:", error);
      res.redirect("/google-business-setup?error=callback_failed");
    }
  });
  app2.get("/api/clients/:clientId/newsletter-subscriptions", requirePermission("view_marketing"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const subscriptions = await storage.getNewsletterSubscriptions(clientId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching newsletter subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch newsletter subscriptions" });
    }
  });
  app2.post("/api/public/clients/:clientId/newsletter-subscribe", async (req, res) => {
    try {
      const { clientId } = req.params;
      const data = insertNewsletterSubscriptionSchema.parse({
        ...req.body,
        clientId
      });
      const subscription = await storage.createNewsletterSubscription(data);
      res.json(subscription);
    } catch (error) {
      console.error("Error creating newsletter subscription:", error);
      res.status(500).json({ error: "Failed to subscribe to newsletter" });
    }
  });
  app2.put("/api/clients/:clientId/newsletter-subscriptions/:id", requirePermission("manage_marketing"), async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertNewsletterSubscriptionSchema.partial().parse(req.body);
      const subscription = await storage.updateNewsletterSubscription(id, data);
      res.json(subscription);
    } catch (error) {
      console.error("Error updating newsletter subscription:", error);
      res.status(500).json({ error: "Failed to update newsletter subscription" });
    }
  });
  app2.delete("/api/clients/:clientId/newsletter-subscriptions/:id", requirePermission("manage_marketing"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNewsletterSubscription(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting newsletter subscription:", error);
      res.status(500).json({ error: "Failed to delete newsletter subscription" });
    }
  });
  app2.get("/api/clients/:clientId/website-staff", requirePermission("view_staff"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const staff = await storage.getWebsiteStaff(clientId);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching website staff:", error);
      res.status(500).json({ error: "Failed to fetch website staff" });
    }
  });
  app2.get("/api/public/clients/:clientId/website-staff", async (req, res) => {
    try {
      const { clientId } = req.params;
      const staff = await storage.getWebsiteStaff(clientId);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching public website staff:", error);
      res.status(500).json({ error: "Failed to fetch website staff" });
    }
  });
  app2.post("/api/clients/:clientId/website-staff", requirePermission("manage_staff"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const data = insertWebsiteStaffSchema.parse({
        ...req.body,
        clientId
      });
      const staff = await storage.createWebsiteStaff(data);
      res.json(staff);
    } catch (error) {
      console.error("Error creating website staff:", error);
      res.status(500).json({ error: "Failed to create website staff member" });
    }
  });
  app2.put("/api/clients/:clientId/website-staff/:id", requirePermission("manage_staff"), async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertWebsiteStaffSchema.partial().parse(req.body);
      const staff = await storage.updateWebsiteStaff(id, data);
      res.json(staff);
    } catch (error) {
      console.error("Error updating website staff:", error);
      res.status(500).json({ error: "Failed to update website staff member" });
    }
  });
  app2.delete("/api/clients/:clientId/website-staff/:id", requirePermission("manage_staff"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWebsiteStaff(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting website staff:", error);
      res.status(500).json({ error: "Failed to delete website staff member" });
    }
  });
  app2.get("/api/clients/:clientId/pricing-tiers", requirePermission("view_services"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const tiers = await storage.getServicePricingTiers(clientId);
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching pricing tiers:", error);
      res.status(500).json({ error: "Failed to fetch pricing tiers" });
    }
  });
  app2.get("/api/public/clients/:clientId/pricing-tiers", async (req, res) => {
    try {
      const { clientId } = req.params;
      const tiers = await storage.getServicePricingTiers(clientId);
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching public pricing tiers:", error);
      res.status(500).json({ error: "Failed to fetch pricing tiers" });
    }
  });
  app2.post("/api/clients/:clientId/pricing-tiers", requirePermission("manage_services"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const data = insertServicePricingTierSchema.parse({
        ...req.body,
        clientId
      });
      const tier = await storage.createServicePricingTier(data);
      res.json(tier);
    } catch (error) {
      console.error("Error creating pricing tier:", error);
      res.status(500).json({ error: "Failed to create pricing tier" });
    }
  });
  app2.put("/api/clients/:clientId/pricing-tiers/:id", requirePermission("manage_services"), async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertServicePricingTierSchema.partial().parse(req.body);
      const tier = await storage.updateServicePricingTier(id, data);
      res.json(tier);
    } catch (error) {
      console.error("Error updating pricing tier:", error);
      res.status(500).json({ error: "Failed to update pricing tier" });
    }
  });
  app2.delete("/api/clients/:clientId/pricing-tiers/:id", requirePermission("manage_services"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteServicePricingTier(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting pricing tier:", error);
      res.status(500).json({ error: "Failed to delete pricing tier" });
    }
  });
  app2.get("/api/clients/:clientId/website-testimonials", requirePermission("view_reviews"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const testimonials = await storage.getWebsiteTestimonials(clientId);
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching website testimonials:", error);
      res.status(500).json({ error: "Failed to fetch website testimonials" });
    }
  });
  app2.get("/api/public/clients/:clientId/website-testimonials", async (req, res) => {
    try {
      const { clientId } = req.params;
      const testimonials = await storage.getWebsiteTestimonials(clientId);
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching public testimonials:", error);
      res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });
  app2.post("/api/clients/:clientId/website-testimonials", requirePermission("manage_reviews"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const data = insertWebsiteTestimonialSchema.parse({
        ...req.body,
        clientId
      });
      const testimonial = await storage.createWebsiteTestimonial(data);
      res.json(testimonial);
    } catch (error) {
      console.error("Error creating website testimonial:", error);
      res.status(500).json({ error: "Failed to create website testimonial" });
    }
  });
  app2.put("/api/clients/:clientId/website-testimonials/:id", requirePermission("manage_reviews"), async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertWebsiteTestimonialSchema.partial().parse(req.body);
      const testimonial = await storage.updateWebsiteTestimonial(id, data);
      res.json(testimonial);
    } catch (error) {
      console.error("Error updating website testimonial:", error);
      res.status(500).json({ error: "Failed to update website testimonial" });
    }
  });
  app2.delete("/api/clients/:clientId/website-testimonials/:id", requirePermission("manage_reviews"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWebsiteTestimonial(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting website testimonial:", error);
      res.status(500).json({ error: "Failed to delete website testimonial" });
    }
  });
  app2.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      const { amount, customerEmail, customerName, appointmentData } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        // Convert to cents
        currency: "usd",
        receipt_email: customerEmail,
        metadata: {
          customerName,
          appointmentData: JSON.stringify(appointmentData)
        },
        automatic_payment_methods: {
          enabled: true
        }
      });
      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error("Stripe payment intent creation error:", error);
      res.status(500).json({
        message: "Error creating payment intent: " + error.message
      });
    }
  });
  app2.post("/api/confirm-payment-booking", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      const { paymentIntentId, appointmentData } = req.body;
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          message: "Payment not completed"
        });
      }
      const appointment = await storage.createAppointment({
        ...appointmentData,
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        paymentIntentId,
        status: "CONFIRMED"
        // Auto-confirm paid appointments
      });
      await storage.createPayment({
        clientId: appointmentData.clientId,
        appointmentId: appointment.id,
        paymentMethod: "STRIPE",
        paymentProvider: "stripe",
        paymentIntentId,
        amount: paymentIntent.amount / 100,
        // Convert back from cents
        currency: paymentIntent.currency.toUpperCase(),
        status: "COMPLETED",
        customerName: appointmentData.customerName,
        customerEmail: appointmentData.customerEmail,
        description: `Payment for appointment`,
        processingFee: 0,
        // Could calculate Stripe fees here
        netAmount: paymentIntent.amount / 100,
        paidAt: /* @__PURE__ */ new Date()
      });
      res.json({
        appointment,
        message: "Payment confirmed and appointment booked successfully!"
      });
    } catch (error) {
      console.error("Payment confirmation error:", error);
      res.status(500).json({
        message: "Error confirming payment: " + error.message
      });
    }
  });
  app2.post("/api/admin/create-subscription", requireAdmin, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      const { clientId, planId, customerEmail } = req.body;
      const plan = await storage.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      let customer;
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1
      });
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: customerEmail
        });
      }
      if (!plan.monthlyStripePriceId) {
        return res.status(400).json({
          message: "Plan does not have Stripe pricing configured"
        });
      }
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: plan.monthlyStripePriceId
        }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"]
      });
      await storage.updateClient(clientId, {
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id
      });
      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
      });
    } catch (error) {
      console.error("Subscription creation error:", error);
      res.status(500).json({
        message: "Error creating subscription: " + error.message
      });
    }
  });
  app2.post("/api/admin/generate-stripe-product", requireAdmin, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      const { name, price, billing, features } = req.body;
      if (!name || !price || !billing) {
        return res.status(400).json({
          message: "Missing required fields: name, price, billing"
        });
      }
      console.log(`Admin generating Stripe product: ${name} - $${price} ${billing}`);
      const product = await stripe.products.create({
        name,
        description: features ? features.join(", ") : `${name} subscription plan`,
        metadata: {
          plan_name: name,
          billing_cycle: billing,
          created_by: "admin_dashboard",
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
      console.log(`Stripe product created: ${product.id}`);
      const stripePrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(price * 100),
        // Convert to cents
        currency: "usd",
        recurring: {
          interval: billing.toLowerCase() === "yearly" ? "year" : "month"
        },
        metadata: {
          plan_name: name,
          billing_cycle: billing,
          created_by: "admin_dashboard"
        }
      });
      console.log(`Stripe price created: ${stripePrice.id}`);
      res.json({
        success: true,
        productId: product.id,
        priceId: stripePrice.id,
        message: `Stripe product "${name}" created successfully`,
        details: {
          productName: product.name,
          priceAmount: price,
          currency: "USD",
          interval: billing.toLowerCase() === "yearly" ? "year" : "month"
        }
      });
    } catch (error) {
      console.error("Error generating Stripe product:", error);
      res.status(500).json({
        message: "Failed to generate Stripe product",
        error: error.message || "Unknown error"
      });
    }
  });
  app2.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !endpointSecret || !sig) {
      console.log("Stripe webhook config missing");
      return res.status(400).send("Webhook configuration error");
    }
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log(`Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    console.log(`Stripe webhook received: ${event.type}`);
    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object;
          console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
          if (paymentIntent.metadata.clientId && paymentIntent.metadata.serviceId) {
            console.log(`Booking payment confirmed via webhook: ${paymentIntent.id}`);
          }
          break;
        case "payment_intent.payment_failed":
          const failedPayment = event.data.object;
          console.log(`PaymentIntent failed: ${failedPayment.id}`);
          break;
        case "invoice.payment_succeeded":
          const invoice = event.data.object;
          console.log(`Invoice payment succeeded: ${invoice.id}`);
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            const clients3 = await storage.getClients();
            const client2 = clients3.find((c) => c.stripeCustomerId === subscription.customer);
            if (client2) {
              await storage.updateClient(client2.id, { status: "ACTIVE" });
              console.log(`Client ${client2.id} activated via subscription payment`);
            }
          }
          break;
        case "invoice.payment_failed":
          const failedInvoice = event.data.object;
          console.log(`Invoice payment failed: ${failedInvoice.id}`);
          if (failedInvoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription);
            const clients3 = await storage.getClients();
            const client2 = clients3.find((c) => c.stripeCustomerId === subscription.customer);
            if (client2) {
              await storage.updateClient(client2.id, { status: "PAYMENT_FAILED" });
              console.log(`Client ${client2.id} payment failed`);
            }
          }
          break;
        case "customer.subscription.created":
          const newSubscription = event.data.object;
          console.log(`Subscription created: ${newSubscription.id}`);
          break;
        case "customer.subscription.updated":
          const updatedSubscription = event.data.object;
          console.log(`Subscription updated: ${updatedSubscription.id} - Status: ${updatedSubscription.status}`);
          break;
        case "customer.subscription.deleted":
          const deletedSubscription = event.data.object;
          console.log(`Subscription cancelled: ${deletedSubscription.id}`);
          const clients2 = await storage.getClients();
          const client = clients2.find((c) => c.stripeSubscriptionId === deletedSubscription.id);
          if (client) {
            await storage.updateClient(client.id, { status: "CANCELLED" });
            console.log(`Client ${client.id} subscription cancelled`);
          }
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      res.json({ received: true });
    } catch (error) {
      console.error(`Webhook handler error:`, error);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  });
  const server = createServer(app2);
  return server;
}
__name(registerRoutes, "registerRoutes");

// server/index.ts
var app = express2();
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: false, limit: "50mb" }));
var log = /* @__PURE__ */ __name((message) => {
  const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
  console.log(`${timestamp2} ${message}`);
}, "log");
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: process.uptime()
  });
});
app.get("/", (req, res, next) => {
  if (req.headers["user-agent"]?.includes("curl")) {
    return res.status(200).json({ status: "ok" });
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  app.get("/marketing", (req, res) => {
    res.sendFile("marketing-site.html", { root: "." });
  });
  const server = await registerRoutes(app);
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (false) {
    const { setupVite } = await null;
    await setupVite(app, server);
  } else {
    const path2 = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = path2.dirname(fileURLToPath(import.meta.url));
    const publicPath = path2.join(__dirname, "public");
    app.use(express2.static(publicPath));
    app.get("*", (req, res) => {
      res.sendFile(path2.join(publicPath, "index.html"));
    });
  }
  const port = 5e3;
  const isWindows = process.platform === "win32";
  const serverOptions = isWindows ? { port } : { port, host: "0.0.0.0", reusePort: true };
  server.listen(serverOptions, () => {
    log(`serving on port ${port}`);
  });
})();
