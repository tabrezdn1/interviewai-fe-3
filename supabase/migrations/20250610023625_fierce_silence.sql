/*
  # Populate lookup tables with required data

  1. New Data
    - Add interview types: technical, behavioral, mixed, screening
    - Add experience levels: entry, mid, senior
    - Add difficulty levels: easy, medium, hard
    - Add sample questions for each interview type

  2. Security
    - All tables already have RLS enabled
    - Policies already exist for reading lookup data

  3. Notes
    - Uses INSERT ... ON CONFLICT to avoid duplicates
    - Ensures all required lookup data exists for the application
*/

-- Insert interview types
INSERT INTO interview_types (type, title, description, icon) VALUES
  ('technical', 'Technical Interview', 'Assess technical skills and problem-solving abilities', 'Code'),
  ('behavioral', 'Behavioral Interview', 'Evaluate soft skills and cultural fit', 'Users'),
  ('mixed', 'Mixed Interview', 'Combination of technical and behavioral questions', 'Layers'),
  ('screening', 'Screening Interview', 'Initial screening to assess basic qualifications', 'Search')
ON CONFLICT (type) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- Insert experience levels
INSERT INTO experience_levels (value, label) VALUES
  ('entry', 'Entry Level - 0-2 years of experience'),
  ('mid', 'Mid Level - 2-5 years of experience'),
  ('senior', 'Senior Level - 5+ years of experience')
ON CONFLICT (value) DO UPDATE SET
  label = EXCLUDED.label;

-- Insert difficulty levels
INSERT INTO difficulty_levels (value, label) VALUES
  ('easy', 'Easy - Basic level questions'),
  ('medium', 'Medium - Standard interview difficulty'),
  ('hard', 'Hard - Advanced level questions')
ON CONFLICT (value) DO UPDATE SET
  label = EXCLUDED.label;

-- Insert sample questions for technical interviews
INSERT INTO questions (interview_type_id, text, hint) 
SELECT 
  it.id,
  q.text,
  q.hint
FROM interview_types it
CROSS JOIN (VALUES
  ('Explain the difference between let, const, and var in JavaScript.', 'Consider scope, hoisting, and reassignment'),
  ('What is the virtual DOM and how does it work in React?', 'Think about performance and reconciliation'),
  ('Describe the concept of closures in JavaScript with an example.', 'Focus on scope and variable access'),
  ('What are the differences between SQL and NoSQL databases?', 'Consider structure, scalability, and use cases'),
  ('Explain the principles of RESTful API design.', 'Think about HTTP methods, status codes, and resource naming')
) AS q(text, hint)
WHERE it.type = 'technical'
ON CONFLICT DO NOTHING;

-- Insert sample questions for behavioral interviews
INSERT INTO questions (interview_type_id, text, hint) 
SELECT 
  it.id,
  q.text,
  q.hint
FROM interview_types it
CROSS JOIN (VALUES
  ('Tell me about a time when you had to work with a difficult team member.', 'Focus on conflict resolution and communication'),
  ('Describe a challenging project you worked on and how you overcame obstacles.', 'Highlight problem-solving and persistence'),
  ('How do you handle tight deadlines and pressure?', 'Discuss time management and stress handling'),
  ('Give an example of when you had to learn a new technology quickly.', 'Show adaptability and learning ability'),
  ('Describe a time when you made a mistake and how you handled it.', 'Demonstrate accountability and learning from errors')
) AS q(text, hint)
WHERE it.type = 'behavioral'
ON CONFLICT DO NOTHING;

-- Insert sample questions for mixed interviews
INSERT INTO questions (interview_type_id, text, hint) 
SELECT 
  it.id,
  q.text,
  q.hint
FROM interview_types it
CROSS JOIN (VALUES
  ('How would you approach debugging a performance issue in a web application?', 'Combine technical knowledge with problem-solving approach'),
  ('Describe your experience with version control and collaboration workflows.', 'Mix technical tools with teamwork'),
  ('How do you stay updated with new technologies and decide which ones to adopt?', 'Balance technical curiosity with practical decision-making'),
  ('Walk me through how you would design a simple chat application.', 'Combine system design with communication skills'),
  ('Tell me about a time you had to explain a complex technical concept to a non-technical stakeholder.', 'Mix technical knowledge with communication skills')
) AS q(text, hint)
WHERE it.type = 'mixed'
ON CONFLICT DO NOTHING;

-- Insert sample questions for screening interviews
INSERT INTO questions (interview_type_id, text, hint) 
SELECT 
  it.id,
  q.text,
  q.hint
FROM interview_types it
CROSS JOIN (VALUES
  ('Tell me about your background and experience in software development.', 'Keep it concise and relevant'),
  ('What programming languages and technologies are you most comfortable with?', 'Focus on your strongest skills'),
  ('Why are you interested in this role and our company?', 'Show research and genuine interest'),
  ('What are your salary expectations for this position?', 'Be prepared with a reasonable range'),
  ('When would you be available to start if offered the position?', 'Be honest about your timeline')
) AS q(text, hint)
WHERE it.type = 'screening'
ON CONFLICT DO NOTHING;