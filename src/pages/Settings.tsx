import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Shield, 
  Save, Eye, EyeOff, Check, AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProfileSettings } from '../services/ProfileService';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import Breadcrumb from '../components/layout/Breadcrumb';

const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    profile: {
      name: '',
      email: '',
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  // Load settings when user is available
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }


      setLoading(true);
      setError(null);
      
      try {
        const settings = await getProfileSettings(user.id);
        
        if (settings) {
          setFormData({
            profile: {
              name: settings.profile.name,
              email: settings.profile.email || user.email,
            },
            security: {
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            }
          });
        } else {
          // Fallback to user data if settings load fails
          setFormData({
            profile: {
              name: user.name || '',
              email: user.email || '',
            },
            security: {
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            }
          });
        }
      } catch {

        setError('Failed to load settings. Using default values.');
        // Fallback to user data
        setFormData({
          profile: {
            name: user.name || '',
            email: user.email || '',
          },
          security: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle nested form data
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    

    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Update the name field directly in the database
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          name: formData.profile.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setSuccess('Profile updated successfully');
        
        // Update the AuthContext user state
        updateUser({ name: formData.profile.name });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch {

      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    
    console.log('[Settings] Changing password');
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate current password first
      if (!formData.security.currentPassword) {
        throw new Error('Current password is required');
      }
      
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.security.currentPassword,
      });
      
      if (signInError) {
        throw new Error('Current password is incorrect');
      }
      
      // Validate new password
      if (formData.security.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }
      
      if (formData.security.newPassword !== formData.security.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.security.newPassword
      });
      
      if (updateError) {
        throw updateError;
      }
      
      setSuccess('Password updated successfully');
      
      // Clear form
      setFormData(prev => ({
        ...prev,
        security: {
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }
      }));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('[Settings] Error changing password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };



  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    console.log('[Settings] Loading settings data');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  console.log('[Settings] Rendering settings page for user:', user.email);

  return (
    <>
      <Breadcrumb />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-white dark:bg-slate-900/90 border border-gray-100 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700 font-medium dark:bg-blue-900/40 dark:text-blue-300'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card className="bg-white dark:bg-slate-900/90 border border-gray-100 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="dark:text-slate-100">Profile Information</CardTitle>
                  <CardDescription className="dark:text-slate-300">
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert className="mt-4 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                      <Check className="h-4 w-4" />
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-primary-100 dark:bg-blue-900 flex items-center justify-center text-primary-700 dark:text-blue-300 text-3xl font-medium">
                      {formData.profile.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-slate-200">Full Name</label>
                      <input
                        type="text"
                        name="profile.name"
                        value={formData.profile.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-slate-200">Email Address</label>
                      <input
                        type="email"
                        name="profile.email"
                        value={formData.profile.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-lg cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        Email address cannot be changed for security reasons
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <Card className="bg-white dark:bg-slate-900/90 border border-gray-100 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="dark:text-slate-100">Security Settings</CardTitle>
                  <CardDescription className="dark:text-slate-300">
                    Manage your password and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4 dark:text-slate-100">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-slate-200">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="security.currentPassword"
                            value={formData.security.currentPassword}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                            placeholder="Enter your current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-slate-200">New Password</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="security.newPassword"
                          value={formData.security.newPassword}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-slate-200">Confirm New Password</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="security.confirmPassword"
                          value={formData.security.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert className="mt-4 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                      <Check className="h-4 w-4" />
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleChangePassword}
                      disabled={saving || !formData.security.currentPassword || !formData.security.newPassword || !formData.security.confirmPassword}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Settings;