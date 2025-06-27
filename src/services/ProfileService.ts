import { supabase } from '../lib/supabase';

export interface ProfileUpdate {
  name?: string;
  email?: string;
  total_conversation_minutes?: number;
  used_conversation_minutes?: number;
  subscription_tier?: string;
  subscription_expires_at?: string;
}

export interface ConversationMinutes {
  total: number;
  used: number;
  remaining: number;
}

export interface UserSettings {
  profile: {
    id: string;
    name: string;
    email: string;
    subscription_tier?: string;
    total_conversation_minutes?: number;
    used_conversation_minutes?: number;
  };
}

export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function getProfileSettings(userId: string): Promise<UserSettings | null> {
  try {
    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) throw profileError;
    
    // Get user email from auth.users
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    return {
      profile: {
        ...profile,
        email: user?.email || ''
      }
    };
  } catch (error) {
    console.error('Error fetching profile settings:', error);
    return null;
  }
}

export async function updateProfileSettings(userId: string, updates: Partial<UserSettings>): Promise<boolean> {
  try {
    // Extract profile updates
    const profileUpdates: ProfileUpdate = {};
    
    if (updates.profile) {
      if (updates.profile.name) profileUpdates.name = updates.profile.name;
    }
    
    // Update profile if there are changes
    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await updateProfile(userId, profileUpdates);
      if (error) throw error;
    }
    
    // Update email if provided (requires special auth call)
    if (updates.profile?.email) {
      const { error } = await supabase.auth.updateUser({
        email: updates.profile.email
      });
      
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating profile settings:', error);
    return false;
  }
}

export async function updateProfile(userId: string, updates: ProfileUpdate) {
  try {
    // Update timestamp
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updatedData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
}

export async function getConversationMinutes(userId: string): Promise<ConversationMinutes | null> {
  try {
    console.log('👤 ProfileService.getConversationMinutes: Fetching for user', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('total_conversation_minutes, used_conversation_minutes')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    console.log('👤 ProfileService.getConversationMinutes: Success', {
      total: data.total_conversation_minutes || 0,
      used: data.used_conversation_minutes || 0,
      remaining: (data.total_conversation_minutes || 0) - (data.used_conversation_minutes || 0)
    });
    
    return {
      total: data.total_conversation_minutes || 0,
      used: data.used_conversation_minutes || 0,
      remaining: (data.total_conversation_minutes || 0) - (data.used_conversation_minutes || 0)
    };
  } catch (error) {
    console.error('Error fetching conversation minutes:', error);
    console.log('👤 ProfileService.getConversationMinutes: Error, returning null');
    return null;
  }
}

export async function updateConversationMinutes(userId: string, minutesToAdd: number): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('update_conversation_minutes', {
      user_id: userId,
      minutes_to_add: minutesToAdd
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating conversation minutes:', error);
    return false;
  }
}

export async function setTotalConversationMinutes(userId: string, newTotal: number): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('set_total_conversation_minutes', {
      user_id: userId,
      new_total: newTotal
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting total conversation minutes:', error);
    return false;
  }
}