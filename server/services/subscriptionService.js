const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/subscription-service.log' }),
    new winston.transports.Console()
  ]
});

class SubscriptionService {
  constructor() {
    this.plans = {
      premium: {
        name: 'Premium',
        price: 2999, // $29.99 in cents
        stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
        features: {
          ideasPerMonth: 100,
          ideaComparison: true,
          businessCanvas: true,
          exportPDF: true,
          prioritySupport: true,
          teamCollaboration: true
        }
      },
      enterprise: {
        name: 'Enterprise',
        price: 9999, // $99.99 in cents
        stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
        features: {
          ideasPerMonth: -1, // unlimited
          ideaComparison: true,
          businessCanvas: true,
          businessPlan: true,
          exportPDF: true,
          prioritySupport: true,
          teamCollaboration: true,
          whiteLabel: true,
          bulkOperations: true,
          apiAccess: true
        }
      }
    };
  }

  /**
   * Get available subscription plans
   */
  getPlans() {
    return {
      free: {
        name: 'Free',
        price: 0,
        features: {
          ideasPerMonth: 5,
          aiGeneration: true,
          basicTemplates: true
        }
      },
      ...this.plans
    };
  }

  /**
   * Create Stripe customer
   */
  async createCustomer(user) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: {
          userId: user._id.toString()
        }
      });

      logger.info('Stripe customer created', { 
        userId: user._id, 
        customerId: customer.id 
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', { 
        error: error.message, 
        userId: user._id 
      });
      throw error;
    }
  }

  /**
   * Create payment intent for subscription
   */
  async createPaymentIntent(userId, planId, paymentMethodId = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const plan = this.plans[planId];
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await this.createCustomer(user);
        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await user.save();
      }

      const paymentIntentData = {
        amount: plan.price,
        currency: 'usd',
        customer: customerId,
        metadata: {
          userId: userId,
          planId: planId
        },
        automatic_payment_methods: {
          enabled: true
        }
      };

      if (paymentMethodId) {
        paymentIntentData.payment_method = paymentMethodId;
        paymentIntentData.confirm = true;
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      logger.info('Payment intent created', { 
        userId, 
        planId, 
        paymentIntentId: paymentIntent.id 
      });

      return paymentIntent;

    } catch (error) {
      logger.error('Failed to create payment intent', { 
        error: error.message, 
        userId, 
        planId 
      });
      throw error;
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(userId, planId, paymentMethodId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const plan = this.plans[planId];
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await this.createCustomer(user);
        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await user.save();
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: plan.stripePriceId
        }],
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId,
          planId: planId
        }
      });

      // Update user subscription
      await this.updateUserSubscription(userId, planId, subscription);

      logger.info('Subscription created', { 
        userId, 
        planId, 
        subscriptionId: subscription.id 
      });

      return subscription;

    } catch (error) {
      logger.error('Failed to create subscription', { 
        error: error.message, 
        userId, 
        planId 
      });
      throw error;
    }
  }

  /**
   * Update user subscription in database
   */
  async updateUserSubscription(userId, planId, stripeSubscription = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.subscription = planId;
      
      if (stripeSubscription) {
        user.stripeSubscriptionId = stripeSubscription.id;
        user.subscriptionExpires = new Date(stripeSubscription.current_period_end * 1000);
      } else {
        // For manual updates or free plans
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month from now
        user.subscriptionExpires = expiryDate;
      }

      await user.save();

      logger.info('User subscription updated', { 
        userId, 
        planId, 
        expiresAt: user.subscriptionExpires 
      });

      return user;

    } catch (error) {
      logger.error('Failed to update user subscription', { 
        error: error.message, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      // Cancel at period end
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      logger.info('Subscription cancelled', { 
        userId, 
        subscriptionId: subscription.id 
      });

      return subscription;

    } catch (error) {
      logger.error('Failed to cancel subscription', {
        error: error.message, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.stripeSubscriptionId) {
        throw new Error('No subscription found');
      }

      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false
      });

      logger.info('Subscription reactivated', { 
        userId, 
        subscriptionId: subscription.id 
      });

      return subscription;

    } catch (error) {
      logger.error('Failed to reactivate subscription', { 
        error: error.message, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const result = {
        userId,
        currentPlan: user.subscription,
        subscriptionExpires: user.subscriptionExpires,
        isActive: user.hasActiveSubscription(),
        features: user.getSubscriptionFeatures(),
        usage: {
          ideasGenerated: user.ideasGenerated,
          ideasSaved: user.ideasSaved,
          remainingIdeas: user.getRemainingIdeas()
        }
      };

      // Get Stripe subscription details if available
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          result.stripeStatus = subscription.status;
          result.cancelAtPeriodEnd = subscription.cancel_at_period_end;
          result.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        } catch (error) {
          logger.warn('Failed to fetch Stripe subscription', { 
            error: error.message, 
            userId 
          });
        }
      }

      return result;

    } catch (error) {
      logger.error('Failed to get subscription status', { 
        error: error.message, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(event) {
    try {
      logger.info('Processing Stripe webhook', { 
        eventId: event.id, 
        type: event.type 
      });

      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        default:
          logger.info('Unhandled webhook event', { type: event.type });
      }

    } catch (error) {
      logger.error('Webhook processing failed', { 
        error: error.message, 
        eventId: event.id 
      });
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSucceeded(invoice) {
    try {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const userId = subscription.metadata.userId;
      const planId = subscription.metadata.planId;

      await this.updateUserSubscription(userId, planId, subscription);

      logger.info('Payment succeeded, subscription updated', { 
        userId, 
        planId, 
        invoiceId: invoice.id 
      });

    } catch (error) {
      logger.error('Failed to handle payment success', { 
        error: error.message, 
        invoiceId: invoice.id 
      });
    }
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(invoice) {
    try {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const userId = subscription.metadata.userId;

      // Optionally downgrade to free plan or send notification
      logger.warn('Payment failed for subscription', { 
        userId, 
        invoiceId: invoice.id 
      });

      // You might want to implement grace period logic here

    } catch (error) {
      logger.error('Failed to handle payment failure', { 
        error: error.message, 
        invoiceId: invoice.id 
      });
    }
  }

  /**
   * Handle subscription updated
   */
  async handleSubscriptionUpdated(subscription) {
    try {
      const userId = subscription.metadata.userId;
      const planId = subscription.metadata.planId;

      await this.updateUserSubscription(userId, planId, subscription);

      logger.info('Subscription updated', { 
        userId, 
        planId, 
        subscriptionId: subscription.id 
      });

    } catch (error) {
      logger.error('Failed to handle subscription update', { 
        error: error.message, 
        subscriptionId: subscription.id 
      });
    }
  }

  /**
   * Handle subscription deleted
   */
  async handleSubscriptionDeleted(subscription) {
    try {
      const userId = subscription.metadata.userId;

      // Downgrade to free plan
      await this.updateUserSubscription(userId, 'free');

      logger.info('Subscription deleted, downgraded to free', { 
        userId, 
        subscriptionId: subscription.id 
      });

    } catch (error) {
      logger.error('Failed to handle subscription deletion', { 
        error: error.message, 
        subscriptionId: subscription.id 
      });
    }
  }

  /**
   * Check and update expired subscriptions
   */
  async checkExpiredSubscriptions() {
    try {
      const expiredUsers = await User.find({
        subscription: { $ne: 'free' },
        subscriptionExpires: { $lt: new Date() }
      });

      for (const user of expiredUsers) {
        user.subscription = 'free';
        user.subscriptionExpires = null;
        await user.save();

        logger.info('User subscription expired, downgraded to free', { 
          userId: user._id 
        });
      }

      if (expiredUsers.length > 0) {
        logger.info(`Processed ${expiredUsers.length} expired subscriptions`);
      }

    } catch (error) {
      logger.error('Failed to check expired subscriptions', { 
        error: error.message 
      });
    }
  }

  /**
   * Get subscription analytics
   */
  async getAnalytics() {
    try {
      const analytics = await User.aggregate([
        {
          $group: {
            _id: '$subscription',
            count: { $sum: 1 },
            totalIdeasGenerated: { $sum: '$ideasGenerated' },
            totalIdeasSaved: { $sum: '$ideasSaved' },
            avgLoginCount: { $avg: '$loginCount' }
          }
        }
      ]);

      const totalUsers = await User.countDocuments();
      const activeSubscriptions = await User.countDocuments({
        subscription: { $ne: 'free' },
        subscriptionExpires: { $gte: new Date() }
      });

      return {
        totalUsers,
        activeSubscriptions,
        planDistribution: analytics.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            percentage: ((item.count / totalUsers) * 100).toFixed(2),
            totalIdeasGenerated: item.totalIdeasGenerated,
            totalIdeasSaved: item.totalIdeasSaved,
            avgLoginCount: Math.round(item.avgLoginCount)
          };
          return acc;
        }, {}),
        conversionRate: ((activeSubscriptions / totalUsers) * 100).toFixed(2)
      };

    } catch (error) {
      logger.error('Failed to get subscription analytics', { 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = SubscriptionService;
