# GetThis.Money Installation Guide

This guide will help you set up the GetThis.Money business idea generator application on your local machine or server.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **MongoDB** (version 4.4 or higher)
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/getthis.money.git
cd getthis.money
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
npm install --legacy-peer-deps
```

#### Backend Dependencies
```bash
cd server
npm install
cd ..
```

### 3. Database Setup

#### Install MongoDB

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mongodb
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

#### Create Database
```bash
mongosh
use getthis-money
exit
```

### 4. Environment Configuration

#### Backend Environment
```bash
cd server
cp env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/getthis-money

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# OAuth2 Configuration (Optional for development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### 5. OAuth2 Setup (Optional)

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. Copy Client ID and Client Secret to `.env`

#### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Set Valid OAuth Redirect URIs: `http://localhost:5000/api/auth/facebook/callback`
5. Copy App ID and App Secret to `.env`

### 6. Start the Application

#### Start Backend Server
```bash
cd server
npm run dev
```

The backend will be available at `http://localhost:5000`

#### Start Frontend Application
```bash
# In a new terminal
npm start
```

The frontend will be available at `http://localhost:3000`

## Production Deployment

### 1. Build the Application

```bash
# Build frontend
npm run build

# The build files will be in the `build` directory
```

### 2. Environment Variables for Production

Update your `.env` file for production:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com
MONGODB_URI=mongodb://your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret
```

### 3. Deploy to Your Server

#### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start the application
cd server
pm2 start server.js --name "getthis-money"

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Using Docker
```bash
# Build Docker image
docker build -t getthis-money .

# Run container
docker run -p 5000:5000 --env-file .env getthis-money
```

## Troubleshooting

### Common Issues

#### MongoDB Connection Error
- Ensure MongoDB is running: `sudo systemctl status mongod`
- Check connection string in `.env`
- Verify database exists: `mongosh --eval "use getthis-money"`

#### Port Already in Use
- Change port in `.env` file
- Kill process using the port: `lsof -ti:5000 | xargs kill -9`

#### OAuth Errors
- Verify redirect URIs match exactly
- Check client IDs and secrets in `.env`
- Ensure OAuth apps are properly configured

#### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version`
- Use legacy peer deps: `npm install --legacy-peer-deps`

### Logs

#### Backend Logs
```bash
# If using PM2
pm2 logs getthis-money

# If running directly
cd server && npm run dev
```

#### Frontend Logs
Check browser console for frontend errors.

## Security Considerations

1. **Change Default Secrets**: Update JWT_SECRET and SESSION_SECRET
2. **Use HTTPS**: In production, always use HTTPS
3. **Environment Variables**: Never commit `.env` files
4. **Database Security**: Use MongoDB authentication
5. **Rate Limiting**: Configure appropriate rate limits
6. **CORS**: Set proper CORS origins for production

## Support

If you encounter issues:

1. Check the [README.md](README.md) for detailed documentation
2. Review [DOCUMENTATION.txt](DOCUMENTATION.txt) for technical details
3. Check [CHANGELOG.md](CHANGELOG.md) for recent changes
4. Create an issue on GitHub with detailed error information

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Author**: Ryan Coleman <coleman.ryan@gmail.com>

For more information, visit [GetThis.Money](https://getthis.money)
