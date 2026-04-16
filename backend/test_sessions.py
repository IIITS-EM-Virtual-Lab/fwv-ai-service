#!/usr/bin/env python3
"""
Test script to verify per-user session isolation in the chatbot backend.
Run this from the IIIT Sri City - AI Integration directory.
"""

import requests
import json
import time

# Replace with your actual backend URL
BACKEND_URL = "http://localhost:8000/ask"  # Change if deployed elsewhere

def test_user_session(user_id, messages):
    """Test a conversation for a specific user"""
    print(f"\n=== Testing User {user_id} ===")

    for i, message in enumerate(messages):
        print(f"User {user_id} sends: '{message}'")

        payload = {
            "query": message,
            "session_id": user_id
        }

        try:
            response = requests.post(BACKEND_URL, json=payload, timeout=10)
            response.raise_for_status()
            data = response.json()
            print(f"Bot response: {data['answer'][:100]}...")
        except requests.exceptions.RequestException as e:
            print(f"Error: {e}")
            return False

        time.sleep(1)  # Small delay between messages

    return True

def main():
    print("Testing per-user session isolation...")

    # Test User A's conversation
    user_a_messages = [
        "Tell me about Vector Algebra",
        "What is addition in vectors?",
        "Now tell me about Electrostatics"
    ]

    # Test User B's conversation (should be independent)
    user_b_messages = [
        "Explain Maxwell Equations",
        "What is Gauss Law?",
        "Tell me about Vector Calculus"
    ]

    # Run tests
    success_a = test_user_session("user_a", user_a_messages)
    success_b = test_user_session("user_b", user_b_messages)

    if success_a and success_b:
        print("\n✅ Tests completed successfully!")
        print("Check that:")
        print("- User A's topic stayed within Vector Algebra/Electrostatics")
        print("- User B's topic stayed within Maxwell Equations/Vector Calculus")
        print("- No cross-contamination between users")
    else:
        print("\n❌ Tests failed - check backend logs")

if __name__ == "__main__":
    main()