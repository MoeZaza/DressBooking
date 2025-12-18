import * as env from '../config/env.config'
import { PaymentGateway } from ':bookcars-types'
import Stripe from 'stripe'
import axios from 'axios'

// Payment gateway interface
export interface IPaymentGateway {
  processPayment(amount: number, currency: string, description: string): Promise<any>
  createCheckoutSession(bookingId: string, customerId: string, amount: number): Promise<any>
  refundPayment(paymentId: string, amount: number): Promise<any>
}

// Stripe Gateway Implementation
class StripeGateway implements IPaymentGateway {
  private stripe: Stripe

  constructor() {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil',
    })
  }

  async processPayment(amount: number, currency: string, description: string) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe requires amount in cents
      currency,
      description,
    })
    return paymentIntent
  }
  
  async createCheckoutSession(bookingId: string, customerId: string, amount: number) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Booking #${bookingId}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${env.FRONTEND_HOST}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_HOST}/booking-cancel`,
      client_reference_id: bookingId,
      customer: customerId,
    })
    return session
  }

  async refundPayment(paymentId: string, amount: number) {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentId,
      amount: Math.round(amount * 100),
    })
    return refund
  }
}

// PayPal Gateway Implementation
class PayPalGateway implements IPaymentGateway {
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly baseUrl: string

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || ''
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || ''
    this.baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'
  }

  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')

      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      return response.data.access_token
    } catch (error) {
      console.error('PayPal access token error:', error)
      throw new Error('Failed to get PayPal access token')
    }
  }

  async processPayment(amount: number, currency: string, description: string) {
    try {
      const accessToken = await this.getAccessToken()

      const paymentData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toFixed(2)
          },
          description
        }],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              brand_name: 'BookDress',
              locale: 'en-US',
              landing_page: 'LOGIN',
              user_action: 'PAY_NOW'
            }
          }
        }
      }

      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'PayPal-Request-Id': `${Date.now()}-${Math.random()}`
          }
        }
      )

      return {
        success: true,
        id: response.data.id,
        status: response.data.status,
        links: response.data.links,
        approvalUrl: response.data.links?.find((link: any) => link.rel === 'approve')?.href
      }
    } catch (error: any) {
      console.error('PayPal payment processing error:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'PayPal payment failed',
        code: error.response?.data?.name || 'paypal_error'
      }
    }
  }

  async createCheckoutSession(bookingId: string, customerId: string, amount: number) {
    try {
      const accessToken = await this.getAccessToken()

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: bookingId,
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2)
          },
          description: `Dress Rental Booking #${bookingId}`,
          custom_id: customerId
        }],
        application_context: {
          brand_name: 'BookDress',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/booking/success?bookingId=${bookingId}`,
          cancel_url: `${process.env.FRONTEND_URL}/booking/cancel?bookingId=${bookingId}`
        }
      }

      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders`,
        orderData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'PayPal-Request-Id': `${bookingId}-${Date.now()}`
          }
        }
      )

      const approvalUrl = response.data.links?.find((link: any) => link.rel === 'approve')?.href

      return {
        success: true,
        id: response.data.id,
        url: approvalUrl,
        sessionId: response.data.id
      }
    } catch (error: any) {
      console.error('PayPal checkout session creation error:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create PayPal checkout session',
        code: error.response?.data?.name || 'session_creation_failed'
      }
    }
  }

  async refundPayment(paymentId: string, amount: number) {
    try {
      const accessToken = await this.getAccessToken()

      const refundData = {
        amount: {
          value: amount.toFixed(2),
          currency_code: 'USD'
        },
        note_to_payer: 'Refund for dress rental booking'
      }

      const response = await axios.post(
        `${this.baseUrl}/v2/payments/captures/${paymentId}/refund`,
        refundData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'PayPal-Request-Id': `refund-${paymentId}-${Date.now()}`
          }
        }
      )

      return {
        success: true,
        id: response.data.id,
        status: response.data.status,
        amount: response.data.amount,
        created: response.data.create_time
      }
    } catch (error: any) {
      console.error('PayPal refund processing error:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'PayPal refund failed',
        code: error.response?.data?.name || 'refund_failed'
      }
    }
  }
}

// Visa Gateway Implementation (Mock implementation for Visa card processing)
// Note: In production, this would integrate with a real payment processor that supports Visa
class VisaGateway implements IPaymentGateway {
  private readonly merchantId: string

  constructor() {
    this.merchantId = process.env.VISA_MERCHANT_ID || 'test_merchant_visa'
  }

  async processPayment(amount: number, currency: string, description: string) {
    try {
      // Mock Visa payment processing
      // In production, this would integrate with a real payment processor that supports Visa cards

      console.log(`Processing Visa payment: ${amount} ${currency} - ${description}`)

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock successful payment (90% success rate)
      const isSuccess = Math.random() > 0.1

      if (isSuccess) {
        const paymentId = `visa_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

        return {
          success: true,
          id: paymentId,
          status: 'succeeded',
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toUpperCase(),
          created: Math.floor(Date.now() / 1000),
          paymentMethod: {
            type: 'card',
            brand: 'visa',
            last4: '4242'
          },
          metadata: {
            merchantId: this.merchantId,
            integration: 'bookdress_rental',
            timestamp: new Date().toISOString()
          }
        }
      } else {
        return {
          success: false,
          error: 'Payment declined by issuer',
          code: 'card_declined'
        }
      }
    } catch (error: any) {
      console.error('Visa payment processing error:', error)

      return {
        success: false,
        error: 'Payment processing failed',
        code: 'processing_error'
      }
    }
  }

  async createCheckoutSession(bookingId: string, customerId: string, amount: number) {
    try {
      // Mock Visa checkout session creation
      console.log(`Creating Visa checkout session for booking: ${bookingId}, amount: ${amount}`)

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500))

      const sessionId = `visa_session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      const checkoutUrl = `${process.env.FRONTEND_URL}/visa-checkout?session=${sessionId}&booking=${bookingId}`

      return {
        success: true,
        id: sessionId,
        url: checkoutUrl,
        sessionId: sessionId,
        metadata: {
          bookingId,
          customerId,
          amount: Math.round(amount * 100),
          merchantId: this.merchantId,
          integration: 'bookdress_rental'
        }
      }
    } catch (error: any) {
      console.error('Visa checkout session creation error:', error)

      return {
        success: false,
        error: 'Failed to create Visa checkout session',
        code: 'session_creation_failed'
      }
    }
  }

  async refundPayment(paymentId: string, amount: number) {
    try {
      // Mock Visa refund processing
      console.log(`Processing Visa refund for payment: ${paymentId}, amount: ${amount}`)

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock successful refund (95% success rate)
      const isSuccess = Math.random() > 0.05

      if (isSuccess) {
        const refundId = `visa_refund_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

        return {
          success: true,
          id: refundId,
          amount: Math.round(amount * 100),
          status: 'succeeded',
          created: Math.floor(Date.now() / 1000),
          paymentId,
          metadata: {
            refundedAt: new Date().toISOString(),
            merchantId: this.merchantId,
            integration: 'bookdress_rental'
          }
        }
      } else {
        return {
          success: false,
          error: 'Refund processing failed',
          code: 'refund_declined'
        }
      }
    } catch (error: any) {
      console.error('Visa refund processing error:', error)

      return {
        success: false,
        error: 'Refund processing failed',
        code: 'refund_failed'
      }
    }
  }
}

// Factory class
export class PaymentGatewayFactory {
  static createGateway(type: PaymentGateway): IPaymentGateway | null {
    switch (type) {
      case PaymentGateway.Stripe:
        return new StripeGateway() // env.PAYMENT_GATEWAYS.STRIPE_ENABLED ? new StripeGateway() : null
      case PaymentGateway.PayPal:
        return new PayPalGateway() // env.PAYMENT_GATEWAYS.PAYPAL_ENABLED ? new PayPalGateway() : null
      case PaymentGateway.Visa:
        return new VisaGateway() // env.PAYMENT_GATEWAYS.VISA_ENABLED ? new VisaGateway() : null
      default:
        return null
    }
  }
}
