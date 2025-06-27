import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { Configuration, OpenAIApi } from 'npm:openai@3.3.0';
import { Database } from '../_shared/database.types.ts';
import { TavusAPI } from '../_shared/tavus.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Simulate Feedback Function Initialized');

interface FeedbackResponse {
  overall_score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  transcript?: string;
  tavus_analysis?: any;
  skill_assessment: {
    technical: {
      score: number;
      feedback: string;
    };
    communication: {
      score: number;
      feedback: string;
    };
    problem_solving: {
      score: number;
      feedback: string;
    };
    experience: {
      score: number;
      feedback: string;
    };
  };
}

interface InterviewDetails {
  id: string;
  title: string;
  company?: string | null;
  role: string;
  interview_types?: {
    type: string;
    title: string;
  };
  difficulty_levels?: {
    value: string;
    label: string;
  };
  experience_levels?: {
    value: string;
    label: string;
  };
  duration: number;
  llm_generated_context?: string;
  llm_generated_greeting?: string;
}

// Function to check if feedback already exists and is complete
async function checkExistingFeedback(interviewId: string): Promise<{exists: boolean, feedback?: any}> {
  try {
    console.log('Checking for existing feedback for interview ID:', interviewId);
    
    // Query the feedback table for this interview
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('interview_id', interviewId)
      .single();
    
    if (error) {
      console.log('No existing feedback found or error:', error.message);
      return { exists: false };
    }
    
    // Check if we have both transcript and analysis (or at least one of them)
    // This indicates the feedback is complete enough to reuse
    const hasTranscript = !!data.transcript;
    const hasAnalysis = !!data.tavus_analysis;
    
    console.log('Existing feedback check:', { 
      hasTranscript, 
      hasAnalysis, 
      overallScore: data.overall_score,
      hasStrengths: Array.isArray(data.strengths) && data.strengths.length > 0
    });
    
    // Consider feedback complete if it has a transcript or analysis, and has basic feedback data
    const isComplete = (hasTranscript || hasAnalysis) && 
                       data.overall_score > 0 && 
                       Array.isArray(data.strengths) && 
                       data.strengths.length > 0;
    
    if (isComplete) {
      console.log('Complete feedback found, will use cached version');
      return { exists: true, feedback: data };
    } else {
      console.log('Incomplete feedback found, will regenerate');
      return { exists: false };
    }
  } catch (error) {
    console.error('Error checking for existing feedback:', error);
    return { exists: false };
  }
}

// Initialize OpenAI
const openAiKey = Deno.env.get('OPENAI_API_KEY');
let openai: OpenAIApi | null = null;

if (openAiKey) {
  const configuration = new Configuration({ apiKey: openAiKey });
  openai = new OpenAIApi(configuration);
  console.log('OpenAI initialized successfully');
} else {
  console.warn('OPENAI_API_KEY not set, LLM feedback generation will be unavailable');
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Check if Tavus API key is available
const tavusApiKey = Deno.env.get('TAVUS_API_KEY');
let tavusAPI: TavusAPI | null = null;

if (tavusApiKey) {
  tavusAPI = new TavusAPI(tavusApiKey);
  console.log('Tavus API initialized successfully');
} else {
  console.warn('TAVUS_API_KEY not set, conversation transcript will not be available');
}

// Function to generate feedback using OpenAI with transcript
async function generateLLMFeedback(interviewDetails: InterviewDetails, transcript?: string): Promise<FeedbackResponse> {
  if (!openai) {
    console.warn('OpenAI not initialized, falling back to mock feedback');
    return generateMockFeedback(interviewDetails);
  }

  try {
    console.log('Generating LLM feedback for interview:', interviewDetails.id);

    // Create a detailed prompt for the LLM
    const systemPrompt = `You are an expert interview coach and evaluator. You need to provide detailed, constructive feedback for a job interview. 
The feedback should be honest but encouraging, highlighting both strengths and areas for improvement.

Interview details:
- Position: ${interviewDetails.role}
- Company: ${interviewDetails.company || 'Not specified'}
- Interview type: ${interviewDetails.interview_types?.type || 'General'}
- Experience level: ${interviewDetails.experience_levels?.label || 'Not specified'}
- Difficulty level: ${interviewDetails.difficulty_levels?.label || 'Standard'}

The interview context was:
${interviewDetails.llm_generated_context || 'A standard job interview for the specified role.'}`;

    const userPrompt = `Generate comprehensive interview feedback with the following components:
1. An overall score between 70-95
2. A detailed summary paragraph (150-200 words)
3. 5 specific strengths demonstrated during the interview
4. 5 specific areas for improvement
5. Skill assessment scores and feedback for:
   - Technical knowledge (score 0-100, 2-3 sentence feedback)
   - Communication skills (score 0-100, 2-3 sentence feedback)
   - Problem-solving ability (score 0-100, 2-3 sentence feedback)
   - Relevant experience (score 0-100, 2-3 sentence feedback)

${transcript ? `Here is the interview transcript to analyze:\n${transcript}` : 'No transcript is available for this interview, so provide general feedback based on the interview details.'}

Format your response as a JSON object with the following structure:
{
  "overall_score": number,
  "summary": "string",
  "strengths": ["string", "string", "string", "string", "string"],
  "improvements": ["string", "string", "string", "string", "string"],
  "skill_assessment": {
    "technical": {
      "score": number,
      "feedback": "string"
    },
    "communication": {
      "score": number,
      "feedback": "string"
    },
    "problem_solving": {
      "score": number,
      "feedback": "string"
    },
    "experience": {
      "score": number,
      "feedback": "string"
    }
  }
}

Make the feedback specific to a ${interviewDetails.role} position at ${interviewDetails.company || 'the company'}.`;

    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    });

    // Parse the response
    const responseContent = completion.data.choices[0]?.message?.content || '';
    let parsedResponse: FeedbackResponse;
    
    try {
      parsedResponse = JSON.parse(responseContent);
      console.log('Successfully parsed LLM feedback response');
    } catch (e) {
      console.error('Failed to parse LLM response as JSON:', e);
      console.log('Raw LLM response:', responseContent);
      
      // Fall back to mock feedback
      console.warn('Falling back to mock feedback due to parsing error');
      return generateMockFeedback(interviewDetails);
    }

    return parsedResponse;
  } catch (error) {
    console.error('Error generating LLM feedback:', error);
    return generateMockFeedback(interviewDetails);
  }
}

// Function to generate mock feedback data
function generateMockFeedback(interview: InterviewDetails): FeedbackResponse {
  console.log('Generating mock feedback data for interview:', interview.id);
  
  // Generate a random score between 70 and 95
  const overallScore = Math.floor(Math.random() * 26) + 70;
  
  // Generate random skill scores that average to the overall score
  const technicalScore = Math.min(100, Math.max(50, overallScore + (Math.random() * 20 - 10)));
  const communicationScore = Math.min(100, Math.max(50, overallScore + (Math.random() * 20 - 10)));
  const problemSolvingScore = Math.min(100, Math.max(50, overallScore + (Math.random() * 20 - 10)));
  const experienceScore = Math.min(100, Math.max(50, overallScore + (Math.random() * 20 - 10)));
  
  // Determine feedback tone based on score
  const tone = overallScore >= 85 ? 'excellent' : overallScore >= 75 ? 'good' : 'satisfactory';
  
  // Create mock feedback
  return {
    overall_score: overallScore,
    summary: `The candidate demonstrated ${tone} understanding of ${interview.role} responsibilities and technical requirements. Their responses showed ${tone === 'excellent' ? 'strong' : tone === 'good' ? 'solid' : 'adequate'} knowledge of key concepts and methodologies relevant to the position. The candidate articulated their thoughts ${tone === 'excellent' ? 'exceptionally well' : tone === 'good' ? 'clearly' : 'adequately'} and provided ${tone === 'excellent' ? 'comprehensive' : tone === 'good' ? 'relevant' : 'basic'} examples from their past experience. Overall, this was a ${tone} interview performance that demonstrates the candidate's potential for the ${interview.role} position.`,
    strengths: [
      `${tone === 'excellent' ? 'Exceptional' : tone === 'good' ? 'Strong' : 'Adequate'} technical knowledge of ${interview.interview_types?.type === 'technical' ? 'core technologies and frameworks' : 'industry concepts'}`,
      `${tone === 'excellent' ? 'Excellent' : tone === 'good' ? 'Good' : 'Satisfactory'} communication skills with clear and structured responses`,
      `${tone === 'excellent' ? 'Impressive' : tone === 'good' ? 'Solid' : 'Basic'} problem-solving approach with ${tone === 'excellent' ? 'innovative' : tone === 'good' ? 'effective' : 'standard'} solutions`,
      `Relevant experience that aligns well with the ${interview.role} position requirements`,
      `${tone === 'excellent' ? 'Outstanding' : tone === 'good' ? 'Good' : 'Adequate'} understanding of ${interview.company || 'company'} culture and values`
    ],
    improvements: [
      `Could provide more ${tone === 'excellent' ? 'detailed' : 'specific'} examples from past projects and achievements`,
      `${tone === 'excellent' ? 'Minor improvements in' : tone === 'good' ? 'Should work on' : 'Needs to improve'} explaining complex technical concepts in simpler terms`,
      `${tone === 'excellent' ? 'Could benefit from' : tone === 'good' ? 'Should consider' : 'Needs'} more focus on system design and architecture principles`,
      `${tone === 'excellent' ? 'Could enhance' : tone === 'good' ? 'Should improve' : 'Needs to develop'} responses to behavioral questions with more structured examples`,
      `Consider preparing more questions about the role and company to show deeper interest`
    ],
    skill_assessment: {
      technical: {
        score: Math.round(technicalScore),
        feedback: `The candidate demonstrated ${tone === 'excellent' ? 'exceptional' : tone === 'good' ? 'solid' : 'basic'} technical knowledge relevant to the ${interview.role} position. ${tone === 'excellent' ? 'Their understanding of core concepts was comprehensive and they showed impressive depth in specialized areas, including advanced topics and best practices.' : tone === 'good' ? 'They showed good understanding of most fundamental concepts and demonstrated practical experience, though could deepen knowledge in some advanced areas.' : 'They covered basic concepts adequately but would benefit from strengthening their technical foundation in key areas.'}`
      },
      communication: {
        score: Math.round(communicationScore),
        feedback: `Communication was ${tone === 'excellent' ? 'exceptional and highly professional' : tone === 'good' ? 'clear and effective' : 'adequate with room for improvement'}. The candidate ${tone === 'excellent' ? 'articulated complex ideas with precision, clarity, and confidence, demonstrating excellent listening skills and thoughtful responses' : tone === 'good' ? 'expressed ideas clearly, maintained good structure in their responses, and showed active engagement throughout the conversation' : 'conveyed basic ideas but sometimes lacked clarity in explanations and could improve their response structure'}.`
      },
      problem_solving: {
        score: Math.round(problemSolvingScore),
        feedback: `Problem-solving approach was ${tone === 'excellent' ? 'sophisticated, thorough, and highly analytical' : tone === 'good' ? 'methodical and effective' : 'straightforward but sometimes limited in scope'}. The candidate ${tone === 'excellent' ? 'demonstrated excellent analytical skills, creative thinking, and the ability to break down complex problems into manageable components with innovative solutions' : tone === 'good' ? 'showed good analytical thinking, systematic approach to problems, and ability to work through challenges logically' : 'applied basic problem-solving techniques but missed some optimization opportunities and could benefit from more structured approaches'}.`
      },
      experience: {
        score: Math.round(experienceScore),
        feedback: `The candidate's experience is ${tone === 'excellent' ? 'highly relevant, extensive, and directly applicable' : tone === 'good' ? 'relevant and adequate' : 'somewhat relevant but may need additional development'} for the ${interview.role} position. They ${tone === 'excellent' ? 'have clearly worked on similar projects, technologies, and challenges, demonstrating deep practical knowledge and leadership experience' : tone === 'good' ? 'have worked with most of the required technologies and shown good practical application of their skills in real-world scenarios' : 'have some experience with the required technologies but may need additional training and hands-on practice to fully meet the role requirements'}.`
      }
    }
  };
}

// Function to update database with feedback
async function updateDatabaseWithFeedback(
  interviewId: string,
  conversationId: string,
  feedback: FeedbackResponse
) {
  try {
    console.log('Updating database with feedback for interview ID:', interviewId);
    
    // Update interview status
    const { error: interviewError } = await supabase
      .from('interviews')
      .update({
        feedback_processing_status: 'completed',
        score: feedback.overall_score,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', interviewId);
    
    if (interviewError) {
      console.error('Error updating interview status:', interviewError);
      throw interviewError;
    }
    
    // Insert or update feedback
    const { error: feedbackError } = await supabase
      .from('feedback')
      .upsert({
        interview_id: interviewId,
        tavus_conversation_id: conversationId,
        overall_score: feedback.overall_score,
        summary: feedback.summary,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        technical_score: feedback.skill_assessment.technical.score,
        communication_score: feedback.skill_assessment.communication.score,
        problem_solving_score: feedback.skill_assessment.problem_solving.score,
        experience_score: feedback.skill_assessment.experience.score,
        technical_feedback: feedback.skill_assessment.technical.feedback,
        communication_feedback: feedback.skill_assessment.communication.feedback,
        problem_solving_feedback: feedback.skill_assessment.problem_solving.feedback,
        experience_feedback: feedback.skill_assessment.experience.feedback,
        transcript: feedback.transcript,
        tavus_analysis: feedback.tavus_analysis
      }, { 
        onConflict: 'interview_id',
        ignoreDuplicates: false
      });
    
    if (feedbackError) {
      console.error('Error inserting/updating feedback:', feedbackError);
      throw feedbackError;
    }
    
    console.log('Database updated successfully with feedback');
    return true;
  } catch (error) {
    console.error('Error updating database with feedback:', error);
    
    // Update interview status to failed
    try {
      await supabase
        .from('interviews')
        .update({
          feedback_processing_status: 'failed'
        })
        .eq('id', interviewId);
    } catch (updateError) {
      console.error('Error updating interview status to failed:', updateError);
    }
    
    throw error;
  }
}

// Function to mark feedback processing as failed
async function markFeedbackAsFailed(
  interviewId: string,
  errorMessage: string
) {
  try {
    console.log('Marking feedback as failed for interview ID:', interviewId);
    
    // Update interview status
    const { error: interviewError } = await supabase
      .from('interviews')
      .update({
        feedback_processing_status: 'failed',
        prompt_error: errorMessage
      })
      .eq('id', interviewId);
    
    if (interviewError) {
      console.error('Error updating interview status:', interviewError);
      throw interviewError;
    }
    
    console.log('Interview marked as failed successfully');
    return true;
  } catch (error) {
    console.error('Error marking feedback as failed:', error);
    throw error;
  }
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log('Received request data:', requestData);
    } catch (e) {
      console.error('Error parsing request JSON:', e);
      requestData = {};
    }
    
    const conversationId = requestData.conversation_id || 'mock-conversation-id';
    const interviewDetails = requestData.interview_details;
    
    console.log('Processing feedback simulation with conversation ID:', conversationId);
    
    if (!interviewDetails || !interviewDetails.id) {
      console.warn('No valid interview details provided, finding interview by conversation ID');
      
      // Try to find the interview by conversation ID
      const { data: interviews, error: fetchError } = await supabase
        .from('interviews')
        .select(`
          id,
          title,
          company,
          role,
          status,
          feedback_processing_status,
          interview_types (type, title),
          experience_levels (value, label),
          difficulty_levels (value, label),
          llm_generated_context,
          llm_generated_greeting
        `)
        .eq('tavus_conversation_id', conversationId)
        .limit(1);
      
      if (fetchError) {
        console.error('Error fetching interview by conversation ID:', fetchError);
        throw new Error(`Failed to find interview: ${fetchError.message}`);
      }
      
      if (!interviews || interviews.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No interview found with the provided conversation ID',
            error: 'interview_not_found'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          }
        );
      }
      
      // Use the found interview
      interviewDetails = interviews[0];
    }
    
    // Check if we already have complete feedback for this interview
    const { exists: feedbackExists, feedback: existingFeedback } = await checkExistingFeedback(interviewDetails.id);
    
    if (feedbackExists && existingFeedback) {
      console.log('Using existing cached feedback for interview:', interviewDetails.id);
      
      // Ensure the interview status is marked as completed
      try {
        await supabase
          .from('interviews')
          .update({
            feedback_processing_status: 'completed',
            status: 'completed',
            completed_at: existingFeedback.created_at || new Date().toISOString()
          })
          .eq('id', interviewDetails.id)
          .eq('feedback_processing_status', 'processing');
      } catch (error) {
        console.warn('Error updating interview status for cached feedback:', error);
        // Continue anyway since we have the feedback
      }
      
      // Format the existing feedback to match the expected response structure
      const cachedFeedback: FeedbackResponse = {
        overall_score: existingFeedback.overall_score,
        summary: existingFeedback.summary,
        strengths: existingFeedback.strengths || [],
        improvements: existingFeedback.improvements || [],
        transcript: existingFeedback.transcript,
        tavus_analysis: existingFeedback.tavus_analysis,
        skill_assessment: {
          technical: {
            score: existingFeedback.technical_score || 0,
            feedback: existingFeedback.technical_feedback || ''
          },
          communication: {
            score: existingFeedback.communication_score || 0,
            feedback: existingFeedback.communication_feedback || ''
          },
          problem_solving: {
            score: existingFeedback.problem_solving_score || 0,
            feedback: existingFeedback.problem_solving_feedback || ''
          },
          experience: {
            score: existingFeedback.experience_score || 0,
            feedback: existingFeedback.experience_feedback || ''
          }
        }
      };
      
      // Return the cached feedback
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Using cached feedback',
          interview_id: interviewDetails.id,
          feedback: cachedFeedback,
          cached: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // Update interview status to processing if not already
    try {
      const { error: updateError } = await supabase
        .from('interviews')
        .update({
          feedback_processing_status: 'processing'
        })
        .eq('id', interviewDetails.id)
        .eq('feedback_processing_status', 'pending');
      
      if (updateError) {
        console.error('Error updating interview status to processing:', updateError);
        // Continue anyway, as we can still generate feedback
      }
    } catch (error) {
      console.error('Error updating interview status:', error);
      // Continue anyway
    }
    
    // Try to get conversation transcript from Tavus if available
    let transcript: string | undefined;
    let perceptionAnalysis: any = undefined;
    if (tavusAPI && conversationId && !conversationId.startsWith('mock-')) {
      try {
        console.log('Fetching conversation details from Tavus API with verbose=true');
        const conversation = await tavusAPI.getConversation(conversationId, true);
        
        // Extract transcript from events array
        if (conversation.events && conversation.events.length > 0) {
          // Find the transcription_ready event
          const transcriptEvent = conversation.events.find(event => 
            event.event_type === 'application.transcription_ready'
          );
          
          if (transcriptEvent && transcriptEvent.properties.transcript) {
            // Convert transcript array to string format
            transcript = transcriptEvent.properties.transcript
              .map(entry => `${entry.role}: ${entry.content}`)
              .join('\n\n');
            console.log('Extracted transcript from events:', transcript ? `${transcript.substring(0, 100)}...` : 'No transcript available');
          } else {
            console.log('No transcript found in events');
          }
          
          // Find the perception_analysis event
          const analysisEvent = conversation.events.find(event => 
            event.event_type === 'application.perception_analysis'
          );
          
          if (analysisEvent && analysisEvent.properties.analysis) {
            perceptionAnalysis = analysisEvent.properties.analysis;
            console.log('Extracted perception analysis from events');
          } else {
            console.log('No perception analysis found in events');
          }
        } else {
          console.log('No events found in conversation response');
        }
        
        console.log('Received perception analysis from Tavus:', perceptionAnalysis ? 'Available' : 'Not available');
      } catch (error) {
        console.error('Error fetching conversation from Tavus:', error);
        console.log('Continuing without transcript');
      }
    }
    
    // Generate feedback using LLM if available, otherwise use mock
    let feedback: FeedbackResponse;
    try {
      console.log('Generating feedback for interview:', interviewDetails.id);
      feedback = await generateLLMFeedback(interviewDetails, transcript);
      
      // Add transcript and perception analysis to feedback
      feedback.transcript = transcript;
      feedback.tavus_analysis = perceptionAnalysis;
      
      // Update database with feedback
      await updateDatabaseWithFeedback(interviewDetails.id, conversationId, feedback);
      
      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          message: 'New feedback generated and stored successfully',
          interview_id: interviewDetails.id,
          feedback,
          cached: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      console.error('Error generating or storing feedback:', error);
      
      // Mark feedback as failed
      try {
        await markFeedbackAsFailed(
          interviewDetails.id, 
          error instanceof Error ? error.message : 'Unknown error generating feedback'
        );
      } catch (markError) {
        console.error('Error marking feedback as failed:', markError);
      }
      
      // Return error response
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to generate or store feedback',
          error: error instanceof Error ? error.message : 'Unknown error',
          interview_id: interviewDetails.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});