import os
import json
import logging
import pandas as pd
from sqlalchemy import create_engine, text
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Mock Data for testing
MOCK_EVENTS = [
    {"id": "evt_1", "name": "AI Hackathon", "tags": ["AI", "machine learning", "hackathon"]},
    {"id": "evt_2", "name": "Web Dev Bootcamp", "tags": ["web", "react", "javascript"]},
    {"id": "evt_3", "name": "Cybersecurity Workshop", "tags": ["security", "networking", "workshop"]},
    {"id": "evt_4", "name": "Robotics Fest", "tags": ["robotics", "hardware", "iot"]},
    {"id": "evt_5", "name": "Data Science Summit", "tags": ["data", "AI", "python", "analytics"]},
    {"id": "evt_6", "name": "UI/UX Design Masterclass", "tags": ["design", "figma", "uiux"]}
]

MOCK_USERS = [
    {"id": "user_1", "interests": ["AI", "python", "machine learning", "data"]},
    {"id": "user_2", "interests": ["web", "design", "figma"]},
    {"id": "user_3", "interests": ["AI", "python", "robotics"]},
    {"id": "101", "interests": ["web", "react"]}
]

MOCK_PARTICIPATIONS = [
    {"user_id": "user_3", "event_id": "evt_1"},
    {"user_id": "user_3", "event_id": "evt_4"},
    {"user_id": "user_2", "event_id": "evt_6"}
]

def get_db_engine():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return None
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    try:
        return create_engine(db_url)
    except Exception as e:
        logger.error(f"Error creating database engine: {e}")
        return None

def fetch_data_with_sqlalchemy(user_id):
    engine = get_db_engine()
    
    events, all_users, participations = [], [], []
    
    if engine:
        try:
            with engine.connect() as conn:
                # 1. Fetch Events
                events_result = conn.execute(text("SELECT id, name, tags FROM events WHERE status != 'completed'"))
                events = [{"id": row.id, "name": row.name, "tags": row.tags} for row in events_result]
                
                # 2. Fetch all User Profiles
                users_result = conn.execute(text("SELECT id, interests FROM profiles"))
                for row in users_result:
                    user_interests = row.interests
                    if isinstance(user_interests, str):
                        try:
                            user_interests = json.loads(user_interests)
                        except json.JSONDecodeError:
                            user_interests = [user_interests]
                    all_users.append({"id": str(row.id), "interests": user_interests})
                
                # 3. Fetch Event Participations
                parts_result = conn.execute(text("SELECT user_id, event_id FROM event_participants"))
                participations = [{"user_id": str(row.user_id), "event_id": str(row.event_id)} for row in parts_result]
                
                if events and all_users:
                    return events, all_users, participations
        except Exception as e:
            logger.warning(f"Database fetch failed, falling back to mock data. Error: {e}")
            
    # Fallback to dummy data
    logger.info("Using mock data for recommendation logic.")
    return MOCK_EVENTS, MOCK_USERS, MOCK_PARTICIPATIONS

def get_recommendations(user_id, num_recommendations=5):
    """
    Hybrid Recommendation:
    1. Content-Based: Cosine similarity between target user interests and event tags.
    2. Collaborative Filtering: Similarity between users to find events joined by similar users.
    """
    events, all_users, participations = fetch_data_with_sqlalchemy(user_id)
    
    if not events:
        return []
        
    events_df = pd.DataFrame(events)
    events_df['tags_str'] = events_df['tags'].apply(lambda x: " ".join(x) if isinstance(x, list) else str(x))
    
    # Find target user
    target_user = next((u for u in all_users if u["id"] == user_id), None)
    if not target_user:
        # Default fallback interests
        target_user = {"id": user_id, "interests": ["AI", "hackathon"]}
        all_users.append(target_user)
        
    target_interest_str = " ".join(target_user["interests"])
    
    # ---------------- 1. Content-Based Filtering ----------------
    vectorizer = TfidfVectorizer(stop_words='english')
    all_content_text = [target_interest_str] + events_df['tags_str'].tolist()
    
    try:
        content_matrix = vectorizer.fit_transform(all_content_text)
        user_content_vector = content_matrix[0]
        events_content_matrix = content_matrix[1:]
        content_similarities = cosine_similarity(user_content_vector, events_content_matrix).flatten()
    except ValueError:
        content_similarities = [0] * len(events_df)
        
    events_df['content_score'] = content_similarities
    
    # ---------------- 2. Collaborative Filtering ----------------
    collab_scores = [0.0] * len(events_df)
    
    # We only compute collaborative if we have multiple users
    if len(all_users) > 1:
        users_df = pd.DataFrame(all_users)
        users_df['interests_str'] = users_df['interests'].apply(lambda x: " ".join(x) if isinstance(x, list) else str(x))
        
        # We need the target user's index in the dataframe
        target_idx = users_df.index[users_df['id'] == user_id].tolist()[0]
        
        try:
            user_matrix = vectorizer.fit_transform(users_df['interests_str'].tolist())
            target_user_vector = user_matrix[target_idx]
            user_similarities = cosine_similarity(target_user_vector, user_matrix).flatten()
            
            # Add similarity back
            users_df['similarity'] = user_similarities
            
            # Find similar users (excluding the target user itself)
            similar_users = users_df[users_df['id'] != user_id].sort_values(by='similarity', ascending=False)
            
            # Top 3 similar users who have similarity > 0
            top_similar_users = similar_users[similar_users['similarity'] > 0.1].head(3)
            
            # Gather events those similar users have joined
            for _, sim_user in top_similar_users.iterrows():
                sim_user_id = sim_user['id']
                sim_score = sim_user['similarity']
                
                joined_events = [p["event_id"] for p in participations if p["user_id"] == sim_user_id]
                
                # Apply boost to those events proportional to the user similarity
                for i, event in events_df.iterrows():
                    if event['id'] in joined_events:
                        # Add a collaborative boost (adjustable weight)
                        collab_scores[i] += sim_score * 0.5 
                        
        except ValueError:
            pass # Ignore if vocabulary error
            
    events_df['collab_score'] = collab_scores
    
    # ---------------- Combine & Finalize ----------------
    # Final Score = Weighted Content Score + Weighted Collaborative Score
    # For example, 70% weight for content-based, 30% for collaborative
    events_df['final_score'] = (events_df['content_score'] * 0.7) + (events_df['collab_score'] * 0.3)
    
    recommended_events = events_df.sort_values(by='final_score', ascending=False).head(num_recommendations)
    
    # Build clean output
    result = recommended_events[['id', 'name', 'tags', 'final_score', 'content_score', 'collab_score']].to_dict(orient="records")
    return result

# Expose function with the name expected by router
def compute_hybrid_recommendations(user_id, num_recommendations=5):
    return get_recommendations(user_id, num_recommendations)
