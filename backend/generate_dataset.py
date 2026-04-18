"""
FWV Lab Dataset Generator using Mistral-7B (FREE)
Uses HuggingFace Inference API - no cost, just needs HF account token

Setup:
1. Go to https://huggingface.co/settings/tokens
2. Create a free token (Read access is enough)
3. Add it to .env as HF_API_KEY=hf_xxxxxxxxxxxx
4. Run: python generate_dataset.py

Output: fwv_dataset.jsonl (~600-800 QA pairs)
"""

import os
import json
import time
import requests
from pathlib import Path
from dotenv import load_dotenv
import re

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_URL = "https://api.groq.com/openai/v1/chat/completions"

OUTPUT_FILE = "fwv_dataset.jsonl"
CHECKPOINT_FILE = "checkpoint.jsonl"

HEADERS = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}


OUTPUT_FILE = "fwv_dataset.jsonl"

# -------------------------------------------------
# Full FWV Curriculum from Sadiku
# -------------------------------------------------
FWV_CURRICULUM = {
    "Vector Algebra": {
        "subtopics": [
            "Scalars and Vectors",
            "Unit Vectors",
            "Vector Addition and Subtraction",
            "Vector Multiplication (Dot Product)",
            "Vector Multiplication (Cross Product)",
            "Triple Product",
            "Vector Components",
        ],
        "sadiku_chapters": "Chapter 1",
        "real_life_contexts": [
            "Forces on a bridge",
            "Wind velocity direction",
            "GPS navigation",
            "Airplane lift and drag",
            "River current and boat direction",
        ]
    },
    "Vector Calculus": {
        "subtopics": [
            "Cylindrical Coordinate System",
            "Spherical Coordinate System",
            "Cartesian Coordinates",
            "Coordinate Transformation",
            "Differential Length",
            "Differential Area",
            "Differential Volume",
            "Del Operator",
            "Gradient",
            "Divergence",
            "Curl",
            "Laplacian",
            "Stokes Theorem",
            "Divergence Theorem",
        ],
        "sadiku_chapters": "Chapter 2-3",
        "real_life_contexts": [
            "Satellite orbit calculations",
            "Weather balloon tracking",
            "MRI machine magnetic field mapping",
            "Earth's gravitational field",
            "Water flow in pipes",
        ]
    },
    "Electrostatics": {
        "subtopics": [
            "Coulombs Law",
            "Electric Field Intensity",
            "Electric Flux Density",
            "Gauss Law",
            "Electric Potential",
            "Potential Gradient",
            "Electric Dipole",
            "Energy Density",
            "Capacitance",
            "Poissons Equation",
            "Laplaces Equation",
            "Boundary Conditions",
            "Conductors and Insulators",
        ],
        "sadiku_chapters": "Chapter 4-6",
        "real_life_contexts": [
            "Lightning rods",
            "Capacitors in phone chargers",
            "Inkjet printer operation",
            "Photocopier drum",
            "Van de Graaff generator",
            "Touch screens",
            "Electrostatic painting of cars",
        ]
    },
    "Magnetostatics": {
        "subtopics": [
            "Biot-Savart Law",
            "Amperes Law",
            "Magnetic Flux Density",
            "Magnetic Field Intensity",
            "Magnetic Scalar Potential",
            "Magnetic Vector Potential",
            "Boundary Conditions for Magnetic Fields",
            "Inductance",
            "Magnetic Energy",
            "Forces on Magnetic Materials",
        ],
        "sadiku_chapters": "Chapter 7-8",
        "real_life_contexts": [
            "Electric motors",
            "Speakers and headphones",
            "MRI machines",
            "Maglev trains",
            "Compass navigation",
            "Hard drive read/write heads",
            "Transformers in power grids",
        ]
    },
    "Maxwell Equations": {
        "subtopics": [
            "Faradays Law",
            "Displacement Current",
            "Ampere-Maxwell Law",
            "Gauss Law for Electric Fields",
            "Gauss Law for Magnetic Fields",
            "Time Varying Potentials",
            "Transformer EMF",
            "Motional EMF",
            "Maxwell Equations in Differential Form",
            "Maxwell Equations in Integral Form",
            "Boundary Conditions",
        ],
        "sadiku_chapters": "Chapter 9-10",
        "real_life_contexts": [
            "Power transformers",
            "Wireless charging (Qi)",
            "Electric generators",
            "Radio transmission",
            "Induction cooktops",
            "Metal detectors",
            "RFID cards",
        ]
    },
    "Wave Propagation": {
        "subtopics": [
            "Wave Equation",
            "Plane Waves in Lossless Media",
            "Plane Waves in Lossy Media",
            "Skin Effect",
            "Polarization of Waves",
            "Power and the Poynting Vector",
            "Reflection at Normal Incidence",
            "Reflection at Oblique Incidence",
            "Snells Law for EM Waves",
            "Brewster Angle",
            "Total Internal Reflection",
        ],
        "sadiku_chapters": "Chapter 10-11",
        "real_life_contexts": [
            "Microwave ovens",
            "Sunglasses polarization",
            "Fiber optic internet cables",
            "Submarine communication",
            "Radar systems",
            "5G signal propagation",
            "Sunscreen UV absorption",
        ]
    },
    "Transmission Lines": {
        "subtopics": [
            "Types of Transmission Lines",
            "Transmission Line Equations",
            "Characteristic Impedance",
            "Propagation Constant",
            "Reflection Coefficient",
            "Standing Wave Ratio (SWR/VSWR)",
            "Input Impedance",
            "Smith Chart",
            "Impedance Matching",
            "Quarter Wave Transformer",
            "Single Stub Tuning",
            "Transients on Transmission Lines",
        ],
        "sadiku_chapters": "Chapter 11-12",
        "real_life_contexts": [
            "TV antenna cables (coaxial)",
            "PCB trace design",
            "Telephone lines",
            "Ethernet cables",
            "RF amplifier design",
            "Antenna feed networks",
            "Cable TV distribution",
        ]
    }
}

# -------------------------------------------------
# Question Templates
# -------------------------------------------------
QUESTION_TEMPLATES = {
    "conceptual": [
        "What is {topic}?",
        "Explain {topic} in simple terms.",
        "Define {topic}.",
        "What do you mean by {topic}?",
        "Can you explain {topic}?",
        "What is the significance of {topic} in electromagnetics?",
        "How does {topic} work?",
        "Why is {topic} important?",
    ],
    "real_life": [
        "Explain {topic} with a real life example.",
        "Give me a practical example of {topic}.",
        "How is {topic} used in everyday life?",
        "Where do we see {topic} in the real world?",
        "Can you explain {topic} using a real world application?",
        "What are practical applications of {topic}?",
        "How does {topic} apply to {context}?",
        "Explain how {context} uses the concept of {topic}.",
    ],
    "mathematical": [
        "How do you calculate {topic}?",
        "What is the formula for {topic}?",
        "Walk me through the math of {topic}.",
        "Derive the expression for {topic}.",
        "What are the units of {topic}?",
        "What equation governs {topic}?",
    ],
    "problem_solving": [
        "Solve a simple problem involving {topic}.",
        "Give me a step by step example problem on {topic}.",
        "Show me how to solve a {topic} problem.",
        "Work through a numerical example of {topic}.",
        "Give me a practice problem on {topic} with solution.",
    ],
    "comparison": [
        "What is the difference between {topic} and related concepts?",
        "How does {topic} relate to Maxwell's equations?",
        "Compare {topic} in different coordinate systems.",
        "What happens to {topic} at boundaries?",
    ],
    "intuition": [
        "Give me an analogy to understand {topic}.",
        "Explain {topic} like I am a beginner.",
        "How can I visualize {topic}?",
        "What is the physical meaning of {topic}?",
        "Help me intuitively understand {topic}.",
    ]
}

# -------------------------------------------------
# Generator Function
# -------------------------------------------------
def generate_qa_pairs(topic: str, subtopic: str, area_info: dict, question_type: str, context: str = "") -> list[dict]:
    """Generate question-answer pairs using Gemini."""

    real_life_examples = ", ".join(area_info["real_life_contexts"])
    sadiku_ref = area_info["sadiku_chapters"]

    system_prompt = f"""
You are an expert electromagnetics professor who teaches from "Elements of Electromagnetics" by Matthew N.O. Sadiku.

Your teaching style:
- Always ground concepts in physical intuition first
- Use real life analogies before mathematics
- Reference Sadiku's approach and notation
- Give step-by-step solutions for problems
- Keep explanations concise but complete (3-6 sentences for concepts, more for problems)
- Always mention units and physical significance
- Connect to real world applications: {real_life_examples}

Topic area: {topic} ({sadiku_ref})
Current subtopic: {subtopic}
"""

    if question_type == "problem_solving":
        user_prompt = f"""
Generate a complete training example for fine-tuning an AI tutor on {subtopic} from {topic}.

Create ONE realistic exam-style problem with:
1. A clear problem statement with numbers
2. Given information listed
3. Step by step solution
4. Final answer with units
5. Physical interpretation of the result

Format as JSON with keys "prompt" and "response".
The prompt should be the student's question, the response should be the complete solution.
Only output valid JSON, nothing else.
"""
    elif question_type == "real_life":
        user_prompt = f"""
Generate a complete training example for fine-tuning an AI tutor on {subtopic} from {topic}.

Create ONE question-answer pair where:
- The question asks about a real life application of {subtopic}
- The answer explains the concept using this real context: {context}
- The answer connects the real example back to the Sadiku textbook theory
- The answer is intuitive and engaging

Format as JSON with keys "prompt" and "response".
Only output valid JSON, nothing else.
"""
    else:
        user_prompt = f"""
Generate a complete training example for fine-tuning an AI tutor on {subtopic} from {topic}.

Question type: {question_type}

Create ONE question-answer pair where:
- The question is something a student would genuinely ask
- The answer is clear, accurate, and grounded in Sadiku's "Elements of Electromagnetics"
- The answer uses physical intuition and may include a brief real world analogy
- The answer is complete and does not cut off

Format as JSON with keys "prompt" and "response".
Only output valid JSON, nothing else.
"""

    try:
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        api_response = requests.post(MODEL_URL, headers=HEADERS, json={
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": full_prompt}],
            "max_tokens": 1024,
            "temperature": 0.7
        }, timeout=60)
        

        if api_response.status_code == 429:
            print(f"     [RATE LIMIT] Waiting 60s...")
            time.sleep(60)
             # Retry once after waiting
            api_response = requests.post(MODEL_URL, headers=HEADERS, json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": full_prompt}],
                "max_tokens": 1024,
                "temperature": 0.7
            }, timeout=60)

            if api_response.status_code != 200:
                print(f"     [SKIP] Still failing after retry, skipping...")
                return []

        response_json = api_response.json()
        if "choices" not in response_json:
            print(f"     [SKIP] No choices in response")
            return []

        text = response_json["choices"][0]["message"]["content"].strip()

        if not text:                        # ← check FIRST
            print("     [WARN] Empty response, waiting 20s...")
            time.sleep(20)
            return []

        if "```json" in text:               # ← then clean
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        text = re.sub(r'[\x00-\x1f\x7f]', ' ', text)
        text = text.strip()


        parsed = json.loads(text)

        # Validate structure
        if "prompt" in parsed and "response" in parsed:
            return [{"prompt": parsed["prompt"], "response": parsed["response"]}]
        return []

    except Exception as e:
        print(f"  [ERROR] {e}")
        return []


def generate_multi_turn_conversation(topic: str, subtopic: str, area_info: dict) -> list[dict]:
    """Generate a multi-turn follow-up conversation for conversational fine-tuning."""

    system_prompt = f"""
You are Fieldora, an AI tutor for the Fields and Waves Visualization Lab (FWV Lab).
You teach from "Elements of Electromagnetics" by Sadiku.
You are patient, encouraging, and use real life analogies.
"""

    user_prompt = f"""
Generate a realistic 3-turn student-tutor conversation about {subtopic} from {topic}.

The conversation should:
Turn 1: Student asks a basic question about {subtopic}
Turn 2: Student asks a follow-up "can you give me an example?" or "I don't understand, explain simpler"
Turn 3: Student asks a problem or application question

Format as JSON array with objects having "prompt" and "response" keys.
Each object is one turn of the conversation.
Only output valid JSON array, nothing else.
"""

    try:
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        api_response = requests.post(MODEL_URL, headers=HEADERS, json={
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": full_prompt}],
            "max_tokens": 1024,
            "temperature": 0.7
        }, timeout=60)

        if api_response.status_code == 429:
            print(f"     [RATE LIMIT] Waiting 60s...")
            time.sleep(60)
            # Retry once after waiting
            api_response = requests.post(MODEL_URL, headers=HEADERS, json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": full_prompt}],
                "max_tokens": 1024,
                "temperature": 0.7
            }, timeout=60)
            
            if api_response.status_code != 200:
                print(f"     [SKIP] Still failing after retry, skipping...")
                return []

        response_json = api_response.json()
        if "choices" not in response_json:
            print(f"     [SKIP] No choices in response")
            return []
        text = response_json["choices"][0]["message"]["content"].strip()

        if not text:                        # ← check FIRST
            print("     [WARN] Empty response, waiting 20s...")
            time.sleep(20)
            return []

        if "```json" in text:               # ← then clean
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        text = re.sub(r'[\x00-\x1f\x7f]', ' ', text)
        text = text.strip()

        parsed = json.loads(text)

        if isinstance(parsed, list):
            return [p for p in parsed if "prompt" in p and "response" in p]
        return []

    except Exception as e:
        print(f"  [ERROR] Multi-turn: {e}")
        return []


# -------------------------------------------------
# Main Generator
# -------------------------------------------------
def generate_full_dataset():
    all_pairs = load_checkpoint()
    total_generated = 0

    print("=" * 60)
    print("FWV Dataset Generator")
    print("Book: Elements of Electromagnetics by Sadiku")
    print("=" * 60)

    skip_until_topic = "Transmission Lines"
    skip_until_subtopic = "Transmission Line Equations"
    reached_start = False

    for topic, area_info in FWV_CURRICULUM.items():
        if not reached_start and topic != skip_until_topic:
            print(f"⏭️ Skipping {topic} (already done)")
            continue

        print(f"\n📚 Generating: {topic} ({area_info['sadiku_chapters']})")
        print("-" * 40)

        for subtopic in area_info["subtopics"]:

            if not reached_start:
                if subtopic != skip_until_subtopic:
                    print(f"  ⏭️ Skipping {subtopic} (already done)")
                    continue
                reached_start = True

            print(f"  📖 Subtopic: {subtopic}")

            pairs = generate_qa_pairs(topic, subtopic, area_info, "conceptual")
            all_pairs.extend(pairs)
            print(f"     ✅ Conceptual: {len(pairs)} pairs")
            time.sleep(4)

            for context in area_info["real_life_contexts"][:2]:
                pairs = generate_qa_pairs(topic, subtopic, area_info, "real_life", context)
                all_pairs.extend(pairs)
                time.sleep(4)
            print(f"     ✅ Real life: 2 pairs")

            pairs = generate_qa_pairs(topic, subtopic, area_info, "problem_solving")
            all_pairs.extend(pairs)
            print(f"     ✅ Problem solving: {len(pairs)} pairs")
            time.sleep(4)

            pairs = generate_qa_pairs(topic, subtopic, area_info, "intuition")
            all_pairs.extend(pairs)
            print(f"     ✅ Intuition: {len(pairs)} pairs")
            time.sleep(4)

            pairs = generate_qa_pairs(topic, subtopic, area_info, "mathematical")
            all_pairs.extend(pairs)
            print(f"     ✅ Mathematical: {len(pairs)} pairs")
            time.sleep(6)

            pairs = generate_multi_turn_conversation(topic, subtopic, area_info)
            all_pairs.extend(pairs)
            print(f"     ✅ Multi-turn: {len(pairs)} pairs")
            time.sleep(6)

            total_generated = len(all_pairs)
            print(f"     📊 Total so far: {total_generated} pairs")
            save_checkpoint(all_pairs)

    return all_pairs

def save_dataset(pairs: list[dict], output_file: str):
    """Save dataset to JSONL format."""
    with open(output_file, "w", encoding="utf-8") as f:
        for pair in pairs:
            f.write(json.dumps(pair, ensure_ascii=False) + "\n")
    print(f"\n✅ Dataset saved: {output_file}")
    print(f"📊 Total pairs: {len(pairs)}")


def save_checkpoint(pairs: list[dict], checkpoint_file: str = "checkpoint.jsonl"):
    """Save intermediate checkpoint so you don't lose progress."""
    with open(checkpoint_file, "w", encoding="utf-8") as f:
        for pair in pairs:
            f.write(json.dumps(pair, ensure_ascii=False) + "\n")


def load_checkpoint(checkpoint_file: str = "checkpoint.jsonl") -> list[dict]:
    """Load from checkpoint if exists."""
    if not Path(checkpoint_file).exists():
        return []
    pairs = []
    with open(checkpoint_file, "r", encoding="utf-8") as f:
        for line in f:
            try:
                pairs.append(json.loads(line.strip()))
            except:
                continue
    print(f"[INFO] Loaded {len(pairs)} pairs from checkpoint")
    return pairs


def preview_dataset(output_file: str, n: int = 3):
    """Preview first n entries of the dataset."""
    print(f"\n{'='*60}")
    print(f"DATASET PREVIEW (first {n} entries)")
    print("=" * 60)
    with open(output_file, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i >= n:
                break
            pair = json.loads(line)
            print(f"\n[{i+1}] PROMPT:\n{pair['prompt']}")
            print(f"\n    RESPONSE:\n{pair['response'][:300]}...")
            print("-" * 40)


# -------------------------------------------------
# Run
# -------------------------------------------------
if __name__ == "__main__":
    print("Starting FWV dataset generation...")
    print("This will take 20-40 minutes depending on rate limits.\n")

    # Generate
    pairs = generate_full_dataset()

    # Save
    save_dataset(pairs, OUTPUT_FILE)

    # Preview
    preview_dataset(OUTPUT_FILE)

    print("\n🎉 Done! Next step: use fwv_finetune.py to fine-tune your model.")