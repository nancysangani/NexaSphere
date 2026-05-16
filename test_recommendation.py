import os
import sys

# Add the server-python directory to path so we can import services
sys.path.append(os.path.join(os.path.dirname(__file__), 'server-python'))

from services.recommendation_logic import compute_hybrid_recommendations, MOCK_USERS

def test_recommendations():
    print("--- Testing /recommend/events/101 ---")
    print("\n[Scenario 1] User 101 has interests: ['web', 'react']")
    recs1 = compute_hybrid_recommendations("101", num_recommendations=3)
    for r in recs1:
        print(f" - Event: {r['name']} | Tags: {r['tags']} | Final Score: {r['final_score']:.4f}")

    print("\n[Scenario 2] Changing User 101 interests to: ['AI', 'machine learning', 'python']")
    # Update MOCK_USERS in memory for testing
    for u in MOCK_USERS:
        if u["id"] == "101":
            u["interests"] = ["AI", "machine learning", "python"]
            break
            
    recs2 = compute_hybrid_recommendations("101", num_recommendations=3)
    for r in recs2:
        print(f" - Event: {r['name']} | Tags: {r['tags']} | Final Score: {r['final_score']:.4f}")

if __name__ == "__main__":
    test_recommendations()
