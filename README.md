# InterviewAI 🎯

InterviewAI is a cutting-edge web application designed to revolutionize interview preparation. Leveraging advanced AI, it provides job seekers with realistic interview simulations, personalized feedback, and comprehensive analytics to help them ace their next job interview.

## 🚀 Features

*   **AI Video Interview Simulation**: Practice with lifelike AI interviewers that look, sound, and respond like real humans. The greenscreen background has been addressed for a more natural appearance.
*   **Custom Interview Setup**: Configure interviews based on job role, company, experience level, and difficulty.
*   **Dynamic Prompt Generation**: AI-powered backend generates tailored interview questions and conversational contexts for each session.
*   **Stricter AI Feedback Logic**: Receive direct, critical, and actionable feedback designed to pinpoint weaknesses and drive significant improvement. Feedback is adjusted based on interview duration and difficulty level.
*   **Real-time Feedback & Analytics**: Get detailed insights into your performance, including communication, problem-solving, and technical skills.
*   **Conversation Minute Tracking**: Monitor your usage of AI interview minutes, with clear visibility into your subscription plan.
*   **Secure Authentication**: Sign in securely using email/password or OAuth providers (Google, GitHub).
*   **Billing & Subscription Management**: Seamlessly manage your subscription plans and view billing history via Stripe integration.
*   **Responsive Design**: A beautiful and intuitive user interface that works across all devices.

## 📋 Tech Stack

*   **Frontend**: React with TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Animation**: Framer Motion
*   **Backend & Database**: Supabase (PostgreSQL, Authentication, Edge Functions, Realtime)
*   **AI Video Interviewers**: Tavus API
*   **Large Language Models (LLM)**: OpenAI (GPT-4) for prompt generation and feedback analysis
*   **Payment Processing**: Stripe

## 🏗️ Project Structure

```
src/
├── components/        # Reusable UI components (auth, layout, dashboard, interview, feedback, ui)
│   ├── auth/          # Authentication forms and providers
│   ├── dashboard/     # Components specific to the dashboard
│   ├── feedback/      # Components for displaying feedback
│   ├── interview/     # Components for the interview session
│   └── layout/        # Navigation and structural components
│   └── ui/            # Shadcn/ui components
├── context/           # React context providers (e.g., AuthContext)
├── data/              # Static data and mock data
├── hooks/             # Custom React hooks (e.g., useAuth, useTavusConversation)
├── lib/               # Utility functions (Supabase client, general helpers)
├── pages/             # Application pages (Landing, Login, Dashboard, Setup, Interview, Feedback, Billing, Settings)
├── services/          # API service functions (InterviewService, ProfileService, StripeService)
├── types/             # TypeScript type definitions
└── vite-env.d.ts      # Vite environment type declarations
supabase/              # Supabase project configuration
├── functions/         # Supabase Edge Functions (Stripe webhooks, Tavus API calls, LLM integrations)
│   ├── _shared/       # Shared utilities for Edge Functions
│   ├── create-tavus-conversation/
│   ├── delete-tavus-persona/
│   ├── end-tavus-conversation/
│   ├── generate-interview-prompts/
│   ├── simulate-feedback/
│   ├── stripe-cancel/
│   ├── stripe-checkout/
│   ├── stripe-portal/
│   ├── stripe-subscription/
│   ├── stripe-webhook/
│   └── tavus-callback/
└── migrations/        # Database schema migrations
```

## ⚙️ Workflow

InterviewAI provides a comprehensive workflow for interview preparation, from user authentication to detailed feedback analysis.

### 1. User Authentication & Onboarding

Users can sign up or log in using email/password or OAuth (Google, GitHub). Supabase handles secure authentication, and a user profile is created or retrieved, including an initial allocation of conversation minutes.

```mermaid
graph TD
    A[User] --> B{Login / Sign Up};
    B -- Email/Password --> C[Auth Form];
    B -- OAuth (Google/GitHub) --> D[OAuth Provider];
    C --> E[Supabase Auth];
    D --> E;
    E --> F{Profile Creation / Retrieval};
    F --> G[Dashboard];
    F -- Initial Minutes --> H[User Profile in DB];
```

### 2. Dashboard & Interview Management

The dashboard provides an overview of interview activity, remaining conversation minutes, and lists all scheduled, completed, and canceled interviews. Users can manage their interviews, including editing, canceling, or deleting them.

```mermaid
graph TD
    A[Dashboard] --> B[Upcoming Interviews];
    A --> C[Completed Interviews];
    A --> D[Conversation Minutes];
    B -- Edit/Cancel/Delete --> E[Interview Details];
    C -- View Feedback --> F[Feedback Analysis];
    D -- Low Minutes --> G[Upgrade Plan];
```

### 3. Interview Setup

Users configure new interview sessions by selecting interview type, job role, company, experience level, difficulty, and duration. The system validates available conversation minutes before creating the interview.

```mermaid
graph TD
    A[User] --> B[Interview Setup Form];
    B -- Select Type, Role, Company, Experience, Difficulty, Duration --> C[Validate Conversation Minutes];
    C -- Insufficient Minutes --> D[Prompt Upgrade];
    C -- Sufficient Minutes --> E[Create Interview Record in DB];
    E --> F[Trigger Prompt Generation];
```

### 4. AI Interviewer Prompt Generation (Backend Integration)

When an interview is created, a Supabase Edge Function (`generate-interview-prompts`) is triggered. This function leverages OpenAI to generate a tailored persona, system prompt, and initial greeting for the AI interviewer. It also creates a Tavus Persona and Conversation (Daily.co room) and updates the interview record. The `apply_greenscreen` property is set to `false` during conversation creation for a more natural background.

```mermaid
sequenceDiagram
    participant Frontend
    participant Supabase_RPC[Supabase RPC]
    participant Edge_Function[generate-interview-prompts Edge Function]
    participant OpenAI[OpenAI API]
    participant Tavus_API[Tavus API]
    participant Supabase_DB[Supabase Database]

    Frontend->>Supabase_RPC: Call createInterview (RPC)
    Supabase_RPC->>Supabase_DB: Insert Interview Record (status: pending)
    Supabase_DB->>Edge_Function: Trigger generate-interview-prompts
    Edge_Function->>Supabase_DB: Check LLM Prompt Cache
    Supabase_DB--Cache Hit-->Edge_Function: Return Cached Prompt
    Edge_Function->>OpenAI: Request Prompt Generation (if no cache)
    OpenAI--Generated Prompts-->Edge_Function: Return Persona, System Prompt, Greeting
    Edge_Function->>Tavus_API: Create Tavus Persona
    Tavus_API--Persona ID-->Edge_Function: Return Persona ID
    Edge_Function->>Tavus_API: Create Tavus Conversation (Daily.co room, apply_greenscreen: false)
    Tavus_API--Conversation URL/ID-->Edge_Function: Return Conversation Details
    Edge_Function->>Supabase_DB: Update Interview Record (status: ready, with Tavus IDs/URLs)
    Edge_Function->>Supabase_DB: Cache Generated Prompt
```

### 5. Interview Session (Video Call)

Users connect to the AI interviewer via a video call. The AI interviewer, powered by Tavus, interacts with the user based on the dynamically generated prompts. The session tracks time, and users can end the call at any point.

```mermaid
graph TD
    A[User] --> B[Check Camera/Mic & Connection];
    B --> C[Connect to Tavus/Daily.co];
    C --> D[AI Interviewer Interaction];
    D -- Time Remaining / User Ends Call --> E[End Call];
    E --> F[Trigger Feedback Generation];
```

### 6. Feedback Generation (Backend Integration)

Upon interview completion, a Supabase Edge Function (`simulate-feedback`) is triggered. It fetches the conversation transcript and perception analysis from Tavus, then uses OpenAI to generate a comprehensive, critical feedback report. The feedback logic is designed to be stricter, providing more direct and actionable insights, and accounts for interview duration and difficulty level.

```mermaid
sequenceDiagram
    participant Frontend
    participant Supabase_DB[Supabase Database]
    participant Edge_Function[simulate-feedback Edge Function]
    participant Tavus_API[Tavus API]
    participant OpenAI[OpenAI API]

    Frontend->>Supabase_DB: Update Interview Status (processing)
    Supabase_DB->>Edge_Function: Trigger simulate-feedback
    Edge_Function->>Tavus_API: Fetch Conversation Transcript & Analysis
    Tavus_API--Transcript/Analysis-->Edge_Function: Return Data
    Edge_Function->>OpenAI: Request Feedback Generation (with transcript/analysis, stricter logic)
    OpenAI--Generated Feedback-->Edge_Function: Return Scores, Summary, Strengths, Improvements
    Edge_Function->>Supabase_DB: Update Feedback Record
    Edge_Function->>Supabase_DB: Update Interview Status (completed/failed)
```

### 7. Feedback Analysis Display

Users can view a detailed feedback report, including an overall score, summary, strengths, areas for improvement, and a skill-by-skill breakdown. The raw transcript and Tavus AI's perception analysis are also available for deeper insights.

```mermaid
graph TD
    A[Feedback Analysis Page] --> B[Overall Score];
    A --> C[Summary & Recommendations];
    A --> D[Skill Assessment Details];
    A --> E[Interview Transcript];
    A --> F[Tavus AI Analysis];
    B & C & D & E & F --> G[Actionable Insights for User Improvement];
```

### 8. Billing & Subscription Management (Stripe Integration)

InterviewAI integrates with Stripe for managing subscription plans, processing payments, and tracking conversation minutes. Webhooks ensure the user's profile and minute allocation are always up-to-date.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Supabase_RPC[Supabase RPC]
    participant Stripe_Checkout[Stripe Checkout]
    participant Stripe_Webhook[Stripe Webhook]
    participant Supabase_Edge_Function[stripe-webhook Edge Function]
    participant Supabase_DB[Supabase Database]

    User->>Frontend: Select Plan / Upgrade
    Frontend->>Supabase_RPC: Call createCheckoutSession
    Supabase_RPC->>Stripe_Checkout: Create Checkout Session
    Stripe_Checkout--Redirect-->User: Payment Page
    User->>Stripe_Checkout: Complete Payment
    Stripe_Checkout->>Stripe_Webhook: Send Event (e.g., checkout.session.completed)
    Stripe_Webhook->>Supabase_Edge_Function: Forward Event
    Supabase_Edge_Function->>Supabase_DB: Update Profile, Subscriptions, Invoices, Minutes
    Supabase_DB--Updated Data-->Frontend: (via polling/realtime)
    User->>Frontend: Manage Billing Portal
    Frontend->>Supabase_RPC: Call createPortalSession
    Supabase_RPC->>Stripe_Checkout: Create Portal Session
    Stripe_Checkout--Redirect-->User: Billing Portal
```

### 9. Settings

Users can update their profile information (name, email) and manage their account security, including changing their password.

```mermaid
graph TD
    A[Settings Page] --> B[Profile Information];
    A --> C[Security Settings];
    B -- Update Name/Email --> D[Supabase Profile Update];
    C -- Change Password --> E[Supabase Auth Update];
```

## 🔧 Technical Implementation Details

### Database Schema

The application uses a PostgreSQL database with the following key tables:

```mermaid
erDiagram
    profiles ||--o{ interviews : has
    interviews ||--o| feedback : receives
    interview_types ||--o{ interviews : categorizes
    experience_levels ||--o{ interviews : defines
    difficulty_levels ||--o{ interviews : sets
    profiles ||--o{ subscriptions : purchases
    subscription_plans ||--o{ subscriptions : defines
    profiles ||--o{ payment_methods : stores
    profiles ||--o{ invoices : receives
    
    profiles {
        uuid id PK
        string name
        string email
        int total_conversation_minutes
        int used_conversation_minutes
        string subscription_tier
        string stripe_customer_id
    }
    
    interviews {
        uuid id PK
        uuid user_id FK
        string title
        string company
        string role
        int interview_type_id FK
        int experience_level_id FK
        int difficulty_level_id FK
        string status
        int score
        timestamp scheduled_at
        timestamp completed_at
        int duration
        string tavus_conversation_id
        string tavus_persona_id
        string feedback_processing_status
    }
    
    feedback {
        int id PK
        uuid interview_id FK
        int overall_score
        string summary
        string[] strengths
        string[] improvements
        int technical_score
        int communication_score
        int problem_solving_score
        int experience_score
        string transcript
        jsonb tavus_analysis
    }
    
    interview_types {
        int id PK
        string type
        string title
        string description
        string icon
    }
    
    experience_levels {
        int id PK
        string value
        string label
    }
    
    difficulty_levels {
        int id PK
        string value
        string label
    }
    
    subscription_plans {
        string id PK
        string name
        string description
        int amount
        string interval_type
        int conversation_minutes
        jsonb features
    }
    
    subscriptions {
        string id PK
        uuid user_id FK
        string plan_id FK
        string status
        timestamp current_period_start
        timestamp current_period_end
    }
    
    payment_methods {
        string id PK
        uuid user_id FK
        string type
        string card_brand
        string card_last4
    }
    
    invoices {
        string id PK
        uuid user_id FK
        string subscription_id FK
        int amount_paid
        string status
    }
```

### Authentication Flow

The application uses Supabase Auth for secure authentication:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Supabase_Auth
    participant Supabase_DB
    
    User->>Frontend: Enter Credentials
    Frontend->>Supabase_Auth: Sign In/Sign Up Request
    Supabase_Auth-->>Frontend: Auth Response (JWT)
    Frontend->>Supabase_DB: Fetch User Profile
    Supabase_DB-->>Frontend: User Profile Data
    Frontend->>User: Redirect to Dashboard
```

### Interview Creation and Prompt Generation

The application uses a sophisticated prompt generation system:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Supabase_DB
    participant Edge_Function
    participant OpenAI
    participant Tavus
    
    User->>Frontend: Configure Interview
    Frontend->>Supabase_DB: Create Interview Record
    Supabase_DB->>Edge_Function: Trigger Prompt Generation
    
    alt Cache Hit
        Edge_Function->>Supabase_DB: Check Prompt Cache
        Supabase_DB-->>Edge_Function: Return Cached Prompt
    else Cache Miss
        Edge_Function->>OpenAI: Generate Prompts
        OpenAI-->>Edge_Function: Return Generated Prompts
        Edge_Function->>Supabase_DB: Cache Prompts
    end
    
    Edge_Function->>Tavus: Create Persona
    Tavus-->>Edge_Function: Return Persona ID
    Edge_Function->>Tavus: Create Conversation
    Tavus-->>Edge_Function: Return Conversation URL
    Edge_Function->>Supabase_DB: Update Interview Record
    Supabase_DB-->>Frontend: Updated Interview Data
    Frontend->>User: Ready to Start Interview
```

### Video Interview Session

The application integrates with Tavus API and Daily.co for video interviews:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Daily_SDK
    participant Tavus_API
    
    User->>Frontend: Start Interview
    Frontend->>Daily_SDK: Initialize Video Call
    Daily_SDK-->>Frontend: Video Call Ready
    Frontend->>User: Show Video Interface
    
    loop Interview Conversation
        User->>Daily_SDK: User Speaks
        Daily_SDK->>Tavus_API: Stream Audio/Video
        Tavus_API->>Tavus_API: Process with AI
        Tavus_API->>Daily_SDK: AI Response
        Daily_SDK->>User: AI Interviewer Speaks
    end
    
    User->>Frontend: End Interview
    Frontend->>Tavus_API: End Conversation
    Frontend->>Supabase_DB: Update Interview Status
```

### Feedback Generation Process

The application uses a sophisticated feedback generation system:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Supabase_DB
    participant Edge_Function
    participant Tavus_API
    participant OpenAI
    
    User->>Frontend: Complete Interview
    Frontend->>Supabase_DB: Update Status to Completed
    Supabase_DB->>Edge_Function: Trigger Feedback Generation
    
    Edge_Function->>Tavus_API: Request Transcript & Analysis
    Tavus_API-->>Edge_Function: Return Conversation Data
    
    Edge_Function->>OpenAI: Generate Feedback (with transcript)
    OpenAI-->>Edge_Function: Return Structured Feedback
    
    Edge_Function->>Supabase_DB: Store Feedback
    Supabase_DB-->>Frontend: Feedback Ready Notification
    Frontend->>User: Display Feedback Report
```

## ⚙️ Setup & Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/interview-ai.git
    cd interview-ai
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Set up environment variables**

    Create a `.env` file in the root directory with the following variables. You'll need to obtain keys from Supabase, Tavus, OpenAI, and Stripe.

    ```env
    # Supabase Configuration
    VITE_SUPABASE_URL=your-supabase-url
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

    # Tavus API Configuration
    VITE_TAVUS_API_KEY=your_tavus_api_key_here

    # Tavus Replica IDs for Different Interview Rounds (Obtain from Tavus Dashboard)
    VITE_TAVUS_HR_REPLICA_ID=your_hr_replica_id_here
    VITE_TAVUS_TECHNICAL_REPLICA_ID=your_technical_replica_id_here
    VITE_TAVUS_BEHAVIORAL_REPLICA_ID=your_behavioral_replica_id_here

    # Tavus Persona IDs for Different Interview Rounds (Obtain from Tavus Dashboard)
    VITE_TAVUS_HR_PERSONA_ID=your_hr_persona_id_here
    VITE_TAVUS_TECHNICAL_PERSONA_ID=your_technical_persona_id_here
    VITE_TAVUS_BEHAVIORAL_PERSONA_ID=your_behavioral_persona_id_here

    # OpenAI API Configuration
    OPENAI_API_KEY=your_openai_api_key_here

    # Stripe Configuration
    STRIPE_SECRET_KEY=your_stripe_secret_key_here
    STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
    STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
    ```

    **Note on Tavus Setup**: For the full experience, you need to create three distinct AI replicas and three personas on Tavus.io, one for each interview type (HR, Technical, Behavioral). Refer to `TAVUS_SETUP_GUIDE.md` for detailed instructions.

4.  **Start the development server**

    ```bash
    npm run dev
    ```

5.  **Set up Supabase**

    - Create a new Supabase project
    - Run the migrations in the `supabase/migrations` directory
    - Deploy the Edge Functions in the `supabase/functions` directory

6.  **Set up Stripe**

    - Create a Stripe account
    - Set up products and prices matching the subscription plans
    - Configure the webhook endpoint to point to your Supabase Edge Function

## 🚀 Deployment

The application is deployed at [https://interviewai.us](https://interviewai.us).

To build for production:

```bash
npm run build
```

This will generate an optimized production build in the `dist` directory.

## 🧪 Testing

The application includes comprehensive testing:

```bash
# Run unit tests
npm run test

# Run end-to-end tests
npm run test:e2e
```

## 🔒 Security Considerations

- **Authentication**: Secure JWT-based authentication via Supabase Auth
- **Data Protection**: Row-level security policies in PostgreSQL
- **API Security**: Edge Functions for secure API calls with service role keys
- **Payment Security**: Stripe handles all payment information, no sensitive data stored
- **Video Security**: Daily.co provides encrypted video sessions

## 🌟 Performance Optimizations

- **LLM Prompt Caching**: Reduces OpenAI API calls for similar interview configurations
- **Lazy Loading**: Components and routes are loaded only when needed
- **Database Indexing**: Strategic indexes for faster query performance
- **Edge Functions**: Serverless functions for scalable backend operations
- **CDN Deployment**: Static assets served via global CDN

## 🔄 CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

```mermaid
graph TD
    A[Push to Main Branch] --> B[Run Tests];
    B --> C{Tests Pass?};
    C -- Yes --> D[Build Production Assets];
    C -- No --> E[Notify Developers];
    D --> F[Deploy to Staging];
    F --> G[Run E2E Tests];
    G --> H{Tests Pass?};
    H -- Yes --> I[Deploy to Production];
    H -- No --> E;
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/your-feature-name`).
3.  Commit your changes (`git commit -m 'Add your feature'`).
4.  Push to the branch (`git push origin feature/your-feature-name`).
5.  Open a Pull Request.

## 🐛 Known Issues & Limitations

- Video quality may vary based on user's internet connection
- Some browsers may require additional permissions for camera/microphone access
- Free tier has limited conversation minutes (25 minutes)
- Feedback generation may take up to 5 minutes for longer interviews

## 🔮 Future Roadmap

- **Industry-Specific Templates**: Pre-configured interviews for different industries
- **Interview Recording & Playback**: Allow users to review their own interviews
- **Advanced Analytics Dashboard**: More detailed performance metrics over time
- **Mock Coding Interviews**: Interactive coding challenges during technical interviews
- **Multi-Language Support**: Interviews in languages other than English
- **AI Resume Review**: Automated resume feedback and optimization

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

Project Link: [https://interviewai.us](https://interviewai.us)

## 🙏 Acknowledgements

- [Tavus](https://tavus.io) - For the AI video interviewer technology
- [OpenAI](https://openai.com) - For the GPT-4 API
- [Supabase](https://supabase.com) - For the backend infrastructure
- [Stripe](https://stripe.com) - For payment processing
- [Daily.co](https://daily.co) - For video call infrastructure
- [Framer Motion](https://framer.com/motion) - For animations
- [Tailwind CSS](https://tailwindcss.com) - For styling
- [Vite](https://vitejs.dev) - For frontend build tooling