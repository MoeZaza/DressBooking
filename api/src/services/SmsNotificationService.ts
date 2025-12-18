import * as env from '../config/env.config'
import * as logger from '../common/logger'
import User from '../models/User'

// interface SmsMessage {
//   to: string
//   message: string
//   type: string
// }

interface SmsProvider {
  sendSms(to: string, message: string): Promise<boolean>
}

// Twilio SMS Provider
class TwilioProvider implements SmsProvider {
  private client: any

  constructor() {
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const twilio = require('twilio')
        this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
        logger.info('[SmsNotificationService] Twilio SMS provider initialized')
      } catch (error) {
        logger.error('[SmsNotificationService] Failed to initialize Twilio:', error)
      }
    }
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    if (!this.client) {
      logger.warn('[SmsNotificationService] Twilio client not available')
      return false
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: env.TWILIO_PHONE_NUMBER,
        to: to
      })

      logger.info(`[SmsNotificationService] SMS sent successfully via Twilio: ${result.sid}`)
      return true
    } catch (error) {
      logger.error('[SmsNotificationService] Failed to send SMS via Twilio:', error)
      return false
    }
  }
}

// AWS SNS SMS Provider
class AwsSnsProvider implements SmsProvider {
  private sns: any

  constructor() {
    if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_REGION) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const AWS = require('aws-sdk')
        AWS.config.update({
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
          region: env.AWS_REGION
        })
        this.sns = new AWS.SNS()
        logger.info('[SmsNotificationService] AWS SNS SMS provider initialized')
      } catch (error) {
        logger.error('[SmsNotificationService] Failed to initialize AWS SNS:', error)
      }
    }
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    if (!this.sns) {
      logger.warn('[SmsNotificationService] AWS SNS client not available')
      return false
    }

    try {
      const params = {
        Message: message,
        PhoneNumber: to,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          }
        }
      }

      const result = await this.sns.publish(params).promise()
      logger.info(`[SmsNotificationService] SMS sent successfully via AWS SNS: ${result.MessageId}`)
      return true
    } catch (error) {
      logger.error('[SmsNotificationService] Failed to send SMS via AWS SNS:', error)
      return false
    }
  }
}

class SmsNotificationService {
  private provider: SmsProvider | null = null

  constructor() {
    this.initializeProvider()
  }

  private initializeProvider() {
    // Try Twilio first, then AWS SNS
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      this.provider = new TwilioProvider()
    } else if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
      this.provider = new AwsSnsProvider()
    } else {
      logger.warn('[SmsNotificationService] No SMS provider configured')
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Add country code if not present (assuming Palestine +970)
    if (cleaned.startsWith('0')) {
      return '+970' + cleaned.substring(1)
    } else if (!cleaned.startsWith('+')) {
      return '+970' + cleaned
    }
    
    return cleaned.startsWith('+') ? cleaned : '+' + cleaned
  }

  private generateSmsMessage(type: string, data: any): string {
    const supplierInfo = data.supplierName ? ` from ${data.supplierName}` : ''

    const messages = {
      booking_confirmed: `BookDress: Your booking for "${data.dressName}"${supplierInfo} has been confirmed! Booking ID: ${data.bookingId}. Thank you for choosing us!`,

      payment_received: `BookDress: Payment of $${data.amount} received for "${data.dressName}"${supplierInfo}. Thank you! Booking ID: ${data.bookingId}`,

      fitting_reminder: `BookDress: Reminder - Your fitting appointment for "${data.dressName}"${supplierInfo} is tomorrow at ${data.time}. See you soon!`,

      pickup_ready: `BookDress: Your dress "${data.dressName}"${supplierInfo} is ready for pickup! Please visit us at your convenience. Booking ID: ${data.bookingId}`,

      return_reminder: `BookDress: Friendly reminder to return "${data.dressName}"${supplierInfo} by ${data.returnDate}. Thank you for choosing us!`,

      booking_cancelled: `BookDress: Your booking for "${data.dressName}"${supplierInfo} has been cancelled. If you have any questions, please contact us.`,

      payment_failed: `BookDress: Payment for "${data.dressName}"${supplierInfo} failed. Please try again or contact us for assistance. Booking ID: ${data.bookingId}`,

      review_request: `BookDress: We hope you loved "${data.dressName}"${supplierInfo}! Please share your experience by leaving a review. Thank you!`
    }

    return messages[type as keyof typeof messages] || `BookDress: ${data.message}`
  }

  async sendSmsNotification(userId: string, type: string, data: any): Promise<boolean> {
    if (!this.provider) {
      logger.warn('[SmsNotificationService] No SMS provider available')
      return false
    }

    try {
      // Get user phone number
      const user = await User.findById(userId).select('phone fullName enableSmsNotifications')
      
      if (!user || !user.phone) {
        logger.warn(`[SmsNotificationService] User ${userId} not found or has no phone number`)
        return false
      }

      if (user.enableSmsNotifications === false) {
        logger.info(`[SmsNotificationService] User ${userId} has disabled SMS notifications`)
        return false
      }

      const formattedPhone = this.formatPhoneNumber(user.phone)
      const message = this.generateSmsMessage(type, data)

      const success = await this.provider.sendSms(formattedPhone, message)
      
      if (success) {
        logger.info(`[SmsNotificationService] SMS sent successfully to ${formattedPhone}`)
      }
      
      return success
    } catch (error) {
      logger.error('[SmsNotificationService] Failed to send SMS notification:', error)
      return false
    }
  }

  async sendBookingConfirmationSms(userId: string, bookingId: string, dressName: string, supplierName?: string): Promise<boolean> {
    return this.sendSmsNotification(userId, 'booking_confirmed', {
      bookingId,
      dressName,
      supplierName
    })
  }

  async sendPaymentConfirmationSms(userId: string, bookingId: string, amount: number, dressName: string, supplierName?: string): Promise<boolean> {
    return this.sendSmsNotification(userId, 'payment_received', {
      bookingId,
      amount,
      dressName,
      supplierName
    })
  }

  async sendFittingReminderSms(userId: string, dressName: string, fittingTime: string, supplierName?: string): Promise<boolean> {
    return this.sendSmsNotification(userId, 'fitting_reminder', {
      dressName,
      time: fittingTime,
      supplierName
    })
  }

  async sendPickupReadySms(userId: string, bookingId: string, dressName: string, supplierName?: string): Promise<boolean> {
    return this.sendSmsNotification(userId, 'pickup_ready', {
      bookingId,
      dressName,
      supplierName
    })
  }

  async sendReturnReminderSms(userId: string, dressName: string, returnDate: string, supplierName?: string): Promise<boolean> {
    return this.sendSmsNotification(userId, 'return_reminder', {
      dressName,
      returnDate,
      supplierName
    })
  }

  async sendBookingCancelledSms(userId: string, dressName: string, supplierName?: string): Promise<boolean> {
    return this.sendSmsNotification(userId, 'booking_cancelled', {
      dressName,
      supplierName
    })
  }

  async sendPaymentFailedSms(userId: string, bookingId: string, dressName: string, supplierName?: string): Promise<boolean> {
    return this.sendSmsNotification(userId, 'payment_failed', {
      bookingId,
      dressName,
      supplierName
    })
  }

  async sendReviewRequestSms(userId: string, dressName: string, supplierName?: string): Promise<boolean> {
    return this.sendSmsNotification(userId, 'review_request', {
      dressName,
      supplierName
    })
  }

  async testSmsConfiguration(testPhoneNumber?: string): Promise<boolean> {
    if (!this.provider) {
      return false
    }

    try {
      const phone = testPhoneNumber || env.TEST_PHONE_NUMBER
      if (!phone) {
        logger.warn('[SmsNotificationService] No test phone number provided')
        return false
      }

      const formattedPhone = this.formatPhoneNumber(phone)
      const testMessage = 'Book Dress: This is a test SMS notification. Your SMS service is working correctly!'
      
      const success = await this.provider.sendSms(formattedPhone, testMessage)
      
      if (success) {
        logger.info('[SmsNotificationService] SMS configuration test successful')
      } else {
        logger.error('[SmsNotificationService] SMS configuration test failed')
      }
      
      return success
    } catch (error) {
      logger.error('[SmsNotificationService] SMS configuration test failed:', error)
      return false
    }
  }
}

export default new SmsNotificationService()
