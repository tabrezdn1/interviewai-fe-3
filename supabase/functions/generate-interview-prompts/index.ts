import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { Configuration, OpenAIApi } from 'npm:openai@3.3.0';
import { Database } from '../_shared/database.types.ts'; 
import { TavusAPI, getTavusAPI, getReplicaForInterviewType } from '../_shared/tavus.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Generate Interview Prompts Function Initialized');

interface PromptGenerationRequest {
  interview_id: string;
  interview_type: string;
  role: string;
  company: string;
  experience_level: string;
  difficulty_level: string;
  user_name: string;
}

interface GeneratedPrompts {
  persona_name: string;
  persona_description: string;
  system_prompt: string;
  initial_message: string;
}

// Initialize OpenAI
const openAiKey = Deno.env.get('OPENAI_API_KEY');
// Check if OPENAI_API_KEY is set
if (!openAiKey) {
  console.warn('OPENAI_API_KEY environment variable is not set. Prompt generation will fail.');
}

// Check if TAVUS_API_KEY is set
const tavusApiKey = Deno.env.get('TAVUS_API_KEY');
if (!tavusApiKey) {
  console.warn('TAVUS_API_KEY environment variable is not set. Persona creation will fail.');
}

const configuration = new Configuration({ apiKey: openAiKey });
const openai = new OpenAIApi(configuration);

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Cache for storing previously generated prompts
const promptCache = new Map<string, GeneratedPrompts>();

// Function to generate a cache key
function generateCacheKey(request: PromptGenerationRequest): string {
  return `${request.interview_type}:${request.role}:${request.company}:${request.experience_level}:${request.difficulty_level}`;
}

// Function to check if we have a cached prompt
function getCachedPrompt(request: PromptGenerationRequest): GeneratedPrompts | null {
  const cacheKey = generateCacheKey(request);
  const memoryCache = promptCache.get(cacheKey);
  if (memoryCache) {
    console.log('Using in-memory cached prompts for:', cacheKey);
    return memoryCache;
  }
  return null;
}

// Function to save a prompt to the cache
function saveToCache(request: PromptGenerationRequest, prompts: GeneratedPrompts): void {
  const cacheKey = generateCacheKey(request);
  promptCache.set(cacheKey, prompts);
}

// Function to generate prompts using OpenAI
async function generatePrompts(request: PromptGenerationRequest): Promise<GeneratedPrompts> {
  try {
    // Check in-memory cache first
    const memoryCachedPrompts = getCachedPrompt(request);
    if (memoryCachedPrompts) {
      return memoryCachedPrompts;
    }
    
    // Check database cache
    console.log('Checking database cache for:', generateCacheKey(request));
    const { data: dbCachedPrompts, error: dbCacheError } = await supabase.rpc('get_cached_prompt', {
      p_interview_type: request.interview_type,
      p_role: request.role,
      p_company: request.company,
      p_experience_level: request.experience_level,
      p_difficulty_level: request.difficulty_level
    });
    
    if (dbCacheError) {
      console.error('Error checking database cache:', dbCacheError);
    } else if (dbCachedPrompts && dbCachedPrompts.length > 0 && dbCachedPrompts[0].is_cached) {
      console.log('Using database cached prompts for:', generateCacheKey(request));
      const prompts: GeneratedPrompts = {
        persona_name: dbCachedPrompts[0].persona_name || `${request.interview_type.charAt(0).toUpperCase() + request.interview_type.slice(1)} Interviewer`,
        persona_description: dbCachedPrompts[0].persona_description || `AI interviewer for ${request.role} position at ${request.company}`,
        system_prompt: dbCachedPrompts[0].system_prompt,
        initial_message: dbCachedPrompts[0].initial_message.replace('[PARTICIPANT_NAME]', request.user_name)
      };
      
      // Save to in-memory cache as well
      saveToCache(request, prompts);
      
      return prompts;
    }
    
    // If we get here, no cache hit was found
    console.log('No cached prompts found, generating new prompts');
    
    if (!openAiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Generating prompts for:', {
      interview_type: request.interview_type,
      role: request.role,
      company: request.company,
      experience_level: request.experience_level,
      difficulty_level: request.difficulty_level
    });

    // Create the system prompt for the LLM
    const systemPrompt = `You are an expert AI assistant specializing in creating interview prompts for AI video interviews. 
Your task is to generate four things:
1. A persona name for the AI interviewer (e.g., "Technical Lead at Google")
2. A persona description that explains the interviewer's role and background
3. A system prompt that will guide the AI interviewer's behavior and questions
4. An initial message that the AI interviewer will use to start the conversation

The interview details are:
- Interview Type: ${request.interview_type}
- Role: ${request.role}
- Company: ${request.company}
- Experience Level: ${request.experience_level}
- Difficulty Level: ${request.difficulty_level}

Make the prompts realistic, professional, and tailored to the specific role and company. Include relevant technical questions for technical interviews and behavioral questions for behavioral interviews.`;

    const userPrompt = `Please generate a persona name, persona description, system prompt, and initial message for an AI interviewer conducting a ${request.interview_type} interview for a ${request.role} position at ${request.company}. The candidate has ${request.experience_level} experience and the interview difficulty should be ${request.difficulty_level}.

Format your response as JSON with four fields:
- persona_name: A short, professional name for the AI interviewer (e.g., "Senior Engineering Manager at Amazon")
- persona_description: A brief description (2-3 sentences) of the interviewer's background and role
- system_prompt: A detailed guide (300-500 words) for the AI interviewer about how to conduct this specific interview, what topics to cover, what questions to ask, and how to evaluate responses
- initial_message: A personalized greeting (2-3 sentences) that the AI interviewer will use to start the conversation with the candidate. Include a placeholder [PARTICIPANT_NAME] that will be replaced with the actual name.`;

    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    // Parse the response
    const responseContent = completion.data.choices[0]?.message?.content || '';
    let parsedResponse: GeneratedPrompts;
    
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e);
      console.log('Raw response:', responseContent);
      
      // Attempt to extract the content using regex as fallback
      const personaNameMatch = responseContent.match(/persona_name["\s:]+(.+?)(?=persona_description|system_prompt|initial_message|$)/s);
      const personaDescriptionMatch = responseContent.match(/persona_description["\s:]+(.+?)(?=persona_name|system_prompt|initial_message|$)/s);
      const systemPromptMatch = responseContent.match(/system_prompt["\s:]+(.+?)(?=persona_name|persona_description|initial_message|$)/s);
      const initialMessageMatch = responseContent.match(/initial_message["\s:]+(.+?)(?=$)/s);
      
      parsedResponse = {
        persona_name: personaNameMatch ? personaNameMatch[1].trim().replace(/^["']|["']$/g, '') : 
          `${request.interview_type.charAt(0).toUpperCase() + request.interview_type.slice(1)} Interviewer at ${request.company}`,
        persona_description: personaDescriptionMatch ? personaDescriptionMatch[1].trim().replace(/^["']|["']$/g, '') : 
          `An experienced interviewer for ${request.role} positions with expertise in conducting ${request.interview_type} interviews.`,
        system_prompt: systemPromptMatch ? systemPromptMatch[1].trim().replace(/^["']|["']$/g, '') : 
          `You are conducting a ${request.interview_type} interview for a ${request.role} position at ${request.company}. Ask relevant questions based on the role and provide constructive feedback.`,
        initial_message: initialMessageMatch ? initialMessageMatch[1].trim().replace(/^["']|["']$/g, '') : 
          `Hello [PARTICIPANT_NAME], welcome to your interview for the ${request.role} position at ${request.company}. I'm looking forward to learning more about your experience and skills today.`
      };
    }

    // Replace placeholder with actual name
    parsedResponse.initial_message = parsedResponse.initial_message.replace('[PARTICIPANT_NAME]', request.user_name);

    // Save to in-memory cache
    saveToCache(request, parsedResponse);
    
    // Save to database cache
    try {
      const { error: cacheError } = await supabase.rpc('cache_prompt', {
        p_interview_type: request.interview_type,
        p_role: request.role,
        p_company: request.company,
        p_experience_level: request.experience_level,
        p_difficulty_level: request.difficulty_level,
        p_system_prompt: parsedResponse.system_prompt,
        p_initial_message: parsedResponse.initial_message,
        p_persona_name: parsedResponse.persona_name,
        p_persona_description: parsedResponse.persona_description
      });
      
      if (cacheError) {
        console.error('Error saving to database cache:', cacheError);
      } else {
        console.log('Successfully saved prompts to database cache');
      }
    } catch (dbError) {
      console.error('Exception when saving to database cache:', dbError);
    }

    return parsedResponse;
  } catch (error) {
    console.error('Error generating prompts:', error);
    throw error;
  }
}

// Function to create a Tavus persona
async function createTavusPersona(prompts: GeneratedPrompts): Promise<string> {
  try {
    console.log('Creating Tavus persona with prompts:', prompts);
    
    const tavusAPI = getTavusAPI();
    
    const personaRequest = {
      persona_name: prompts.persona_name,
      system_prompt: prompts.system_prompt,
    };
    
    const persona = await tavusAPI.createPersona(personaRequest);
    console.log('Tavus persona created:', persona);
    
    return persona.persona_id;
  } catch (error) {
    console.error('Error creating Tavus persona:', error);
    throw error;
  }
}

// Function to update interview with generated prompts and persona ID
async function updateInterviewWithPrompts(
  interviewId: string, 
  prompts: GeneratedPrompts,
  personaId: string | null = null,
  status: 'ready' | 'failed' = 'ready',
  errorMessage?: string,
  conversationId?: string,
  conversationUrl?: string
): Promise<void> {
  try {
    const updateData: any = {
      prompt_status: status,
      prompt_error: errorMessage || null
    };
    
    // If we have a persona ID, use it
    if (personaId) {
      updateData.tavus_persona_id = personaId;
    } else {
      // Otherwise, use the generated prompts directly
      updateData.llm_generated_context = prompts.system_prompt;
      updateData.llm_generated_greeting = prompts.initial_message;
    }
    
    // If we have conversation details, add them
    if (conversationId) {
      updateData.tavus_conversation_id = conversationId;
    }
    
    if (conversationUrl) {
      updateData.tavus_conversation_url = conversationUrl;
    }
    
    const { error } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', interviewId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating interview with prompts:', error);
    throw error;
  }
}

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
    const request: PromptGenerationRequest = await req.json();
    
    // Validate required fields
    if (!request.interview_id) {
      throw new Error('interview_id is required');
    }
    
    if (!request.interview_type) {
      throw new Error('interview_type is required');
    }
    
    if (!request.role) {
      throw new Error('role is required');
    }

    console.log('Received prompt generation request:', request);

    try {
      // Update interview status to generating
      await supabase
        .from('interviews')
        .update({ prompt_status: 'generating' })
        .eq('id', request.interview_id);
      
      // Generate prompts
      const prompts = await generatePrompts(request);
      
      // Create Tavus persona
      let personaId: string | null = null;
      let createPersonaError: Error | null = null;
      
      try {
        personaId = await createTavusPersona(prompts);
        console.log('Created Tavus persona:', personaId);

        // Now that we have a persona, create the Tavus conversation (Daily.co room)
        if (personaId) {
          try {
            console.log('Creating Tavus conversation with persona:', personaId);
            
            // Get the appropriate replica for this interview type
            const { replicaId } = getReplicaForInterviewType(request.interview_type);
            
            if (!replicaId) {
              throw new Error(`No replica configured for interview type: ${request.interview_type}`);
            }
            
            // Create conversation with green screen enabled
            const conversationRequest = {
              replica_id: replicaId,
              persona_id: personaId,
              conversation_name: `${request.role} Interview - ${new Date().toISOString()}`,
              properties: {
                apply_greenscreen: false,
                max_call_duration: 3600, // 1 hour
                participant_left_timeout: 60,
                participant_absent_timeout: 300,
                enable_recording: true,
                enable_transcription: true,
                language: 'English',
                conversational_context: prompts.system_prompt,
                custom_greeting: prompts.initial_message.replace('[PARTICIPANT_NAME]', request.user_name)
              }
            };
            
            const tavusAPI = getTavusAPI();
            const conversation = await tavusAPI.createConversation(conversationRequest);
            console.log('Tavus conversation created:', conversation);
            
            // Update interview with conversation details
            await updateInterviewWithPrompts(
              request.interview_id, 
              prompts, 
              personaId, 
              'ready', 
              null, 
              conversation.conversation_id, 
              conversation.conversation_url
            );
            
          } catch (conversationError) {
            console.error('Error creating Tavus conversation:', conversationError);
            
            // Still update with persona ID and prompts, but mark as failed for conversation
            await updateInterviewWithPrompts(
              request.interview_id, 
              prompts, 
              personaId, 
              'ready', 
              `Failed to create conversation: ${conversationError.message}`
            );
          }
        } else {
          // If persona creation failed, still update with prompts but mark as failed
          await updateInterviewWithPrompts(
            request.interview_id, 
            prompts, 
            null, 
            'failed', 
            createPersonaError?.message || 'Failed to create Tavus persona'
          );
        }
      } catch (error) {
        console.error('Error creating Tavus persona:', error);
        createPersonaError = error;
        
        // If persona creation failed, still update with prompts but mark as failed
        await updateInterviewWithPrompts(
          request.interview_id, 
          prompts, 
          null, 
          'failed', 
          createPersonaError?.message || 'Failed to create Tavus persona'
        );
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Prompts generated successfully',
        prompts,
        personaId
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      });
    } catch (error) {
      console.error('Error in prompt generation process:', error);
      
      // Update interview with failed status
      const fallbackPrompts = {
        persona_name: `${request.interview_type.charAt(0).toUpperCase() + request.interview_type.slice(1)} Interviewer`,
        persona_description: `AI interviewer for ${request.role} position at ${request.company}`,
        system_prompt: `You are conducting a ${request.interview_type} interview for a ${request.role} position at ${request.company}. Ask relevant questions based on the role and provide constructive feedback.`,
        initial_message: `Hello ${request.user_name}, welcome to your interview for the ${request.role} position at ${request.company}. I'm looking forward to learning more about your experience and skills today.`
      };
      
      await updateInterviewWithPrompts(
        request.interview_id, 
        fallbackPrompts, 
        null,
        'failed', 
        error.message || 'Failed to generate prompts'
      );
      
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Failed to generate prompts, using fallback',
        error: error.message,
        prompts: fallbackPrompts
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      });
    }
  } catch (e) {
    console.error('Error processing request:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    });
  }
});