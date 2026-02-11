import os
from dotenv import load_dotenv
from pathlib import Path
from google import genai

# -------------------------------------------------
# Load .env
# -------------------------------------------------
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)

# -------------------------------------------------
# Conversation State (IMPORTANT)
# -------------------------------------------------
current_subtopic = None
last_bot_explanation = None

FWV_STRUCTURE = {
    "Vector Algebra": [
        "Scalars and Vectors",
        "Vectors",
        "Addition",
        "Multiplication",
        "Triple Product"
    ],
    "Vector Calculus": [
        "Cylindrical Coordinates",
        "Spherical Coordinates",
        "Cartesian, Cylindrical and Spherical",
        "Differential Length, Area and Volume",
        "Del Operator"
    ],
    "Electrostatics": [
        "Intro",
        "Electric Field & Flux",
        "Electric Potential",
        "Electric Dipole"
    ],
    "Maxwell Equations": [
        "Gauss Law",
        "Magnetism",
        "Faraday Law",
        "Ampere Law",
        "Displacement Current",
        "Time Varying Potential",
        "EMF"
    ],
    "Wave Propagation": [
        "Types of Waves",
        "Wave Power",
        "Energy",
        "Plane Wave Analysis",
        "Wave Reflection"
    ]
}

TOPIC_TO_AREA = {
    topic.lower(): area
    for area, topics in FWV_STRUCTURE.items()
    for topic in topics
}

def append_area_and_topic(answer: str, topic: str) -> str:
    area = TOPIC_TO_AREA.get(topic)

    if not area:
        return answer  # safety fallback

    return (
        f"{answer}\n\n"
        f"Area: {area}\n"
        f"Topic: {topic}"
    )


# -------------------------------------------------
# Main Tutor Function
# -------------------------------------------------
def generate_explanation(context: str, question: str) -> str:
    global current_subtopic, last_bot_explanation

    # -------------------------------------------------
    # SYSTEM INSTRUCTION (THE BRAIN)
    # -------------------------------------------------
    sys_instruct = """
    You are a patient, adaptive teaching assistant for the Fields and Waves Visualisation Lab (FWV Lab).

    YOUR ROLE:
    - You are a tutor, not a Q&A bot.
    - You help students learn concepts step by step.

    SOCIAL BEHAVIOR:
    - You may respond naturally to greetings or polite conversation
      (e.g., hi, hello, how are you).
    - Do not teach during small talk.

    ACADEMIC TEACHING RULES:
    - Answer academic content ONLY if it exists in the provided FWV Lab context.
    - Stay within the current topic unless the user explicitly changes it.
    - Think internally and NEVER reveal your reasoning.
    - Avoid equations unless explicitly asked.

    FOLLOW-UP INTELLIGENCE:
    - If the user asks for:
      • easy / simple / layman explanation → simplify the idea
      • example → give a real-world or intuitive example
      • doubt / confusion → clarify gently without restarting
      • a word or phrase → explain ONLY that word in context

    WORD-LEVEL DOUBTS:
    - Explain the meaning of a word based on how it is used in the last explanation.
    - Do NOT give dictionary definitions.
    - Do NOT change the topic.

    NAVIGATION:
    - End academic responses with:
      "To learn more, visit: <Current Subtopic>"

    OUTPUT STYLE:
    - Natural teaching tone
    - Short, clear paragraphs
    - No labels, no headings
    """

    # -------------------------------------------------
    # USER PROMPT (STATE AWARE)
    # -------------------------------------------------
    user_prompt = f"""
    FWV Lab Context:
    {context}

    Current Topic:
    {current_subtopic if current_subtopic else "Not set"}

    Last Explanation Given:
    {last_bot_explanation if last_bot_explanation else "None"}

    User Message:
    {question}

    IMPORTANT:
    - Stay within the current topic.
    - Adapt explanation depth based on the user's intent.
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config={
                "system_instruction": sys_instruct,
                "temperature": 0.25,
            }
        )

        if not response.text:
            return (
                "I can help you with Fields and Waves topics from the FWV Lab notes.\n"
                "Please choose a topic from the sidebar to continue."
            )

        final_answer = response.text.strip()

        # -------------------------------------------------
        # Update conversation memory safely
        # -------------------------------------------------
        if "To learn more, visit:" in final_answer:
            last_bot_explanation = final_answer
            # Extract subtopic name (best-effort)
            try:
                current_subtopic = final_answer.split("visit:")[-1].strip()
            except:
                pass

        return append_area_and_topic(final_answer, current_subtopic)

    except Exception as e:
        print(f"Gemini API Error: {e}")
        return "I'm having trouble accessing the FWV Lab notes right now."

# -------------------------------------------------
# Example Terminal Test
# -------------------------------------------------
if __name__ == "__main__":
    sample_context = """
    Displacement Current:
    Introduced by Maxwell to explain how a changing electric field can produce
    a magnetic field, even in the absence of conduction current.

    Gauss Law:
    The total electric flux through a closed surface is proportional
    to the charge enclosed.

    Faraday Law:
    A changing magnetic field induces an electric field.
    """

    print("FWV AI Tutor (type 'exit' to quit)")

    while True:
        user_input = input("\nYou: ")
        if user_input.lower() in ["exit", "quit"]:
            print("FWV Bot: Bye! 👋 Keep learning Fields & Waves.")
            break

        reply = generate_explanation(sample_context, user_input)
        print("\nFWV Bot:", reply)
