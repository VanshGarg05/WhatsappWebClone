# WhatsApp Web Clone

A full-stack WhatsApp Web clone built with Next.js, MongoDB, and TypeScript. This application processes WhatsApp Business API webhook payloads and displays them in a WhatsApp-like interface.

## 🚀 Features

- **Webhook Processing**: Process WhatsApp Business API webhook payloads
- **Real-time UI**: WhatsApp Web-like interface with message bubbles, status indicators, and conversations
- **Message Types**: Support for text, image, document, audio, video, and location messages
- **Send Messages**: Demo message sending functionality (saves to database only)
- **Status Updates**: Real-time message status updates (sent, delivered, read)
- **Responsive Design**: Mobile and desktop friendly
- **Modern Tech Stack**: Next.js 15, TypeScript, Tailwind CSS, MongoDB

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB (via Mongoose)
- **API**: Next.js API Routes
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account or local MongoDB instance
- The sample webhook payloads from the task

## 🔧 Installation & Setup

1. **Clone and install dependencies:**
   ```bash
   cd whatsapp-web-clone
   npm install
   ```

2. **Environment Variables:**
   Update the `.env.local` file with your MongoDB connection string:
   ```env
   MONGODB_URI=your_mongodb_atlas_connection_string
   PORT=3000
   NEXTAUTH_SECRET=your_secret_key_here
   NEXTAUTH_URL=http://localhost:3000
   SOCKET_URL=http://localhost:3001
   NODE_ENV=development
   ```

3. **Database Setup:**
   - Create a MongoDB Atlas cluster or use a local MongoDB instance
   - The app will automatically create the required collections and indexes

4. **Process Webhook Payloads (Task 1):**
   ```bash
   # Extract the provided webhook payloads to a directory, then run:
   npm run process-payloads path/to/your/payloads/directory
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open the application:**
   Visit `http://localhost:3000` in your browser

## 📁 Project Structure

```
whatsapp-web-clone/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── conversations/ # Get conversations
│   │   │   ├── messages/      # Get/update messages
│   │   │   ├── send-message/  # Send demo messages
│   │   │   └── webhook/       # Process webhooks
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx          # Main page
│   ├── components/            # React components
│   │   ├── Avatar.tsx        # User avatar component
│   │   ├── ChatContainer.tsx # Main chat interface
│   │   ├── MessageBubble.tsx # Individual message bubbles
│   │   └── Sidebar.tsx       # Conversations sidebar
│   ├── lib/                   # Utilities
│   │   ├── mongodb.ts        # Database connection
│   │   └── utils.ts          # Helper functions
│   └── models/               # Database models
│       └── ProcessedMessage.ts # Message schema
├── scripts/
│   └── process-payloads.js   # Payload processor script
└── README.md
```

## 🔗 API Endpoints

- `GET /api/conversations` - Get all conversations grouped by wa_id
- `GET /api/messages/[wa_id]` - Get messages for a conversation
- `PATCH /api/messages/[wa_id]` - Mark messages as read
- `POST /api/send-message` - Send a demo message
- `POST /api/webhook` - Process webhook payloads
- `GET /api/webhook` - Webhook verification endpoint

## 💾 Database Schema

The app uses a single `ProcessedMessage` collection with the following structure:

- **WhatsApp Fields**: `id`, `meta_msg_id`, `wa_id`, `from`, `to`
- **Message Content**: `type`, `text`, `image`, `document`, `audio`, `video`, `location`
- **Status Fields**: `status`, `timestamp`
- **Contact Info**: `contact.profile.name`, `contact.wa_id`
- **UI Fields**: `isFromUser`, `createdAt`, `updatedAt`

## 🎯 Usage

### Processing Webhook Payloads (Task 1)

1. Download and extract the provided webhook payloads
2. Run the processor script:
   ```bash
   npm run process-payloads /path/to/payloads/folder
   ```

### Using the Interface (Task 2)

1. Start the development server
2. View conversations in the left sidebar
3. Click on a conversation to view messages
4. Messages show proper status indicators and timestamps
5. Different message types are displayed appropriately

### Sending Messages (Task 3)

1. Select a conversation
2. Type a message in the input box
3. Press Enter or click the send button
4. Messages are saved to the database (demo only - not sent via WhatsApp)

## 🌟 Key Features

### WhatsApp-like UI
- Dark theme matching WhatsApp Web
- Message bubbles with proper alignment
- Status indicators (✓ sent, ✓✓ delivered, ✓✓ read)
- Responsive design for mobile and desktop

### Message Types Support
- **Text**: Basic text messages
- **Image**: Image messages with optional captions
- **Document**: File attachments with metadata
- **Audio**: Audio messages and voice notes
- **Video**: Video messages with captions
- **Location**: Location sharing with coordinates

### Real-time Updates
- Auto-refresh conversations every 30 seconds
- Real-time message status updates
- Toast notifications for actions

## 🚀 Deployment

The app is ready for deployment on platforms like:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Render**
- **Heroku**

Make sure to set the environment variables in your deployment platform.

## 📝 Notes

- This is a demo application - messages are not actually sent via WhatsApp
- The app simulates WhatsApp Business API webhook processing
- Status updates are simulated for demo messages
- Real-time features use polling (30-second intervals)

## 🤝 Environment Variables You Need

Please update these in your `.env.local` file:

1. **MONGODB_URI**: Your MongoDB connection string
2. **NEXTAUTH_SECRET**: A random secret for session security
3. **NEXTAUTH_URL**: Your app URL (http://localhost:3000 for dev)

## 🎨 UI/UX Features

- WhatsApp Web authentic look and feel
- Smooth animations and transitions
- Custom scrollbars
- Loading states and error handling
- Mobile-responsive design
- Toast notifications

The application successfully implements all task requirements:
- ✅ Webhook payload processing
- ✅ WhatsApp Web-like interface
- ✅ Message sending (demo)
- ✅ Ready for deployment

---

Built with ❤️ using Next.js and modern web technologies.
