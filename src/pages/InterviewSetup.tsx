import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Code, Briefcase, User, Clock, Check, ChevronRight, ChevronLeft, 
  MessageSquare, Phone, Lightbulb, 
  CheckCircle, Smartphone, Laptop, Building, Sparkles,
  Calendar, CalendarDays, Save, Shield, Award
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { interviewTips } from '../data/feedback';
import { useAuth } from '../hooks/useAuth';
import { fetchInterviewTypes, fetchExperienceLevels, fetchDifficultyLevels } from '../lib/utils';
import { createInterview } from '../services/InterviewService';
import Breadcrumb from '../components/layout/Breadcrumb';

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
      try {
        if (user) {
          const interview = await createInterview(user.id, formData);
          navigate(`/interview/${interview.id}`);
        }
      } catch (error) {
        console.error('Error creating interview:', error);
        // Handle error - show message to user
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <video src="/loading.webm" autoPlay loop muted playsInline className="w-20 h-20 object-contain mb-4 mx-auto" />
          <h3 className="text-lg font-medium mb-2">Setting up interview...</h3>
          <p className="text-muted-foreground">Please wait while we prepare your session</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="hidden md:block">
        <Breadcrumb />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4 sm:mb-6"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Setup Interview</h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
          Configure your AI interview session based on your needs
        </p>
      </motion.div>
      {/* Responsive main layout: column on mobile, row on desktop */}
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
        {/* Main content */}
        <div className="w-full lg:flex-1">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border border-white/40 dark:border-slate-700/60 shadow-xl bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl flex flex-col justify-start">
              <CardContent className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col">
                {/* Progress indicator */}
                <div className="mb-8">
                  <div className="relative">
                    {/* Progress Bar Background */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-slate-700 -translate-y-1/2 rounded-full"></div>
                    {/* Progress Bar Foreground */}
                    <div className="absolute top-1/2 left-0 h-1 bg-primary-600 dark:bg-blue-500 -translate-y-1/2 rounded-full transition-all duration-500"
                      style={{ width: `${(step - 1) * 33.33}%` }}
                    ></div>
                    {/* Step Circles */}
                    <div className="flex flex-row items-center justify-between relative gap-2 sm:gap-0 overflow-x-auto no-scrollbar">
                      {[1, 2, 3, 4].map((stepNumber) => (
                        <div key={stepNumber} className="flex flex-col items-center flex-1 min-w-[60px]">
                          <div
                            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg font-semibold border-4 transition-all duration-300 shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300
                              ${step > stepNumber
                                ? 'bg-primary-600 text-white border-primary-600 shadow-primary-200 dark:bg-blue-500 dark:border-blue-500 dark:shadow-blue-800'
                                : step === stepNumber
                                  ? 'bg-white text-primary-700 border-primary-600 shadow-lg ring-4 ring-primary-200 dark:bg-slate-900 dark:text-blue-200 dark:border-blue-500 dark:ring-blue-900'
                                  : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'}
                            `}
                            tabIndex={0}
                            aria-current={step === stepNumber ? 'step' : undefined}
                          >
                            {step > stepNumber ? <Check className="h-6 w-6" /> : stepNumber}
                          </div>
                          <span className={`mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-center w-full transition-colors
                            ${step === stepNumber ? 'text-primary-700 dark:text-blue-200' : 'text-gray-600 dark:text-slate-400'}`}
                          >
                            {stepNumber === 1 && "Interview Type"}
                            {stepNumber === 2 && "Job Details"}
                            {stepNumber === 3 && "Schedule & Settings"}
                            {stepNumber === 4 && "Review"}
                          </span>
                        </div>
                      ))}
                    </div>
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
                    <h2 className="text-2xl sm:text-3xl font-semibold mb-8 text-center">Select Interview Type</h2>
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
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
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                          Job Title / Role
                        </label>
                        <input
                          type="text"
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          placeholder="e.g. Frontend Developer, Product Manager"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900/80 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                          required
                        />
                      </div>
                      
                      {/* Job Suggestions */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="h-4 w-4 text-primary-600" />
                          <h3 className="text-sm font-medium text-gray-700 dark:text-slate-200">Quick Select: Popular Job Roles</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {jobSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleJobSuggestionSelect(suggestion)}
                              className="flex items-center gap-2 p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-primary-300 hover:bg-primary-50 dark:hover:border-primary-700 dark:hover:bg-primary-900/10 hover:shadow-sm transition-all text-left group bg-white dark:bg-slate-900/80"
                            >
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900 flex items-center justify-center transition-colors">
                                  {suggestion.icon}
                                </div>
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-medium text-sm truncate text-gray-900 dark:text-slate-100">{suggestion.role}</p>
                                {suggestion.company && (
                                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{suggestion.company}</p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                          Company <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="e.g. Google, Amazon, Startup"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900/80 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="experience" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                          Your Experience Level <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900/80 text-gray-900 dark:text-slate-100"
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
                    <h2 className="text-2xl font-semibold mb-8 text-center">Schedule</h2>
                    
                    <div className="space-y-6">
                      {/* Schedule Section */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm dark:bg-blue-900/30 dark:border-blue-800">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                          </div>
                          <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-lg">Interview Schedule</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="scheduledDate" className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                              Date
                            </label>
                            <input
                              type="date"
                              id="scheduledDate"
                              name="scheduledDate"
                              value={formData.scheduledDate}
                              onChange={handleInputChange}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900/80 text-gray-900 dark:text-slate-100"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="scheduledTime" className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                              Time
                            </label>
                            <input
                              type="time"
                              id="scheduledTime"
                              name="scheduledTime"
                              value={formData.scheduledTime}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900/80 text-gray-900 dark:text-slate-100"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4 text-sm text-blue-700 flex items-center gap-2 bg-blue-100 p-3 rounded-lg dark:bg-blue-900/40 dark:text-blue-200">
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
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-slate-100">Interview Settings</h3>
                        </div>
                        
                        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Difficulty Level</label>
                        <select
                          id="difficulty"
                          name="difficulty"
                          value={formData.difficulty}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900/80 text-gray-900 dark:text-slate-100"
                        >
                          {difficultyLevels.map(level => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Interview Duration (minutes)</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            name="duration"
                            min="10"
                            max="60"
                            step="5"
                            value={formData.duration}
                            onChange={handleInputChange} 
                            className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                          />
                          <span className="w-16 text-center font-medium px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full">{formData.duration} min</span>
                        </div> 
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
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
                    
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm dark:bg-slate-900/80 dark:border-slate-700">
                      <h3 className="font-semibold text-lg mb-6 text-center text-gray-900 dark:text-slate-100">Interview Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm dark:bg-slate-800/80 dark:border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                              <MessageSquare className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-slate-400">Interview Type</p>
                              <p className="font-medium text-gray-900 dark:text-slate-100 capitalize">{formData.interviewType}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm dark:bg-slate-800/80 dark:border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-slate-400">Role</p>
                              <p className="font-medium text-gray-900 dark:text-slate-100">{formData.role || 'Not specified'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm dark:bg-slate-800/80 dark:border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                              <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-slate-400">Company</p>
                              <p className="font-medium text-gray-900 dark:text-slate-100">{formData.company || 'Not specified'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm dark:bg-slate-800/80 dark:border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <User className="h-4 w-4 text-green-600 dark:text-green-300" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-slate-400">Experience Level</p>
                              <p className="font-medium text-gray-900 dark:text-slate-100 capitalize">{formData.experience || 'Not specified'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm dark:bg-slate-800/80 dark:border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                              <Award className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-slate-400">Difficulty Level</p>
                              <p className="font-medium text-gray-900 dark:text-slate-100 capitalize">{formData.difficulty}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm dark:bg-slate-800/80 dark:border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-slate-400">Duration</p>
                              <p className="font-medium text-gray-900 dark:text-slate-100">{formData.duration} minutes</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm dark:bg-slate-800/80 dark:border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-red-600 dark:text-red-300" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-slate-400">Scheduled For</p>
                              <p className="font-medium text-gray-900 dark:text-slate-100">
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
                      
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm dark:bg-green-900/30 dark:border-green-800">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-base font-medium text-green-800 dark:text-green-200">Ready to Schedule</p>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                              Your interview is configured and ready. You can save it for later or start immediately.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Navigation buttons: full width on mobile, inline on desktop */}
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:justify-between gap-3">
                  {step > 1 ? (
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="flex items-center gap-2 px-5 py-2.5 w-full sm:w-auto"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </Button>
                  ) : (
                    <div className="w-full sm:w-auto"></div>
                  )}
                  {step < 4 ? (
                    <Button
                      onClick={handleNext}
                      disabled={!isStepValid()}
                      className={`flex items-center gap-2 px-5 py-2.5 w-full sm:w-auto ${
                        !isStepValid() ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      variant="interview"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="flex gap-3 w-full sm:w-auto">
                      <Button
                        onClick={handleSaveAndSchedule}
                        disabled={!isStepValid() || saving} 
                        variant="outline"
                        className={`flex items-center gap-2 px-5 py-2.5 w-full sm:w-auto ${
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
        {/* Tips sidebar: below on mobile, right on desktop */}
        <div className="w-full lg:w-96 flex-shrink-0 mt-10 lg:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <span>Tips for Success</span>
            </h3>
            <ul className="space-y-3 sm:space-y-4">
              {interviewTips.slice(0, 4).map((tip, index) => (
                <li key={index} className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-gray-100 dark:bg-slate-800/80 dark:border-slate-700">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">{tip.title}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-300">{tip.description}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-3 sm:mb-4 bg-blue-50 p-3 rounded-lg dark:bg-blue-900/40">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900">
                  <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-200">Average Duration</h4>
                  <p className="text-sm text-blue-700 mt-1 dark:text-blue-300">
                    20-30 minutes per interview
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2 sm:mt-4 dark:text-slate-300">
                You can adjust the duration based on your availability and the complexity of the role you're preparing for.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
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
    <button
      type="button"
      className={`group border-2 rounded-2xl p-6 w-full h-full cursor-pointer transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300
        ${selected
          ? 'border-primary-600 bg-primary-50 shadow-lg dark:border-blue-500 dark:bg-blue-900/30'
          : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50 hover:shadow-md dark:border-slate-700 dark:hover:border-blue-400 dark:hover:bg-slate-700/60'}
      `}
      onClick={() => onSelect(type)}
      tabIndex={0}
      aria-pressed={selected}
      aria-label={title}
    >
      <div className={`w-16 h-16 rounded-full mb-5 mx-auto flex items-center justify-center transition-all duration-300
        ${selected ? 'bg-primary-100 ring-4 ring-primary-200 dark:bg-blue-900 dark:ring-blue-800' : 'bg-gray-100 dark:bg-slate-800'}
      `}>
        <span className={`text-3xl transition-transform duration-200 ${selected ? 'text-primary-600 scale-110' : 'text-gray-500 group-hover:text-primary-600 dark:text-slate-400 dark:group-hover:text-blue-400'}`}>{icon}</span>
      </div>
      <h3 className="font-bold text-lg mb-2 text-center dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-slate-300 text-center mb-2">{description}</p>
      {selected && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-primary-100 text-primary-700 text-sm font-semibold flex items-center gap-1 justify-center p-2 rounded-lg dark:bg-blue-900 dark:text-blue-200"
        >
          <Check className="h-4 w-4" /> Selected
        </motion.div>
      )}
    </button>
  );
};

export default InterviewSetup;