import nodemailer from 'nodemailer'
import * as env from '../config/env.config'
import * as logger from '../common/logger'
import User from '../models/User'

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface NotificationEmailData {
  userId: string
  title: string
  message: string
  actionUrl?: string
  actionText?: string
  type: string
  category: string
}

class EmailNotificationService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeTransporter()
  }

  private initializeTransporter() {
    if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) {
      logger.info('[EmailNotificationService] SMTP configuration missing, email notifications disabled')
      return
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT),
        secure: Number(env.SMTP_PORT) === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      })

      logger.info('[EmailNotificationService] Email transporter initialized')
    } catch (error) {
      logger.error('[EmailNotificationService] Failed to initialize email transporter:', error)
    }
  }

  private generateEmailTemplate(data: NotificationEmailData, language: string = 'en'): EmailTemplate {
    const { title, message, actionUrl, actionText, category } = data

    const baseUrl = env.FRONTEND_HOST || 'http://localhost:3000'
    const logoUrl = `${baseUrl}/logo.png`
    
    // Color scheme based on category
    const colors = {
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336'
    }
    
    const primaryColor = colors[category as keyof typeof colors] || colors.info

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid ${primaryColor}; }
          .logo { max-width: 150px; height: auto; }
          .content { padding: 30px 0; }
          .title { color: ${primaryColor}; font-size: 24px; margin-bottom: 20px; }
          .message { font-size: 16px; margin-bottom: 30px; }
          .action-button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: ${primaryColor}; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: bold;
            margin: 20px 0;
          }
          .footer { 
            border-top: 1px solid #eee; 
            padding: 20px 0; 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
          }
          .unsubscribe { color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="BookDress" class="logo">
          </div>
          <div class="content">
            <h1 class="title">${title}</h1>
            <div class="message">${message}</div>
            ${actionUrl && actionText ? `
              <div style="text-align: center;">
                <a href="${actionUrl}" class="action-button">${actionText}</a>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>BookDress - Premium Dress Rental</p>
            <p>Jenin, Palestine</p>
            <p class="unsubscribe">
              You received this email because you have an account with BookDress.
              <br>
              <a href="${baseUrl}/settings">Manage your notification preferences</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
      ${title}
      
      ${message}
      
      ${actionUrl && actionText ? `${actionText}: ${actionUrl}` : ''}
      
      ---
      BookDress - Premium Dress Rental
      Jenin, Palestine
      
      Manage your notification preferences: ${baseUrl}/settings
    `

    return {
      subject: title,
      html,
      text
    }
  }

  async sendNotificationEmail(data: NotificationEmailData): Promise<boolean> {
    if (!this.transporter) {
      logger.info('[EmailNotificationService] Email transporter not available')
      return false
    }

    try {
      // Get user email and preferences
      const user = await User.findById(data.userId).select('email fullName enableEmailNotifications language')

      if (!user) {
        logger.info(`[EmailNotificationService] User ${data.userId} not found`)
        return false
      }

      if (!user.email || !this.isValidEmail(user.email)) {
        logger.info(`[EmailNotificationService] User ${data.userId} has no valid email address`)
        return false
      }

      if (user.enableEmailNotifications === false) {
        logger.info(`[EmailNotificationService] User ${data.userId} has disabled email notifications`)
        return false
      }

      // Check if email is in quiet hours (if implemented)
      if (this.isQuietHours()) {
        logger.info(`[EmailNotificationService] Email not sent due to quiet hours for user ${data.userId}`)
        return false
      }

      const template = this.generateEmailTemplate(data, user.language || 'en')

      const mailOptions = {
        from: `"BookDress" <${env.SMTP_USER}>`,
        to: user.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
        replyTo: env.SMTP_FROM,
        headers: {
          'X-Notification-Type': data.type,
          'X-Notification-Category': data.category,
          'X-User-ID': data.userId
        }
      }

      const result = await this.transporter.sendMail(mailOptions)

      logger.info(`[EmailNotificationService] Email sent successfully to ${user.email}: ${result.messageId}`)
      return true
    } catch (error) {
      logger.error('[EmailNotificationService] Failed to send email:', error)
      return false
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isQuietHours(): boolean {
    // Check if current time is in quiet hours (e.g., 10 PM to 8 AM)
    const now = new Date()
    const hour = now.getHours()
    return hour >= 22 || hour < 8
  }

  async sendBookingConfirmationEmail(userId: string, bookingId: string, dressName: string, supplierName?: string): Promise<boolean> {
    const supplierInfo = supplierName ? ` from ${supplierName}` : ''
    return this.sendNotificationEmail({
      userId,
      title: 'Booking Confirmed',
      message: `Your booking for "${dressName}"${supplierInfo} has been confirmed! We're excited to help make your special occasion memorable.`,
      actionUrl: `${env.FRONTEND_HOST}/booking?b=${bookingId}`,
      actionText: 'View Booking Details',
      type: 'booking',
      category: 'success'
    })
  }

  async sendPaymentConfirmationEmail(userId: string, bookingId: string, amount: number, dressName: string, supplierName?: string): Promise<boolean> {
    const supplierInfo = supplierName ? ` from ${supplierName}` : ''
    return this.sendNotificationEmail({
      userId,
      title: 'Payment Received',
      message: `We've received your payment of $${amount} for "${dressName}"${supplierInfo}. Thank you for choosing BookDress!`,
      actionUrl: `${env.FRONTEND_HOST}/booking?b=${bookingId}`,
      actionText: 'View Booking Details',
      type: 'payment',
      category: 'success'
    })
  }

  async sendFittingReminderEmail(userId: string, bookingId: string, fittingDate: Date, dressName: string, supplierName?: string): Promise<boolean> {
    const formattedDate = fittingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const supplierInfo = supplierName ? ` from ${supplierName}` : ''
    return this.sendNotificationEmail({
      userId,
      title: 'Fitting Appointment Reminder',
      message: `Don't forget about your fitting appointment for "${dressName}"${supplierInfo} scheduled for ${formattedDate}. We look forward to seeing you!`,
      actionUrl: `${env.FRONTEND_HOST}/booking?b=${bookingId}`,
      actionText: 'View Appointment Details',
      type: 'fitting',
      category: 'info'
    })
  }

  async sendRentalReminderEmail(userId: string, bookingId: string, dressName: string, reminderType: 'pickup' | 'return', supplierName?: string): Promise<boolean> {
    const supplierInfo = supplierName ? ` from ${supplierName}` : ''

    const titles = {
      pickup: 'Dress Ready for Pickup',
      return: 'Dress Return Reminder'
    }

    const messages = {
      pickup: `Your dress "${dressName}"${supplierInfo} is ready for pickup! Please visit our boutique at your convenience.`,
      return: `This is a friendly reminder to return "${dressName}"${supplierInfo}. We hope you had a wonderful experience!`
    }

    return this.sendNotificationEmail({
      userId,
      title: titles[reminderType],
      message: messages[reminderType],
      actionUrl: `${env.FRONTEND_HOST}/booking?b=${bookingId}`,
      actionText: 'View Booking Details',
      type: 'reminder',
      category: reminderType === 'return' ? 'warning' : 'info'
    })
  }

  async sendReviewRequestEmail(userId: string, bookingId: string, dressName: string): Promise<boolean> {
    return this.sendNotificationEmail({
      userId,
      title: 'Share Your Experience',
      message: `We hope you loved wearing "${dressName}"! Please take a moment to share your experience and help other customers.`,
      actionUrl: `${env.FRONTEND_HOST}/booking?b=${bookingId}#review`,
      actionText: 'Write Review',
      type: 'review',
      category: 'info'
    })
  }

  async testEmailConfiguration(): Promise<boolean> {
    if (!this.transporter) {
      return false
    }

    try {
      await this.transporter.verify()
      logger.info('[EmailNotificationService] Email configuration test successful')
      return true
    } catch (error) {
      logger.error('[EmailNotificationService] Email configuration test failed:', error)
      return false
    }
  }
}

export default new EmailNotificationService()
