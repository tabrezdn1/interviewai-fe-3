/*
  # Update Interview Data Schema
  
  1. New Data
    - Preserve existing interview_questions data
    - Update interview_types, experience_levels, difficulty_levels
    - Add new questions for each interview type
    
  2. Changes
    - Safely update data without violating foreign key constraints
*/

-- First, save existing interview_questions data to a temporary table
CREATE TEMPORARY TABLE temp_interview_questions AS
SELECT * FROM interview_questions;

-- Clear existing data in correct order to avoid foreign key violations
DELETE FROM interview_questions;

-- Now we can safely update the reference tables
-- Update interview_types table
TRUNCATE interview_types RESTART IDENTITY CASCADE;
INSERT INTO interview_types (type, title, description, icon) VALUES
('screening', 'Phone Screening', 'Initial screening call with recruiter to assess basic qualifications and fit', 'Phone'),
('technical', 'Technical Round', 'In-depth assessment of technical skills, coding abilities, and problem-solving approach', 'Code'),
('behavioral', 'Behavioral Round', 'Evaluation of soft skills, cultural fit, past experiences, and situational responses', 'User');

-- Update experience_levels table
TRUNCATE experience_levels RESTART IDENTITY CASCADE;
INSERT INTO experience_levels (value, label) VALUES
('entry', 'Entry Level - 0-2 years of experience'),
('mid', 'Mid Level - 2-5 years of experience'),
('senior', 'Senior Level - 5+ years of experience');

-- Update difficulty_levels table
TRUNCATE difficulty_levels RESTART IDENTITY CASCADE;
INSERT INTO difficulty_levels (value, label) VALUES
('easy', 'Easy - Basic questions suitable for beginners'),
('medium', 'Medium - Standard interview difficulty'),
('hard', 'Hard - Advanced questions for experienced candidates');

-- Populate questions table with sample questions
-- Get the interview type IDs for foreign key references
DO $$
DECLARE
    screening_type_id INTEGER;
    technical_type_id INTEGER;
    behavioral_type_id INTEGER;
BEGIN
    -- Get interview type IDs
    SELECT id INTO screening_type_id FROM interview_types WHERE type = 'screening';
    SELECT id INTO technical_type_id FROM interview_types WHERE type = 'technical';
    SELECT id INTO behavioral_type_id FROM interview_types WHERE type = 'behavioral';

    -- Insert screening questions
    INSERT INTO questions (interview_type_id, text, hint) VALUES
    (screening_type_id, 'Tell me about yourself and your background.', 'Focus on your professional journey, key experiences, and what brings you to this role.'),
    (screening_type_id, 'Why are you interested in this position?', 'Connect your skills and career goals to the specific role and company.'),
    (screening_type_id, 'What are your salary expectations?', 'Research market rates and be prepared to discuss a range based on your experience.'),
    (screening_type_id, 'When would you be available to start?', 'Be honest about your timeline while showing enthusiasm for the opportunity.'),
    (screening_type_id, 'Do you have any questions about the role or company?', 'Prepare thoughtful questions that show your genuine interest and research.');

    -- Insert technical questions
    INSERT INTO questions (interview_type_id, text, hint) VALUES
    (technical_type_id, 'Explain the difference between let, const, and var in JavaScript.', 'Focus on scope, hoisting, and reassignment differences.'),
    (technical_type_id, 'How would you optimize a slow-loading web page?', 'Consider image optimization, code splitting, caching, and performance metrics.'),
    (technical_type_id, 'Describe how you would implement a simple REST API.', 'Cover HTTP methods, status codes, data validation, and error handling.'),
    (technical_type_id, 'What is the difference between SQL and NoSQL databases?', 'Discuss structure, scalability, consistency, and use cases for each.'),
    (technical_type_id, 'How do you handle version control in a team environment?', 'Explain branching strategies, merge conflicts, and collaboration workflows.');

    -- Insert behavioral questions
    INSERT INTO questions (interview_type_id, text, hint) VALUES
    (behavioral_type_id, 'Tell me about a time you faced a challenging problem at work.', 'Use the STAR method: Situation, Task, Action, Result.'),
    (behavioral_type_id, 'Describe a situation where you had to work with a difficult team member.', 'Focus on communication, empathy, and finding common ground.'),
    (behavioral_type_id, 'Give an example of when you had to learn something new quickly.', 'Highlight your learning process, resources used, and successful outcome.'),
    (behavioral_type_id, 'Tell me about a time you made a mistake and how you handled it.', 'Show accountability, learning, and steps taken to prevent future issues.'),
    (behavioral_type_id, 'Describe a project you''re particularly proud of.', 'Explain your role, challenges overcome, and the impact of your work.');
END $$;