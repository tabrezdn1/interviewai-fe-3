// Mock feedback data
export const mockFeedback = {
  interviewId: '1',
  title: "Frontend Developer Interview",
  date: "2025-04-10",
  duration: 22, // minutes
  overallScore: 85,
  summary: "You demonstrated strong technical knowledge and communication skills throughout the interview. Your answers were well-structured and you effectively used examples to support your points. There are some areas for improvement in how you articulate system design concepts and handling edge cases in your problem-solving approach.",
  strengths: [
    "Clear communication and articulate responses",
    "Strong understanding of React fundamentals and hooks",
    "Effective use of real-world examples",
    "Good problem-solving approach with clear explanation of thought process"
  ],
  improvements: [
    "Could provide more depth on system design questions",
    "Sometimes took too long to get to the main point",
    "Consider discussing edge cases more thoroughly",
    "Could improve confidence when discussing unfamiliar topics"
  ],
  questionResponses: [
    {
      question: "Can you tell me about yourself and your experience with frontend development?",
      analysis: "Strong introduction that highlighted relevant experience. Good balance of personal and professional information.",
      score: 90,
      feedback: "Excellent response that was concise yet comprehensive. You effectively highlighted your key skills and experiences relevant to the role."
    },
    {
      question: "What frontend frameworks have you worked with, and which do you prefer?",
      analysis: "Good overview of frameworks with clear reasoning for preferences. Could have provided more specific examples of projects.",
      score: 85,
      feedback: "You demonstrated good knowledge of various frameworks. Consider adding specific examples of projects where you've used these frameworks to make your answer more impactful."
    },
    {
      question: "Can you explain the difference between controlled and uncontrolled components in React?",
      analysis: "Accurate technical explanation with good examples. Very clear understanding of the concept.",
      score: 95,
      feedback: "Excellent technical explanation with clear differentiation between the two approaches. Your examples were relevant and demonstrated deep understanding."
    },
    {
      question: "How do you approach responsive design and ensure cross-browser compatibility?",
      analysis: "Good overview of responsive design principles but could have mentioned more specific techniques and testing strategies.",
      score: 75,
      feedback: "Your explanation of responsive design principles was solid. To improve, discuss specific techniques like container queries, CSS Grid, and actual testing methodologies you've used across browsers."
    },
    {
      question: "Tell me about a challenging frontend project you worked on and how you solved the problems you encountered.",
      analysis: "Good story structure but could have been more specific about the technical challenges and solutions.",
      score: 80,
      feedback: "You structured your response well using the STAR method. To make it stronger, provide more technical details about the specific challenges and how your solutions demonstrated your skills."
    }
  ],
  skillAssessment: {
    technical: {
      score: 88,
      feedback: "Strong technical foundation with good understanding of core concepts."
    },
    communication: {
      score: 90,
      feedback: "Excellent communication skills with clear and articulate responses."
    },
    problemSolving: {
      score: 82,
      feedback: "Good problem-solving approach but could improve on handling edge cases."
    },
    experience: {
      score: 85,
      feedback: "Relevant experience effectively highlighted throughout the interview."
    }
  }
};

export const getScoreColor = (score: number): string => {
  if (score >= 90) return '#10b981'; // success-500
  if (score >= 75) return '#3b82f6'; // primary-500
  if (score >= 60) return '#f59e0b'; // warning-500
  return '#ef4444'; // error-500
};

export const getScoreTextColor = (score: number): string => {
  if (score >= 90) return 'text-success-600';
  if (score >= 75) return 'text-primary-600';
  if (score >= 60) return 'text-warning-600';
  return 'text-error-600';
};

export const getScoreBackgroundColor = (score: number): string => {
  if (score >= 90) return 'bg-success-500';
  if (score >= 75) return 'bg-primary-500';
  if (score >= 60) return 'bg-warning-500';
  return 'bg-error-500';
};

export const getScoreRating = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Satisfactory';
  return 'Needs Improvement';
};

// Tips for users
export const interviewTips = [
  {
    category: "preparation",
    title: "Research the company",
    description: "Understanding the company's values and products shows genuine interest."
  },
  {
    category: "technique",
    title: "Practice the STAR method",
    description: "Structure your answers: Situation, Task, Action, and Result."
  },
  {
    category: "preparation",
    title: "Prepare your own questions",
    description: "Having thoughtful questions ready shows your initiative."
  },
  {
    category: "technique",
    title: "Mirror the interviewer",
    description: "Subtly matching the interviewer's tone and energy creates rapport."
  },
  {
    category: "presentation",
    title: "Dress professionally",
    description: "Even for remote interviews, professional attire makes a good impression."
  }
];

// Next steps recommendations
export const nextStepsRecommendations = [
  {
    title: "Practice Again",
    link: "/setup",
    icon: "RefreshCcw"
  },
  {
    title: "System Design Course",
    link: "#",
    icon: "Layout"
  },
  {
    title: "Advanced React Patterns",
    link: "#",
    icon: "Code"
  },
  {
    title: "Communication Skills",
    link: "#",
    icon: "MessageSquare"
  }
];