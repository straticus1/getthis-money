const express = require('express');
const SubscriptionService = require('../services/subscriptionService');
const { authenticate, checkSubscription } = require('../middleware/security');
const { validationResult } = require('express-validator');
const { body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Initialize subscription service
const subscriptionService = new SubscriptionService();

// Rate limiting for subscription endpoints
const subscriptionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 requests per IP per window
  message: 'Too many subscription requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Higher limit for webhooks
  message: 'Too many webhook requests',
  standardHeaders: true,
  legacyHeaders: false
});

// Validation schemas
const createPaymentIntentValidation = [
  body('planId').isIn(['premium', 'enterprise']).withMessage('Invalid plan ID'),
  body('paymentMethodId').optional().isString().withMessage('Payment method ID must be a string')
];

const createSubscriptionValidation = [
  body('planId').isIn(['premium', 'enterprise']).withMessage('Invalid plan ID'),
  body('paymentMethodId').isString().notEmpty().withMessage('Payment method ID is required')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route   GET /api/subscription/plans
 * @desc    Get available subscription plans
 * @access  Public
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = subscriptionService.getPlans();
    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans'
    });
  }
});

/**
 * @route   GET /api/subscription/status
 * @desc    Get user's subscription status
 * @access  Private
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const status = await subscriptionService.getSubscriptionStatus(req.user.id);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription status'
    });
  }
});

/**
 * @route   POST /api/subscription/payment-intent
 * @desc    Create payment intent for subscription
 * @access  Private
 */
router.post('/payment-intent', 
  subscriptionLimiter,
  authenticate,
  createPaymentIntentValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { planId, paymentMethodId } = req.body;
      const paymentIntent = await subscriptionService.createPaymentIntent(
        req.user.id,
        planId,
        paymentMethodId
      );

      res.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        }
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create payment intent'
      });
    }
  }
);

/**
 * @route   POST /api/subscription/subscribe
 * @desc    Create new subscription
 * @access  Private
 */
router.post('/subscribe',
  subscriptionLimiter,
  authenticate,
  createSubscriptionValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { planId, paymentMethodId } = req.body;
      const subscription = await subscriptionService.createSubscription(
        req.user.id,
        planId,
        paymentMethodId
      );

      res.json({
        success: true,
        message: 'Subscription created successfully',
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create subscription'
      });
    }
  }
);

/**
 * @route   POST /api/subscription/cancel
 * @desc    Cancel user's subscription
 * @access  Private
 */
router.post('/cancel',
  subscriptionLimiter,
  authenticate,
  async (req, res) => {
    try {
      const subscription = await subscriptionService.cancelSubscription(req.user.id);
      
      res.json({
        success: true,
        message: 'Subscription will be cancelled at the end of the current billing period',
        data: {
          subscriptionId: subscription.id,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to cancel subscription'
      });
    }
  }
);

/**
 * @route   POST /api/subscription/reactivate
 * @desc    Reactivate cancelled subscription
 * @access  Private
 */
router.post('/reactivate',
  subscriptionLimiter,
  authenticate,
  async (req, res) => {
    try {
      const subscription = await subscriptionService.reactivateSubscription(req.user.id);
      
      res.json({
        success: true,
        message: 'Subscription reactivated successfully',
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      });
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reactivate subscription'
      });
    }
  }
);

/**
 * @route   POST /api/subscription/webhook
 * @desc    Handle Stripe webhooks
 * @access  Public (but verified by Stripe signature)
 */
router.post('/webhook',
  webhookLimiter,
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Verify webhook signature
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      await subscriptionService.handleWebhook(event);
      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process webhook'
      });
    }
  }
);

/**
 * @route   GET /api/subscription/analytics
 * @desc    Get subscription analytics (admin only)
 * @access  Private/Admin
 */
router.get('/analytics',
  authenticate,
  async (req, res) => {
    try {
      // Check if user is admin (you might want to implement a proper role system)
      if (req.user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const analytics = await subscriptionService.getAnalytics();
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription analytics'
      });
    }
  }
);

/**
 * @route   POST /api/subscription/check-expired
 * @desc    Manual trigger to check expired subscriptions (admin only)
 * @access  Private/Admin
 */
router.post('/check-expired',
  authenticate,
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      await subscriptionService.checkExpiredSubscriptions();
      res.json({
        success: true,
        message: 'Expired subscriptions check completed'
      });
    } catch (error) {
      console.error('Error checking expired subscriptions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check expired subscriptions'
      });
    }
  }
);

/**
 * @route   GET /api/subscription/features
 * @desc    Get current user's subscription features
 * @access  Private
 */
router.get('/features', authenticate, async (req, res) => {
  try {
    const status = await subscriptionService.getSubscriptionStatus(req.user.id);
    res.json({
      success: true,
      data: {
        currentPlan: status.currentPlan,
        features: status.features,
        usage: status.usage,
        isActive: status.isActive
      }
    });
  } catch (error) {
    console.error('Error fetching subscription features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription features'
    });
  }
});

/**
 * @route   GET /api/subscription/upgrade-options
 * @desc    Get available upgrade options for current user
 * @access  Private
 */
router.get('/upgrade-options', authenticate, async (req, res) => {
  try {
    const status = await subscriptionService.getSubscriptionStatus(req.user.id);
    const allPlans = subscriptionService.getPlans();
    
    // Filter plans that are upgrades from current plan
    const upgrades = {};
    const currentPlan = status.currentPlan;
    
    if (currentPlan === 'free') {
      upgrades.premium = allPlans.premium;
      upgrades.enterprise = allPlans.enterprise;
    } else if (currentPlan === 'premium') {
      upgrades.enterprise = allPlans.enterprise;
    }
    
    res.json({
      success: true,
      data: {
        currentPlan,
        availableUpgrades: upgrades,
        recommendedPlan: currentPlan === 'free' ? 'premium' : 'enterprise'
      }
    });
  } catch (error) {
    console.error('Error fetching upgrade options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upgrade options'
    });
  }
});

module.exports = router;
