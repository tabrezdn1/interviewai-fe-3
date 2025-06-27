// Mock interview questions
export const mockQuestions = {
  technical: [
    {
      id: 1,
      text: "Can you tell me about yourself and your experience with frontend development?",
      hint: "Focus on relevant experience and skills for the role.",
    },
    {
      id: 2,
      text: "What frontend frameworks have you worked with, and which do you prefer?",
      hint: "Discuss your experience with different frameworks and explain your preference.",
    },
    {
      id: 3,
      text: "Can you explain the difference between controlled and uncontrolled components in React?",
      hint: "Focus on how state is managed in each approach.",
    },
    {
      id: 4,
      text: "How do you approach responsive design and ensure cross-browser compatibility?",
      hint: "Mention media queries, CSS methodologies, and testing strategies.",
    },
    {
      id: 5,
      text: "Tell me about a challenging frontend project you worked on and how you solved the problems you encountered.",
      hint: "Use the STAR method: Situation, Task, Action, Result.",
    },
  ],
  behavioral: [
    {
      id: 1,
      text: "Describe a situation where you had to work under pressure to meet a deadline.",
      hint: "Focus on how you managed the pressure and what steps you took to meet the deadline.",
    },
    {
      id: 2,
      text: "Tell me about a time when you had a conflict with a team member and how you resolved it.",
      hint: "Explain the situation, your approach to resolution, and the outcome.",
    },
    {
      id: 3,
      text: "How do you handle receiving criticism about your work?",
      hint: "Discuss your approach to feedback and provide an example of how you've used it to improve.",
    },
    {
      id: 4,
      text: "Describe a situation where you had to learn a new technology quickly.",
      hint: "Focus on your learning process and the results you achieved.",
    },
    {
      id: 5,
      text: "Tell me about a time when you went above and beyond what was required for a project.",
      hint: "Highlight your initiative and the impact of your extra effort.",
    },
  ],
  mixed: [
    {
      id: 1,
      text: "Can you tell me about yourself and your background?",
      hint: "Balance technical skills with personal qualities that make you a good fit.",
    },
    {
      id: 2,
      text: "How do you approach debugging a complex issue in a web application?",
      hint: "Outline your systematic process and tools you use.",
    },
    {
      id: 3,
      text: "Tell me about a time you had to make a difficult decision regarding a technical approach.",
      hint: "Explain the situation, options, your decision process, and the outcome.",
    },
    {
      id: 4,
      text: "How do you stay updated with the latest frontend technologies and best practices?",
      hint: "Mention specific resources, communities, and your learning routine.",
    },
    {
      id: 5,
      text: "Describe your experience working in an agile environment.",
      hint: "Discuss your role in agile ceremonies and how you contributed to the team's success.",
    },
  ]
};

// Interview types
export const interviewTypes = [
  {
    type: "technical",
    title: "Technical",
    description: "Coding, system design, and technical knowledge questions",
    icon: "Code",
  },
  {
    type: "behavioral", 
    title: "Behavioral",
    description: "Questions about your past experiences and situations",
    icon: "User",
  },
  {
    type: "mixed",
    title: "Mixed",
    description: "Combination of technical and behavioral questions",
    icon: "Briefcase",
  },
];

// Experience levels
export const experienceLevels = [
  { value: "entry", label: "Entry Level (0-2 years)" },
  { value: "mid", label: "Mid Level (3-5 years)" },
  { value: "senior", label: "Senior Level (6+ years)" },
];

// Difficulty levels
export const difficultyLevels = [
  { value: "easy", label: "Easy - Beginner friendly questions" },
  { value: "medium", label: "Medium - Standard interview difficulty" },
  { value: "hard", label: "Hard - Challenging interview questions" },
];