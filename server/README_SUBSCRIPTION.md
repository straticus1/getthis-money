# GetThis.Money Subscription System

## Overview

The GetThis.Money platform now includes a comprehensive subscription system with three tiers:
- **Free**: 5 AI-generated business ideas per month
- **Premium**: 100 ideas per month + advanced features ($29.99/month)
- **Enterprise**: Unlimited ideas + all features ($99.99/month)

## Features Added

### 1. Subscription Service (`services/subscriptionService.js`)
- Stripe integration for payments
- Subscription lifecycle management
- Webhook handling for payment events
- Usage tracking and limits
- Analytics and reporting

### 2. Subscription Routes (`routes/subscription.js`)
- Payment intent creation
- Subscription management (create, cancel, reactivate)
- Plan information and status checking
- Analytics endpoints (admin only)
- Upgrade recommendations

### 3. Enhanced User Model
- Subscription tier tracking
- Usage limits and counters
- Stripe customer integration
- Feature access controls

### 4. Task Scheduler (`utils/scheduler.js`)
- Expired subscription monitoring
- Daily analytics reporting
- Weekly subscription reports
- Monthly cleanup tasks

### 5. Security Enhancements
- Enhanced JWT service with refresh tokens
- Advanced rate limiting per route
- Input validation and sanitization
- CORS and helmet security headers

### 6. AI Integration
- Real OpenAI GPT-4 integration
- Market data analysis
- Business plan generation
- Revenue estimation algorithms

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

#### Required Environment Variables

**Database:**
```bash
MONGODB_URI=mongodb://localhost:27017/getthis-money
```

**Stripe Configuration:**
```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PREMIUM_PRICE_ID=price_premium_plan_id
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_plan_id
```

**OpenAI Configuration:**
```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORG_ID=your_openai_org_id
```

**JWT Secrets:**
```bash
JWT_SECRET=your_super_secure_jwt_secret
JWT_REFRESH_SECRET=your_super_secure_refresh_secret
SESSION_SECRET=your_super_secure_session_secret
```

### 3. Stripe Setup

#### Create Products and Prices in Stripe Dashboard:

1. **Premium Plan**
   - Product: "Premium Plan"
   - Price: $29.99/month (recurring)
   - Copy the Price ID to `STRIPE_PREMIUM_PRICE_ID`

2. **Enterprise Plan**
   - Product: "Enterprise Plan"
   - Price: $99.99/month (recurring)
   - Copy the Price ID to `STRIPE_ENTERPRISE_PRICE_ID`

#### Configure Webhooks:

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://yourapp.com/api/subscription/webhook`
3. Select events:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Directory Structure

Create necessary directories:

```bash
mkdir -p logs uploads
```

### 5. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Subscription Management

```http
GET /api/subscription/plans
GET /api/subscription/status
GET /api/subscription/features
GET /api/subscription/upgrade-options
POST /api/subscription/payment-intent
POST /api/subscription/subscribe
POST /api/subscription/cancel
POST /api/subscription/reactivate
POST /api/subscription/webhook
```

### Business Ideas (Enhanced)

```http
GET /api/business-ideas
POST /api/business-ideas/generate
POST /api/business-ideas/generate-multiple
POST /api/business-ideas/business-canvas/:id
POST /api/business-ideas/business-plan/:id
POST /api/business-ideas/compare
POST /api/business-ideas/:id/save
DELETE /api/business-ideas/:id
```

### Authentication (Enhanced)

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/google
GET /api/auth/github
GET /api/auth/facebook
```

## Usage Examples

### Frontend Integration

#### Check User's Subscription Status
```javascript
const response = await fetch('/api/subscription/status', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { data } = await response.json();
console.log(data.currentPlan); // 'free', 'premium', 'enterprise'
console.log(data.features); // Available features
console.log(data.usage.remainingIdeas); // Ideas left this month
```

#### Create Subscription
```javascript
const response = await fetch('/api/subscription/subscribe', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    planId: 'premium',
    paymentMethodId: 'pm_card_visa' // From Stripe Elements
  })
});

const result = await response.json();
```

#### Generate Business Ideas (with limits)
```javascript
const response = await fetch('/api/business-ideas/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    industry: 'Technology',
    budget: '10000-50000',
    experience: 'Beginner',
    interests: ['AI', 'Web Development']
  })
});

// Returns business idea or error if limit exceeded
```

## Subscription Tiers & Features

### Free Tier
- 5 AI-generated ideas per month
- Basic templates
- Community support

### Premium Tier ($29.99/month)
- 100 AI-generated ideas per month
- Business model canvas generation
- PDF export capabilities
- Priority email support
- Idea comparison tools
- Advanced filtering

### Enterprise Tier ($99.99/month)
- Unlimited AI-generated ideas
- Full business plan generation
- White-label options
- API access
- Bulk operations
- Team collaboration features
- Dedicated support

## Monitoring & Analytics

### Automated Tasks
- **Hourly**: Check for expired subscriptions
- **Daily**: Generate analytics reports at 2 AM
- **Weekly**: Comprehensive subscription reports on Sundays
- **Monthly**: Cleanup and maintenance tasks

### Admin Analytics
Access subscription analytics (admin only):
```http
GET /api/subscription/analytics
```

Returns:
- Total users and conversion rates
- Revenue estimates
- Plan distribution
- Recommendations for improvement

## Security Features

### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Subscriptions: 10 requests per 15 minutes
- Webhooks: 100 requests per 15 minutes

### Authentication Security
- JWT with refresh tokens
- Secure session management
- OAuth2 integration
- Password hashing with bcrypt
- CORS protection
- Helmet security headers

### Input Validation
- Joi schema validation
- Express validator middleware
- Data sanitization
- File upload restrictions

## Development Notes

### Testing Stripe Integration

Use Stripe's test cards:
- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **Insufficient funds**: `4000000000009995`

### Environment Variables for Testing
```bash
STRIPE_SECRET_KEY=sk_test_...  # Use test keys
MOCK_STRIPE_PAYMENTS=true     # For development
MOCK_AI_RESPONSES=true        # To avoid OpenAI costs
```

### Database Indexes

Ensure these indexes exist for performance:
```javascript
// Users collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "stripeCustomerId": 1 })
db.users.createIndex({ "subscription": 1, "subscriptionExpires": 1 })

// Business ideas collection
db.businessideas.createIndex({ "userId": 1 })
db.businessideas.createIndex({ "createdAt": -1 })
db.businessideas.createIndex({ "industry": 1 })
```

## Troubleshooting

### Common Issues

1. **Stripe webhook verification fails**
   - Check `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure webhook endpoint is publicly accessible
   - Verify webhook events are properly configured

2. **OpenAI API errors**
   - Verify `OPENAI_API_KEY` is valid
   - Check API usage limits
   - Enable `MOCK_AI_RESPONSES=true` for testing

3. **Subscription limits not enforcing**
   - Check user's subscription status in database
   - Verify scheduler is running
   - Check logs for expired subscription cleanup

4. **JWT token issues**
   - Ensure both `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
   - Check token expiration times
   - Verify refresh token flow

### Logs

Monitor these log files:
- `logs/subscription-service.log`
- `logs/scheduler.log`
- `logs/ai-service.log`

## Deployment Considerations

### Production Environment
- Set `NODE_ENV=production`
- Use environment variables for all secrets
- Enable MongoDB authentication
- Use Redis for session storage
- Configure proper CORS origins
- Set up SSL/TLS certificates
- Configure webhook endpoints with HTTPS

### Scaling
- Consider MongoDB sharding for large datasets
- Implement Redis caching for frequently accessed data
- Use horizontal scaling with load balancers
- Monitor memory usage and optimize queries

### Monitoring
- Set up application monitoring (New Relic, DataDog)
- Configure error tracking (Sentry)
- Monitor Stripe dashboard for payment issues
- Set up alerts for critical errors

## Support

For technical support or questions:
- Check the logs for detailed error messages
- Review Stripe dashboard for payment issues
- Monitor subscription analytics for usage patterns
- Contact: coleman.ryan@gmail.com
