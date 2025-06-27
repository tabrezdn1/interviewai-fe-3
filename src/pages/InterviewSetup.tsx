import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Code, Briefcase, User, Clock, Check, ChevronRight, ChevronLeft, 
  MessageSquare, Users, Phone, Plus, Lightbulb, 
  CheckCircle, ArrowRight, Smartphone, Laptop, Building, Sparkles,
  Calendar, CalendarDays, Save, Shield, Award
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { interviewTips } from '../data/feedback';
import { useAuth } from '../hooks/useAuth';
import { fetchInterviewTypes, fetchExperienceLevels, fetchDifficultyLevels } from '../lib/utils';
import { createInterview } from '../services/InterviewService';
import { getInterviewRounds } from '../lib/tavus';
import Breadcrumb from '../components/layout/Breadcrumb';
import BackButton from '../components/layout/BackButton';

interface InterviewType {
  id?: number;
  type: string;
  title: string;
  description: string;
  icon: string;
}

interface LevelOption {
  id?: number;
  value: string;
  label: string;
}

interface JobSuggestion {
  role: string;
  company?: string;
  icon: React.ReactNode;
}

interface InterviewFormData {
  interviewType: string;
  role: string;
  company?: string;
  experience: string;
  difficulty: string;
  duration: number;
  scheduledDate: string;
  scheduledTime: string;
}

const InterviewSetup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [interviewTypes, setInterviewTypes] = useState<InterviewType[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<LevelOption[]>([]);
  const [difficultyLevels, setDifficultyLevels] = useState<LevelOption[]>([]);
  const [jobSuggestions, setJobSuggestions] = useState<JobSuggestion[]>([]);
  
  // Set default date to tomorrow and time to 2 PM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];
  const defaultTime = '14:00';
  
  const [formData, setFormData] = useState<InterviewFormData>({
    interviewType: '',
    role: '',
    company: '',
    experience: '',
    difficulty: 'medium',
    duration: 20,
    scheduledDate: defaultDate,
    scheduledTime: defaultTime
  });

  // Generate job suggestions based on popular roles
  const generateJobSuggestions = useCallback(() => {
    const suggestions: JobSuggestion[] = [
      { 
        role: 'Frontend Developer', 
        company: 'Google',
        icon: <Code className="h-5 w-5 text-blue-500" />
      },
      { 
        role: 'Product Manager', 
        company: 'Amazon',
        icon: <Briefcase className="h-5 w-5 text-green-500" />
      },
      { 
        role: 'Data Scientist', 
        company: 'Microsoft',
        icon: <Laptop className="h-5 w-5 text-purple-500" />
      },
      { 
        role: 'UX Designer', 
        company: 'Apple',
        icon: <Smartphone className="h-5 w-5 text-gray-500" />
      },
      { 
        role: 'Software Engineer', 
        company: 'Netflix',
        icon: <Code className="h-5 w-5 text-red-500" />
      },
      { 
        role: 'DevOps Engineer', 
        company: 'Spotify',
        icon: <Code className="h-5 w-5 text-green-500" />
      },
      { 
        role: 'Marketing Manager', 
        company: 'Meta',
        icon: <Building className="h-5 w-5 text-blue-500" />
      },
      { 
        role: 'Software Development Engineer',
        company: 'Amazon',
        icon: <Code className="h-5 w-5 text-indigo-500" />
      }
    ];
    
    // Shuffle and take first 6
    const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
    setJobSuggestions(shuffled.slice(0, 6));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeSelect = (type: string) => {
    setFormData(prev => ({ ...prev, interviewType: type }));
  };

  const handleJobSuggestionSelect = (suggestion: JobSuggestion) => {
    setFormData(prev => ({
      ...prev,
      role: suggestion.role,
      company: suggestion.company || prev.company
    }));
  };

  const isStepValid = () => {
    if (step === 1) return !!formData.interviewType;
    if (step === 2) return !!formData.role && !!formData.company && !!formData.experience;
    if (step === 3) return !!formData.scheduledDate && !!formData.scheduledTime && !!formData.difficulty;
    return true;
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Submit and navigate to interview
      setSubmitting(true);
      try {
        if (user) {
          const interview = await createInterview(user.id, formData);
          navigate(`/interview/${interview.id}`);
        }
      } catch (error) {
        console.error('Error creating interview:', error);
        // Handle error - show message to user
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleSaveAndSchedule = async () => {
    setSaving(true);
    try {
      if (user) {
        await createInterview(user.id, formData);
        // Redirect to dashboard after saving
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error saving interview:', error);
      // Handle error - show message to user
    } finally {
      setSaving(false);
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Get icon component by name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Code':
        return <Code className="h-6 w-6" />;
      case 'User':
        return <User className="h-6 w-6" />;
      case 'Briefcase':
        return <Briefcase className="h-6 w-6" />;
      case 'Phone':
        return <Phone className="h-6 w-6" />;
      default:
        return <Code className="h-6 w-6" />;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [types, expLevels, diffLevels] = await Promise.all([
          fetchInterviewTypes(),
          fetchExperienceLevels(),
          fetchDifficultyLevels()
        ]);
        
        setInterviewTypes(types);
        setExperienceLevels(expLevels);
        setDifficultyLevels(diffLevels);
        
        // Generate job suggestions
        generateJobSuggestions();
      } catch (error) {
        console.error('Error loading setup data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [generateJobSuggestions]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container-custom mx-auto">
        <div className="hidden md:block">
          <Breadcrumb />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <BackButton className="mb-4" />
          <h1 className="text-3xl font-bold mb-2">Setup Interview</h1>
          <p className="text-gray-600">
            Configure your AI interview session based on your needs
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="border-0 shadow-md">
                <CardContent className="p-6 md:p-8">
                  {/* Progress indicator */}
                  <div className="mb-10">
                    <div className="relative">
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2"></div>
                      <div className="flex items-center justify-between relative">
                        {[1, 2, 3, 4].map((stepNumber) => (
                          <div key={stepNumber} className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              step > stepNumber 
                                ? 'bg-primary-600 text-white shadow-md shadow-primary-200' 
                                : step === stepNumber 
                                  ? 'bg-primary-600 text-white shadow-md shadow-primary-200 ring-4 ring-primary-100' 
                                  : 'bg-gray-200 text-gray-600'
                            } z-10 transition-all duration-300`}>
                              {step > stepNumber ? <Check className="h-5 w-5" /> : stepNumber}
                            </div>
                            <span className={`mt-3 text-sm font-medium ${
                              step === stepNumber ? 'text-primary-700' : 'text-gray-600'
                            }`}>
                              {stepNumber === 1 && "Interview Type"}
                              {stepNumber === 2 && "Job Details"}
                              {stepNumber === 3 && "Schedule & Settings"}
                              {stepNumber === 4 && "Review"}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="absolute top-1/2 left-0 h-1 bg-primary-600 -translate-y-1/2 transition-all duration-500"
                        style={{ width: `${(step - 1) * 33.33}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Step 1: Interview Type */}
                  {step === 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-2xl font-semibold mb-8 text-center">Select Interview Type</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {interviewTypes.map((type) => (
                          <InterviewTypeCard
                            key={type.type}
                            type={type.type}
                            title={type.title}
                            description={type.description}
                            icon={getIconComponent(type.icon)}
                            selected={formData.interviewType === type.type}
                            onSelect={handleTypeSelect}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Step 2: Job Details */}
                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-2xl font-semibold mb-8 text-center">Job Details</h2>
                      
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                            Job Title / Role
                          </label>
                          <input
                            type="text"
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            placeholder="e.g. Frontend Developer, Product Manager"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                          />
                        </div>
                        
                        {/* Job Suggestions */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="h-4 w-4 text-primary-600" />
                            <h3 className="text-sm font-medium text-gray-700">Quick Select: Popular Job Roles</h3>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {jobSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleJobSuggestionSelect(suggestion)}
                                className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm transition-all text-left group"
                              >
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                                    {suggestion.icon}
                                  </div>
                                </div>
                                <div className="overflow-hidden">
                                  <p className="font-medium text-sm truncate">{suggestion.role}</p>
                                  {suggestion.company && (
                                    <p className="text-xs text-gray-500 truncate">{suggestion.company}</p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                            Company <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleInputChange}
                            placeholder="e.g. Google, Amazon, Startup"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                            Your Experience Level <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="experience"
                            name="experience"
                            value={formData.experience}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select experience level</option>
                            {experienceLevels.map(level => (
                              <option key={level.value} value={level.value}>{level.label}</option>
                            ))}
                          </select>
                          {step === 2 && !formData.experience && (
                            <p className="text-xs text-red-500 mt-1">Please select your experience level</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Step 3: Schedule & Settings */}
                  {step === 3 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-2xl font-semibold mb-8 text-center">Schedule & Settings</h2>
                      
                      <div className="space-y-6">
                        {/* Schedule Section */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-blue-900 text-lg">Interview Schedule</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label htmlFor="scheduledDate" className="block text-sm font-medium text-blue-800 mb-2">
                                Date
                              </label>
                              <input
                                type="date"
                                id="scheduledDate"
                                name="scheduledDate"
                                value={formData.scheduledDate}
                                onChange={handleInputChange}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="scheduledTime" className="block text-sm font-medium text-blue-800 mb-2">
                                Time
                              </label>
                              <input
                                type="time"
                                id="scheduledTime"
                                name="scheduledTime"
                                value={formData.scheduledTime}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4 text-sm text-blue-700 flex items-center gap-2 bg-blue-100 p-3 rounded-lg">
                            <CalendarDays className="h-4 w-4 inline mr-1" />
                            Scheduled for {new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>

                        {/* Settings Section */}
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <Shield className="h-4 w-4 text-indigo-600" />
                            </div>
                            <h3 className="font-medium text-gray-900">Interview Settings</h3>
                          </div>
                          
                          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                          <select
                            id="difficulty"
                            name="difficulty"
                            value={formData.difficulty}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            {difficultyLevels.map(level => (
                              <option key={level.value} value={level.value}>{level.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Interview Duration (minutes)</label>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              name="duration"
                              min="10"
                              max="60"
                              step="5"
                              value={formData.duration}
                              onChange={handleInputChange} 
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                            />
                            <span className="w-16 text-center font-medium px-3 py-1 bg-primary-100 text-primary-800 rounded-full">{formData.duration} min</span>
                          </div> 
                          <p className="text-xs text-gray-500 mt-1">
                            This interview will use {formData.duration} minutes of your conversation time.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Step 4: Review */}
                  {step === 4 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-2xl font-semibold mb-8 text-center">Review & Confirm</h2>
                      
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-lg mb-6 text-center">Interview Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <MessageSquare className="h-4 w-4 text-primary-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Interview Type</p>
                                <p className="font-medium text-gray-900 capitalize">{formData.interviewType}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Briefcase className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Role</p>
                                <p className="font-medium text-gray-900">{formData.role || 'Not specified'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Building className="h-4 w-4 text-indigo-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Company</p>
                                <p className="font-medium text-gray-900">{formData.company || 'Not specified'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                <User className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Experience Level</p>
                                <p className="font-medium text-gray-900 capitalize">{formData.experience || 'Not specified'}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                <Award className="h-4 w-4 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Difficulty Level</p>
                                <p className="font-medium text-gray-900 capitalize">{formData.difficulty}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Duration</p>
                                <p className="font-medium text-gray-900">{formData.duration} minutes</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-red-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Scheduled For</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-base font-medium text-green-800">Ready to Schedule</p>
                              <p className="text-sm text-green-700 mt-1">
                                Your interview is configured and ready. You can save it for later or start immediately.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Navigation buttons */}
                  <div className="mt-10 flex justify-between">
                    {step > 1 ? (
                      <Button
                        onClick={handleBack}
                        variant="outline"
                        className="flex items-center gap-2 px-5 py-2.5"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </Button>
                    ) : (
                      <div></div>
                    )}
                    
                    {step < 4 ? (
                      <Button
                        onClick={handleNext}
                        disabled={!isStepValid()}
                        className={`flex items-center gap-2 px-5 py-2.5 ${
                          !isStepValid() ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        variant="interview"
                      >
                        Continue
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSaveAndSchedule}
                          disabled={!isStepValid() || saving} 
                          variant="outline"
                          className={`flex items-center gap-2 px-5 py-2.5 ${
                            !isStepValid() || saving ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {saving && (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                          )}
                          <Save className="h-4 w-4" />
                          {saving ? 'Saving...' : 'Save & Schedule'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="border-0 shadow-md sticky top-24">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <span>Tips for Success</span>
                  </h3>
                  <ul className="space-y-4">
                    {interviewTips.slice(0, 4).map((tip, index) => (
                      <li key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-success-100 flex-shrink-0 flex items-center justify-center mt-0.5">
                          <Check className="h-5 w-5 text-success-600" />
                        </div>
                        <p className="text-sm">
                          <span className="font-medium text-gray-900 block mb-1">{tip.title}</span>
                          {tip.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-4 bg-blue-50 p-3 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900">Average Duration</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          20-30 minutes per interview
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                      You can adjust the duration based on your availability and the complexity of the role you're preparing for.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface InterviewTypeCardProps {
  type: string;
  title: string; 
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: (type: string) => void;
}

const InterviewTypeCard: React.FC<InterviewTypeCardProps> = ({
  type,
  title,
  description,
  icon,
  selected,
  onSelect,
}) => {
  return (
    <div
      className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
        selected
          ? 'border-primary-600 bg-primary-50 shadow-md'
          : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50 hover:shadow-sm'
      }`}
      onClick={() => onSelect(type)}
    >
      <div className={`w-14 h-14 rounded-full mb-4 mx-auto flex items-center justify-center ${
        selected ? 'bg-primary-100 ring-4 ring-primary-50' : 'bg-gray-100'
      }`}>
        <div className={`transform transition-transform ${selected ? 'text-primary-600 scale-110' : 'text-gray-600'}`}>
          {icon}
        </div>
      </div>
      <h3 className="font-medium mb-2 text-center">{title}</h3>
      <p className="text-sm text-gray-600 text-center">{description}</p>
      {selected && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-primary-100 text-primary-700 text-sm font-medium flex items-center gap-1 justify-center p-2 rounded-lg"
        >
          <Check className="h-4 w-4" /> Selected
        </motion.div>
      )}
    </div>
  );
};

export default InterviewSetup;