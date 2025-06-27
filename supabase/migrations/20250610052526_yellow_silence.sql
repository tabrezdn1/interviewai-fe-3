/*
  # Populate Enhanced Database with Sample Data
  
  1. Add sample companies
  2. Add sample job roles  
  3. Add question categories
  4. Add Tavus configurations
  5. Add sample interview templates
*/

-- Populate companies table
INSERT INTO companies (name, industry, size_category) VALUES
('Google', 'Technology', 'enterprise'),
('Amazon', 'Technology', 'enterprise'), 
('Microsoft', 'Technology', 'enterprise'),
('Apple', 'Technology', 'enterprise'),
('Meta', 'Technology', 'enterprise'),
('Netflix', 'Technology', 'large'),
('Spotify', 'Technology', 'large'),
('Airbnb', 'Technology', 'large'),
('Uber', 'Technology', 'large'),
('Stripe', 'Financial Technology', 'large'),
('OpenAI', 'Artificial Intelligence', 'medium'),
('Anthropic', 'Artificial Intelligence', 'medium'),
('Y Combinator Startup', 'Various', 'startup')
ON CONFLICT (name) DO NOTHING;

-- Populate job roles table
INSERT INTO job_roles (title, category, level, keywords) VALUES
('Frontend Developer', 'engineering', 'mid', ARRAY['react', 'javascript', 'css', 'html', 'typescript']),
('Backend Developer', 'engineering', 'mid', ARRAY['python', 'java', 'node.js', 'databases', 'api']),
('Full Stack Developer', 'engineering', 'mid', ARRAY['react', 'node.js', 'databases', 'javascript']),
('Software Engineer', 'engineering', 'entry', ARRAY['programming', 'algorithms', 'data structures']),
('Senior Software Engineer', 'engineering', 'senior', ARRAY['system design', 'architecture', 'mentoring']),
('Product Manager', 'product', 'mid', ARRAY['strategy', 'roadmap', 'stakeholder management']),
('Data Scientist', 'engineering', 'mid', ARRAY['python', 'sql', 'machine learning', 'statistics']),
('DevOps Engineer', 'engineering', 'mid', ARRAY['aws', 'docker', 'kubernetes', 'ci/cd']),
('UX Designer', 'design', 'mid', ARRAY['figma', 'user research', 'prototyping']),
('Marketing Manager', 'marketing', 'mid', ARRAY['campaigns', 'analytics', 'growth'])
ON CONFLICT DO NOTHING;

-- Populate question categories
INSERT INTO question_categories (name, description) VALUES
('Technical Skills', 'Questions about programming, system design, and technical knowledge'),
('Problem Solving', 'Questions that assess analytical and problem-solving abilities'),
('Communication', 'Questions that evaluate communication and interpersonal skills'),
('Leadership', 'Questions about leadership experience and management capabilities'), 
('Cultural Fit', 'Questions about values, work style, and company culture alignment'),
('Experience', 'Questions about past work experience and achievements'),
('Behavioral', 'Situational questions using the STAR method'),
('System Design', 'Questions about designing scalable systems and architecture'),
('Coding', 'Hands-on coding problems and algorithm questions'),
('Product Sense', 'Questions about product thinking and user experience')
ON CONFLICT (name) DO NOTHING;

-- Populate Tavus configurations (using mock IDs for now)
INSERT INTO tavus_configurations (interview_type, replica_id, persona_id, replica_name, persona_name) VALUES
('screening', 'replica_hr_001', 'persona_hr_001', 'HR Interviewer', 'Professional HR Persona'),
('technical', 'replica_tech_001', 'persona_tech_001', 'Technical Lead', 'Senior Engineer Persona'),
('behavioral', 'replica_behavior_001', 'persona_behavior_001', 'Hiring Manager', 'Leadership Persona')
ON CONFLICT DO NOTHING;

-- Update existing questions with categories
UPDATE questions SET 
  category_id = (SELECT id FROM question_categories WHERE name = 'Technical Skills'),
  difficulty_level = 'medium',
  estimated_time_minutes = 5,
  tags = ARRAY['programming', 'fundamentals']
WHERE interview_type_id = (SELECT id FROM interview_types WHERE type = 'technical');

UPDATE questions SET
  category_id = (SELECT id FROM question_categories WHERE name = 'Behavioral'), 
  difficulty_level = 'medium',
  estimated_time_minutes = 8,
  tags = ARRAY['experience', 'soft skills']
WHERE interview_type_id = (SELECT id FROM interview_types WHERE type = 'behavioral');

-- Create sample interview templates
INSERT INTO interview_templates (name, description, interview_type_id, difficulty_level_id, duration_minutes, is_public) VALUES
('Quick Technical Screen', 'A 20-minute technical screening for software engineers', 
 (SELECT id FROM interview_types WHERE type = 'technical'),
 (SELECT id FROM difficulty_levels WHERE value = 'medium'), 
 20, true),
('Comprehensive Behavioral', 'A 45-minute behavioral interview focusing on leadership and teamwork',
 (SELECT id FROM interview_types WHERE type = 'behavioral'),
 (SELECT id FROM difficulty_levels WHERE value = 'medium'),
 45, true),
('Senior Engineer Interview', 'A thorough technical interview for senior positions',
 (SELECT id FROM interview_types WHERE type = 'technical'), 
 (SELECT id FROM difficulty_levels WHERE value = 'hard'),
 60, true)
ON CONFLICT DO NOTHING;