# Tavus Integration Setup Guide

## Updated Multi-Replica Setup with Personas

This integration now supports **three different AI interviewers** for different interview rounds, each with their own **replica** and **persona**:

1. **HR Screening** - Initial screening with HR representative
2. **Technical Round** - Technical interview with engineering lead  
3. **Behavioral Round** - Behavioral interview with hiring manager

## What you need to do on Tavus:

### 1. Create a Tavus Account
1. Go to [Tavus.io](https://tavus.io) and sign up
2. Complete the onboarding process

### 2. Get Your API Key
1. Go to your Tavus Dashboard
2. Navigate to **Settings** → **API Keys**
3. Create a new API key
4. Copy the API key

### 3. Create Three Replicas (AI Avatars)
You need to create **three different replicas** for the different interview rounds:

#### Replica 1: HR Interviewer
1. Go to **Replicas** in your Tavus dashboard
2. Click **Create New Replica**
3. Name it "HR Interviewer" or similar
4. Upload a video that represents an HR professional
5. Wait for processing (10-30 minutes)
6. Note the `replica_id` for HR

#### Replica 2: Technical Interviewer  
1. Create another replica
2. Name it "Technical Lead" or similar
3. Upload a video that represents a technical interviewer
4. Note the `replica_id` for technical

#### Replica 3: Behavioral Interviewer
1. Create a third replica
2. Name it "Hiring Manager" or similar  
3. Upload a video that represents a senior manager
4. Note the `replica_id` for behavioral

### 4. Create Three Personas (AI Personalities)
You need to create **three different personas** for the different interview rounds:

#### Persona 1: HR Persona
1. Go to **Personas** in your Tavus dashboard
2. Click **Create New Persona**
3. Name it "HR Interviewer Persona" or similar
4. Configure the personality traits for HR screening:
   - Professional and welcoming
   - Focused on company culture fit
   - Asks about background and motivation
5. Note the `persona_id` for HR

#### Persona 2: Technical Persona
1. Create another persona
2. Name it "Technical Lead Persona" or similar
3. Configure the personality traits for technical interviews:
   - Analytical and detail-oriented
   - Focused on technical skills and problem-solving
   - Asks coding and system design questions
4. Note the `persona_id` for technical

#### Persona 3: Behavioral Persona
1. Create a third persona
2. Name it "Hiring Manager Persona" or similar
3. Configure the personality traits for behavioral interviews:
   - Leadership-focused and strategic
   - Focused on soft skills and experience
   - Asks situational and behavioral questions
4. Note the `persona_id` for behavioral

### 5. Configure Environment Variables
Add these to your `.env` file:

```env
VITE_TAVUS_API_KEY=your_actual_api_key_here

# Replica IDs
VITE_TAVUS_HR_REPLICA_ID=replica_id_for_hr_interviewer
VITE_TAVUS_TECHNICAL_REPLICA_ID=replica_id_for_technical_interviewer
VITE_TAVUS_BEHAVIORAL_REPLICA_ID=replica_id_for_behavioral_interviewer

# Persona IDs
VITE_TAVUS_HR_PERSONA_ID=persona_id_for_hr_interviewer
VITE_TAVUS_TECHNICAL_PERSONA_ID=persona_id_for_technical_interviewer
VITE_TAVUS_BEHAVIORAL_PERSONA_ID=persona_id_for_behavioral_interviewer
```

## New Interview Modes:

### 1. Single Round Interview
- User selects one specific interview type (technical, behavioral, etc.)
- Uses the appropriate replica and persona for that round
- Duration: 15-45 minutes depending on round type

### 2. Complete Interview Process
- **Multi-round interview** with all three interviewers
- Automatically progresses through: HR Screening → Technical → Behavioral
- Total duration: ~90 minutes (15 + 45 + 30 minutes)
- Each round uses a different AI interviewer with unique personality

## How the Integration Works:

### 1. API Request Format
The integration now sends both `replica_id` and `persona_id` as required by Tavus API v2:

```javascript
fetch('https://tavusapi.com/v2/conversations', {
  method: 'POST',
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "<api-key>"
  },
  body: JSON.stringify({
    "replica_id": "rf4703150052",
    "persona_id": "p5c4e72f7020"
  }),
})
```

### 2. Single Round Flow
1. User starts an interview session
2. App selects appropriate replica and persona based on interview type
3. Creates conversation with both IDs
4. User interacts with the specialized AI interviewer

### 3. Complete Interview Flow
1. User selects "Complete Interview" mode
2. **Round 1**: HR Screening (15 min)
   - Uses HR replica + HR persona for initial screening questions
3. **Round 2**: Technical Interview (45 min)  
   - Automatically switches to technical replica + technical persona
   - Focuses on coding/technical questions
4. **Round 3**: Behavioral Interview (30 min)
   - Switches to behavioral replica + behavioral persona
   - Focuses on soft skills and experience

### 4. Smart Replica + Persona Selection
- **HR Replica + Persona**: Used for screening rounds and general questions
- **Technical Replica + Persona**: Used for technical interviews and coding questions
- **Behavioral Replica + Persona**: Used for behavioral and management-style questions
- **Fallback**: If specific replica/persona not available, uses mock mode

## Features Included:

### ✅ Multi-Replica + Persona Support
- Different AI personalities for different interview types
- Automatic replica and persona selection based on interview round
- Seamless transitions between rounds with different personalities

### ✅ Interview Modes
- **Single Round**: Practice specific interview type with appropriate AI personality
- **Complete Process**: Full multi-round interview experience with different interviewers
- **Custom Selection**: Choose specific rounds to practice

### ✅ Progress Tracking
- Visual progress indicator for multi-round interviews
- Round completion tracking
- Automatic progression between rounds with different AI personalities

### ✅ Flexible Configuration
- Works with 1, 2, or 3 replica/persona pairs
- Graceful fallbacks if replicas/personas not available
- Mock mode for development/testing

## Setup Priority:

### Minimum Setup (1 Replica + 1 Persona):
- Create just the **Technical Replica + Technical Persona**
- Users can do single-round technical interviews
- Complete interview mode will be disabled

### Recommended Setup (3 Replicas + 3 Personas):
- Create all three replica/persona pairs for full experience
- Enables both single-round and complete interview modes
- Provides most realistic interview simulation with different AI personalities

## Testing:

### With Replicas + Personas:
1. Add all three replica IDs and persona IDs to `.env`
2. Test single-round interviews with each type
3. Test complete interview process
4. Verify automatic round transitions with different AI personalities

### Without Replicas/Personas (Mock Mode):
- App automatically detects missing replicas/personas
- Shows demo interface with simulated AI interviewers
- All functionality works except actual video/voice interaction

## Pricing Optimization:

The integration is designed to be cost-effective:
- **Conversations only start when needed**
- **Automatic cleanup** when rounds end
- **Efficient API usage** with proper error handling
- **Round-specific durations** to minimize usage

## Next Steps:

1. **Create your three replicas** on Tavus
2. **Create your three personas** on Tavus
3. **Add replica IDs and persona IDs** to your `.env` file  
4. **Test single-round interviews** first
5. **Test complete interview process**
6. **Customize AI prompts** for each persona type

The system will automatically detect which replicas and personas you have configured and enable the appropriate interview modes!

## Important Notes:

- **Both replica_id and persona_id are required** for Tavus API v2
- Each interview round needs its own replica + persona pair
- The persona defines the AI's personality and interview style
- The replica defines the AI's appearance and voice
- Make sure both are in "ready" status before testing