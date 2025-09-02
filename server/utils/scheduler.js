const cron = require('node-cron');
const SubscriptionService = require('../services/subscriptionService');
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
    new winston.transports.File({ filename: 'logs/scheduler.log' }),
    new winston.transports.Console()
  ]
});

// Initialize subscription service
const subscriptionService = new SubscriptionService();

/**
 * Schedule subscription management tasks
 */
class SubscriptionScheduler {
  constructor() {
    this.tasks = [];
  }

  /**
   * Start all scheduled tasks
   */
  start() {
    logger.info('Starting subscription scheduler...');

    // Check for expired subscriptions every hour
    const expiredCheckTask = cron.schedule('0 * * * *', async () => {
      logger.info('Running expired subscriptions check...');
      try {
        await subscriptionService.checkExpiredSubscriptions();
        logger.info('Expired subscriptions check completed successfully');
      } catch (error) {
        logger.error('Error in expired subscriptions check:', { error: error.message });
      }
    }, {
      scheduled: false
    });

    this.tasks.push(expiredCheckTask);

    // Daily subscription analytics and health check (runs at 2 AM)
    const dailyAnalyticsTask = cron.schedule('0 2 * * *', async () => {
      logger.info('Running daily subscription analytics...');
      try {
        const analytics = await subscriptionService.getAnalytics();
        logger.info('Daily subscription analytics:', analytics);

        // Check for any concerning trends
        this.analyzeSubscriptionHealth(analytics);

      } catch (error) {
        logger.error('Error in daily subscription analytics:', { error: error.message });
      }
    }, {
      scheduled: false
    });

    this.tasks.push(dailyAnalyticsTask);

    // Weekly subscription report (runs every Sunday at 9 AM)
    const weeklyReportTask = cron.schedule('0 9 * * 0', async () => {
      logger.info('Generating weekly subscription report...');
      try {
        const analytics = await subscriptionService.getAnalytics();
        
        // Generate comprehensive weekly report
        const report = this.generateWeeklyReport(analytics);
        logger.info('Weekly subscription report:', report);

        // You could send this report via email to admins here
        // await this.sendWeeklyReport(report);

      } catch (error) {
        logger.error('Error generating weekly subscription report:', { error: error.message });
      }
    }, {
      scheduled: false
    });

    this.tasks.push(weeklyReportTask);

    // Monthly subscription cleanup (runs on the 1st of every month at 3 AM)
    const monthlyCleanupTask = cron.schedule('0 3 1 * *', async () => {
      logger.info('Running monthly subscription cleanup...');
      try {
        // Perform monthly cleanup tasks
        await this.performMonthlyCleanup();
        logger.info('Monthly subscription cleanup completed');
      } catch (error) {
        logger.error('Error in monthly subscription cleanup:', { error: error.message });
      }
    }, {
      scheduled: false
    });

    this.tasks.push(monthlyCleanupTask);

    // Start all tasks
    this.tasks.forEach(task => task.start());
    
    logger.info(`Started ${this.tasks.length} subscription management tasks`);
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    logger.info('Stopping subscription scheduler...');
    this.tasks.forEach(task => task.destroy());
    this.tasks = [];
    logger.info('Subscription scheduler stopped');
  }

  /**
   * Analyze subscription health and log warnings
   */
  analyzeSubscriptionHealth(analytics) {
    const { totalUsers, activeSubscriptions, conversionRate, planDistribution } = analytics;

    // Check conversion rate
    const conversionRateNum = parseFloat(conversionRate);
    if (conversionRateNum < 5) { // Less than 5% conversion rate
      logger.warn('Low conversion rate detected', { 
        conversionRate: conversionRateNum,
        threshold: 5
      });
    }

    // Check for concerning user distribution
    const freePlan = planDistribution.free || { count: 0 };
    const freePercentage = parseFloat(freePlan.percentage) || 0;
    
    if (freePercentage > 90) { // More than 90% on free plan
      logger.warn('Very high percentage of free users', {
        freePercentage,
        threshold: 90
      });
    }

    // Check total users growth (this would need historical data to be meaningful)
    if (totalUsers < 100) {
      logger.info('User base still growing', { totalUsers });
    }

    // Log subscription health summary
    logger.info('Subscription health summary', {
      totalUsers,
      activeSubscriptions,
      conversionRate: `${conversionRate}%`,
      healthStatus: conversionRateNum >= 5 && freePercentage <= 90 ? 'HEALTHY' : 'NEEDS_ATTENTION'
    });
  }

  /**
   * Generate weekly subscription report
   */
  generateWeeklyReport(analytics) {
    const { totalUsers, activeSubscriptions, conversionRate, planDistribution } = analytics;

    const report = {
      reportDate: new Date().toISOString(),
      summary: {
        totalUsers,
        activeSubscriptions,
        conversionRate: `${conversionRate}%`,
        revenue: this.calculateEstimatedRevenue(planDistribution)
      },
      planBreakdown: planDistribution,
      recommendations: this.generateRecommendations(analytics),
      trends: {
        // This would be more meaningful with historical data
        status: 'Data collection period',
        note: 'Historical trend analysis requires multiple data points'
      }
    };

    return report;
  }

  /**
   * Calculate estimated monthly revenue
   */
  calculateEstimatedRevenue(planDistribution) {
    let estimatedRevenue = 0;
    
    const premiumCount = (planDistribution.premium?.count || 0);
    const enterpriseCount = (planDistribution.enterprise?.count || 0);
    
    // Premium: $29.99/month, Enterprise: $99.99/month
    estimatedRevenue = (premiumCount * 29.99) + (enterpriseCount * 99.99);
    
    return {
      monthly: `$${estimatedRevenue.toFixed(2)}`,
      annual: `$${(estimatedRevenue * 12).toFixed(2)}`
    };
  }

  /**
   * Generate recommendations based on analytics
   */
  generateRecommendations(analytics) {
    const recommendations = [];
    const { conversionRate, planDistribution } = analytics;
    
    const conversionRateNum = parseFloat(conversionRate);
    const freePercentage = parseFloat(planDistribution.free?.percentage || 0);
    
    if (conversionRateNum < 5) {
      recommendations.push({
        type: 'CONVERSION',
        priority: 'HIGH',
        message: 'Conversion rate is below 5%. Consider improving onboarding flow or adjusting pricing.',
        action: 'Review user feedback and implement conversion optimization strategies'
      });
    }
    
    if (freePercentage > 85) {
      recommendations.push({
        type: 'FREEMIUM',
        priority: 'MEDIUM',
        message: 'High percentage of free users. Consider implementing feature limitations or trial periods.',
        action: 'Review freemium strategy and implement usage-based upgrade prompts'
      });
    }
    
    const premiumCount = planDistribution.premium?.count || 0;
    const enterpriseCount = planDistribution.enterprise?.count || 0;
    
    if (premiumCount > enterpriseCount * 10) {
      recommendations.push({
        type: 'UPSELLING',
        priority: 'MEDIUM',
        message: 'Many premium users could potentially upgrade to enterprise.',
        action: 'Implement targeted upselling campaigns for premium users'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'MONITORING',
        priority: 'LOW',
        message: 'Subscription metrics look healthy. Continue monitoring.',
        action: 'Maintain current strategies and monitor for changes'
      });
    }
    
    return recommendations;
  }

  /**
   * Perform monthly cleanup tasks
   */
  async performMonthlyCleanup() {
    try {
      // Clean up expired sessions, unused data, etc.
      logger.info('Performing monthly cleanup tasks...');
      
      // 1. Clean up expired subscriptions (redundant but good practice)
      await subscriptionService.checkExpiredSubscriptions();
      
      // 2. You could add more cleanup tasks here:
      // - Clean up old analytics data
      // - Remove unused payment methods
      // - Archive old business ideas
      // - Clean up log files
      
      logger.info('Monthly cleanup completed successfully');
      
    } catch (error) {
      logger.error('Error during monthly cleanup:', { error: error.message });
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.tasks.length > 0,
      tasksCount: this.tasks.length,
      tasks: [
        { name: 'Expired Subscriptions Check', schedule: 'Every hour' },
        { name: 'Daily Analytics', schedule: 'Daily at 2 AM' },
        { name: 'Weekly Report', schedule: 'Sunday at 9 AM' },
        { name: 'Monthly Cleanup', schedule: '1st of month at 3 AM' }
      ]
    };
  }
}

// Export singleton instance
const scheduler = new SubscriptionScheduler();

module.exports = scheduler;
