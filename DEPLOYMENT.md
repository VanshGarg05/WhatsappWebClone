# WhatsApp Web Clone - Deployment Guide

This is a full-stack WhatsApp Web clone built with Next.js, MongoDB, and Socket.IO.

## Features

- ✅ User authentication (signup/login)
- ✅ Real-time messaging with Socket.IO
- ✅ WhatsApp-like UI design
- ✅ Message status indicators (sent, delivered, read)
- ✅ Online/offline status
- ✅ Responsive design
- ✅ MongoDB integration
- ✅ Webhook payload processing
- ✅ Demo data seeding

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Socket.IO, MongoDB
- **Authentication**: JWT tokens
- **Real-time Communication**: Socket.IO
- **Database**: MongoDB Atlas
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Demo Credentials

Use these credentials to test the application:
- Email: `john.smith@example.com`, Password: `password123`
- Email: `sarah.johnson@example.com`, Password: `password123`
- Email: `mike.wilson@example.com`, Password: `password123`
- Email: `emma.davis@example.com`, Password: `password123`
- Email: `alex.brown@example.com`, Password: `password123`

## Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd whatsapp-web-clone
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local` with:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whatsapp
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   SOCKET_URL=http://localhost:3000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
   NODE_ENV=development
   ```

3. **Seed demo data:**
   ```bash
   npm run seed
   ```

4. **Process sample payloads (optional):**
   ```bash
   npm run process-payloads ./payloads
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## Deployment Options

### 1. Vercel (Recommended)

Vercel provides the best support for Next.js applications.

**Step 1: Prepare for deployment**
```bash
npm run build
```

**Step 2: Deploy to Vercel**
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

**Step 3: Environment Variables**
Set these in Vercel dashboard:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whatsapp
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-app.vercel.app
SOCKET_URL=https://your-app.vercel.app
NEXT_PUBLIC_SOCKET_URL=https://your-app.vercel.app
NODE_ENV=production
```

**Important**: Socket.IO requires WebSocket support. Vercel supports this, but you may need to configure it properly.

### 2. Railway

Railway provides excellent support for full-stack applications.

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### 3. Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables

### 4. Heroku

1. Create a Heroku app: `heroku create your-app-name`
2. Set environment variables: `heroku config:set KEY=value`
3. Deploy: `git push heroku main`

## Production Considerations

### Database
- Use MongoDB Atlas for production
- Enable connection string whitelist for your deployment platform
- Consider using MongoDB connection pooling

### Socket.IO
- Some platforms have limitations with WebSocket connections
- Consider using sticky sessions for multi-instance deployments
- Monitor connection limits

### Environment Variables
- Never commit sensitive data to git
- Use platform-specific secret management
- Rotate secrets regularly

### Performance
- Enable Next.js static optimization
- Use CDN for static assets
- Monitor memory usage for Socket.IO connections

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token

### Users & Chat
- `GET /api/users` - Get all users
- `GET /api/chat/[userId]` - Get chat messages with specific user
- `POST /api/send-message` - Send message (demo only)

### WebSocket Events
- `connection` - User connects
- `sendMessage` - Send real-time message
- `receiveMessage` - Receive real-time message
- `userOnline/userOffline` - User status updates
- `typing/stopTyping` - Typing indicators

## File Structure

```
src/
├── app/                 # Next.js 13+ App Router
│   ├── api/            # API routes
│   ├── login/          # Login page
│   ├── signup/         # Signup page
│   └── page.tsx        # Home page
├── components/         # React components
├── contexts/           # React contexts (Auth, Socket)
├── lib/               # Utilities
├── models/            # MongoDB models
└── pages/api/         # Socket.IO handler
```

## Troubleshooting

### Common Issues

1. **Socket.IO not connecting**
   - Check CORS settings
   - Verify WebSocket support on deployment platform
   - Check authentication token

2. **MongoDB connection issues**
   - Verify connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure network access is configured

3. **Build failures**
   - Clear Next.js cache: `rm -rf .next`
   - Check TypeScript errors: `npm run lint`
   - Verify all dependencies are installed

### Debug Mode
Enable debug logging:
```bash
DEBUG=socket.io* npm run dev
```

## Support

If you encounter any issues:
1. Check the console for error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is accessible
4. Test Socket.IO connection separately

## License

This project is for educational/evaluation purposes.
