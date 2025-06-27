/*
  # Seed Initial Data for Interview AI Application
  
  This migration populates the database with initial data for:
  1. Interview Types
  2. Experience Levels
  3. Difficulty Levels
  4. Sample Questions for each interview type
*/

-- Seed interview_types table
INSERT INTO interview_types (type, title, description, icon)
VALUES 
  ('technical', 'Technical', 'Coding, system design, and technical knowledge questions', 'Code'),
  ('behavioral', 'Behavioral', 'Questions about your past experiences and situations', 'User'),
  ('mixed', 'Mixed', 'Combination of technical and behavioral questions', 'Briefcase')
ON CONFLICT (type) DO NOTHING;

-- Seed experience_levels table
INSERT INTO experience_levels (value, label)
VALUES 
  ('entry', 'Entry Level (0-2 years)'),
  ('mid', 'Mid Level (3-5 years)'),
  ('senior', 'Senior Level (6+ years)')
ON CONFLICT (value) DO NOTHING;

-- Seed difficulty_levels table
INSERT INTO difficulty_levels (value, label)
VALUES 
  ('easy', 'Easy - Beginner friendly questions'),
  ('medium', 'Medium - Standard interview difficulty'),
  ('hard', 'Hard - Challenging interview questions')
ON CONFLICT (value) DO NOTHING;

-- Seed questions table - Technical questions
INSERT INTO questions (interview_type_id, text, hint)
VALUES
  ((SELECT id FROM interview_types WHERE type = 'technical'), 
   'Can you tell me about yourself and your experience with frontend development?', 
   'Focus on relevant experience and skills for the role.'),
  ((SELECT id FROM interview_types WHERE type = 'technical'), 
   'What frontend frameworks have you worked with, and which do you prefer?', 
   'Discuss your experience with different frameworks and explain your preference.'),
  ((SELECT id FROM interview_types WHERE type = 'technical'), 
   'Can you explain the difference between controlled and uncontrolled components in React?', 
   'Focus on how state is managed in each approach.'),
  ((SELECT id FROM interview_types WHERE type = 'technical'), 
   'How do you approach responsive design and ensure cross-browser compatibility?', 
   'Mention media queries, CSS methodologies, and testing strategies.'),
  ((SELECT id FROM interview_types WHERE type = 'technical'), 
   'Tell me about a challenging frontend project you worked on and how you solved the problems you encountered.', 
   'Use the STAR method: Situation, Task, Action, Result.');

-- Seed questions table - Behavioral questions
INSERT INTO questions (interview_type_id, text, hint)
VALUES
  ((SELECT id FROM interview_types WHERE type = 'behavioral'), 
   'Describe a situation where you had to work under pressure to meet a deadline.', 
   'Focus on how you managed the pressure and what steps you took to meet the deadline.'),
  ((SELECT id FROM interview_types WHERE type = 'behavioral'), 
   'Tell me about a time when you had a conflict with a team member and how you resolved it.', 
   'Explain the situation, your approach to resolution, and the outcome.'),
  ((SELECT id FROM interview_types WHERE type = 'behavioral'), 
   'How do you handle receiving criticism about your work?', 
   'Discuss your approach to feedback and provide an example of how you''ve used it to improve.'),
  ((SELECT id FROM interview_types WHERE type = 'behavioral'), 
   'Describe a situation where you had to learn a new technology quickly.', 
   'Focus on your learning process and the results you achieved.'),
  ((SELECT id FROM interview_types WHERE type = 'behavioral'), 
   'Tell me about a time when you went above and beyond what was required for a project.', 
   'Highlight your initiative and the impact of your extra effort.');

-- Seed questions table - Mixed questions
INSERT INTO questions (interview_type_id, text, hint)
VALUES
  ((SELECT id FROM interview_types WHERE type = 'mixed'), 
   'Can you tell me about yourself and your background?', 
   'Balance technical skills with personal qualities that make you a good fit.'),
  ((SELECT id FROM interview_types WHERE type = 'mixed'), 
   'How do you approach debugging a complex issue in a web application?', 
   'Outline your systematic process and tools you use.'),
  ((SELECT id FROM interview_types WHERE type = 'mixed'), 
   'Tell me about a time you had to make a difficult decision regarding a technical approach.', 
   'Explain the situation, options, your decision process, and the outcome.'),
  ((SELECT id FROM interview_types WHERE type = 'mixed'), 
   'How do you stay updated with the latest frontend technologies and best practices?', 
   'Mention specific resources, communities, and your learning routine.'),
  ((SELECT id FROM interview_types WHERE type = 'mixed'), 
   'Describe your experience working in an agile environment.', 
   'Discuss your role in agile ceremonies and how you contributed to the team''s success.');