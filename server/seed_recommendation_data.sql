-- Seed Data for Recommendation Engine

-- 1. Create 'Profile' table if it does not exist
CREATE TABLE IF NOT EXISTS "Profile" (
  id text PRIMARY KEY,
  interests jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- 2. Create 'Events' table if it does not exist
CREATE TABLE IF NOT EXISTS "Events" (
  id text PRIMARY KEY,
  name text NOT NULL,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'upcoming'
);

-- 3. Create 'event_participants' table for collaborative filtering
CREATE TABLE IF NOT EXISTS event_participants (
  user_id text NOT NULL,
  event_id text NOT NULL,
  PRIMARY KEY (user_id, event_id)
);

-- Clear existing dummy data to avoid conflicts
DELETE FROM event_participants WHERE user_id LIKE 'user_%' OR user_id = '101';
DELETE FROM "Profile" WHERE id LIKE 'user_%' OR id = '101';
DELETE FROM "Events" WHERE id LIKE 'evt_%';

-- 4. Insert 5 Users (including user 101 for testing)
INSERT INTO "Profile" (id, interests) VALUES
('101', '["Web", "Design", "React", "Frontend"]'),
('user_2', '["AI", "Machine Learning", "Python"]'),
('user_3', '["Cybersecurity", "Networking"]'),
('user_4', '["Design", "Figma", "UI/UX"]'),
('user_5', '["Web", "Backend", "NodeJS", "Databases"]');

-- 5. Insert 10 Events
INSERT INTO "Events" (id, name, tags, status) VALUES
('evt_1', 'React Frontend Masterclass', '["Web", "React", "Frontend", "JavaScript"]', 'upcoming'),
('evt_2', 'Advanced Figma Prototyping', '["Design", "Figma", "UI/UX"]', 'upcoming'),
('evt_3', 'AI for Beginners', '["AI", "Machine Learning", "Python"]', 'upcoming'),
('evt_4', 'Fullstack Web Bootcamp', '["Web", "React", "NodeJS", "Backend"]', 'upcoming'),
('evt_5', 'Ethical Hacking Workshop', '["Cybersecurity", "Networking", "Security"]', 'upcoming'),
('evt_6', 'Web Design Fundamentals', '["Web", "Design", "CSS", "Frontend"]', 'upcoming'),
('evt_7', 'Deep Learning Symposium', '["AI", "Machine Learning", "Data Science"]', 'upcoming'),
('evt_8', 'Cloud Architecture 101', '["Backend", "Cloud", "AWS"]', 'upcoming'),
('evt_9', 'UX Research Methods', '["Design", "UI/UX", "Research"]', 'upcoming'),
('evt_10', 'Hackathon: Future Web', '["Web", "Hackathon", "Frontend", "Backend"]', 'upcoming');

-- 6. Insert Event Participations (Collaborative Data)
-- Similar users to 101 are user_4 (Design) and user_5 (Web).
INSERT INTO event_participants (user_id, event_id) VALUES
('user_4', 'evt_2'),
('user_4', 'evt_6'),
('user_5', 'evt_4'),
('user_5', 'evt_10'),
('user_2', 'evt_3'),
('user_2', 'evt_7'),
('user_3', 'evt_5');
