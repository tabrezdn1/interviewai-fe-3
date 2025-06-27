# InterviewAI

InterviewAI is a sophisticated web application that helps job seekers prepare for interviews through AI-powered simulations, personalized feedback, and performance analytics.

## 🚀 Features

- **AI Interview Simulation**: Practice with realistic interview scenarios tailored to specific roles and industries
- **Custom Interview Setup**: Configure interviews based on job role, experience level, and difficulty
- **Real-time Feedback**: Get instant analysis of your responses, communication skills, and presentation
- **Comprehensive Analytics**: Track your progress with detailed performance metrics and insights
- **Personalized Recommendations**: Receive tailored advice to improve your interview skills

## 📋 Tech Stack

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **State Management**: React Context and Zustand

## 🏗️ Project Structure

```
src/
├── components/        # UI components
│   ├── auth/          # Authentication components
│   ├── layout/        # Layout components (navbar, etc.)
│   └── ui/            # Reusable UI components
├── context/           # React context providers
├── data/              # Static data and mock data
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
├── pages/             # Application pages
├── services/          # API service functions
└── types/             # TypeScript type definitions
```

## ⚙️ Setup & Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/interview-ai.git
cd interview-ai
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. **Start the development server**

```bash
npm run dev
```

## 🗄️ Database Schema

The application uses Supabase with the following main tables:

- **profiles**: User profiles linked to auth.users
- **interviews**: Interview sessions created by users
- **interview_types**: Types of interviews (technical, behavioral, mixed)
- **questions**: Interview questions organized by type
- **interview_questions**: Junction table linking interviews to questions
- **feedback**: Detailed feedback for completed interviews

## 👨‍💻 Development

### Adding new features

1. Create components in the appropriate directories
2. Update services to interact with Supabase
3. Connect components to the data layer using hooks

### Database migrations

- Database migrations are located in `/supabase/migrations/`
- New migrations can be added to implement schema changes

## 🚀 Deployment

The application is configured for easy deployment to Netlify.

```bash
npm run build
```

This will generate optimized production build in the `dist` directory.

## 🧪 Testing

Run the test suite with:

```bash
npm run test
```

## 🔐 Authentication

The application supports multiple authentication methods:
- Email/password authentication
- OAuth providers (Google, GitHub)

## 🔄 API Integration

The application uses Supabase for backend functionality:
- User authentication and management
- Data storage and retrieval
- Real-time updates

## 📱 Responsive Design

The UI is fully responsive and works on:
- Desktop
- Tablets
- Mobile devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

Project Link: [https://github.com/yourusername/interview-ai](https://github.com/yourusername/interview-ai)