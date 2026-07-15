import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Google Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    print("WARNING: GEMINI_API_KEY is not set. Gemini operations will fail.")

# Default Gemini model
MODEL_NAME = "gemini-3.5-flash"

def truncate_text(text, max_chars=40000):
    """Truncate text to avoid exceeding token limits."""
    if not text:
        return ""
    if len(text) > max_chars:
        return text[:max_chars] + "\n... [truncated due to length] ..."
    return text

def run_gemini_json(prompt, system_instruction=None):
    """Utility function to call Gemini model and request a JSON response."""
    try:
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=system_instruction
        )
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        text = response.text
        # Clean up code blocks if model added them despite the mime_type config
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        raise ValueError(f"AI generation failed: {str(e)}")

def generate_summary(text_content):
    """Generate topic overview, key concepts, definitions, principles, and revision notes."""
    truncated = truncate_text(text_content)
    system_instruction = "You are an expert educator. Your goal is to summarize study materials into structured revision guides."
    
    prompt = f"""
    Analyze the following study material and generate a comprehensive study summary.
    The output MUST be a JSON object with the following structure:
    {{
      "topicOverview": "A high-level paragraph summarizing what this material covers.",
      "keyConcepts": [
        {{
          "concept": "Concept name",
          "description": "Thorough explanation of the concept."
        }}
      ],
      "definitions": [
        {{
          "term": "Term or acronym",
          "meaning": "Exact definition or meaning."
        }}
      ],
      "principles": [
        {{
          "name": "Principle/Law/Rule name",
          "detail": "Description of its core application or mechanism."
        }}
      ],
      "revisionNotes": [
        "Revision bullet point 1",
        "Revision bullet point 2"
      ]
    }}
    
    Ensure all fields contain high-quality content derived from the text. Return only valid JSON.

    Study Material:
    ---
    {truncated}
    ---
    """
    return run_gemini_json(prompt, system_instruction)

def generate_flashcards(text_content):
    """Generate Q&A flashcards with topic and difficulty."""
    truncated = truncate_text(text_content)
    system_instruction = "You are a professional study companion. Your task is to generate high-quality learning flashcards."
    
    prompt = f"""
    Create a set of 8-12 study flashcards from the study material below.
    The output MUST be a JSON object with the following structure:
    {{
      "cards": [
        {{
          "id": "unique_id_string_1",
          "question": "Question text here?",
          "answer": "Answer text here.",
          "topic": "Subtopic name",
          "difficulty": "Easy" or "Medium" or "Hard",
          "isKnown": false
        }}
      ]
    }}
    
    Ensure questions are clear and testing-oriented, and answers are concise but informative. Return only valid JSON.

    Study Material:
    ---
    {truncated}
    ---
    """
    return run_gemini_json(prompt, system_instruction)

def generate_quiz(text_content, quiz_type, num_questions=5):
    """Generate a quiz with MCQ, TF, or Short Answer questions."""
    truncated = truncate_text(text_content)
    system_instruction = "You are an academic examiner. Generate fair and testing quiz questions based on the reference text."
    
    type_desc = ""
    if quiz_type == 'mcq':
      type_desc = "Multiple Choice Questions. Provide 4 option strings in the 'options' list. The 'answer' must be the exact text of the correct option."
    elif quiz_type == 'tf':
      type_desc = "True/False Questions. Provide exactly ['True', 'False'] in 'options'. The 'answer' must be either 'True' or 'False'."
    else:
      type_desc = "Short Answer Questions. Keep the 'options' array empty. The 'answer' should describe the key expected concepts in 1-2 sentences."

    prompt = f"""
    Generate a quiz of exactly {num_questions} questions of type '{quiz_type}' ({type_desc}) based on the study material below.
    The output MUST be a JSON object matching this structure:
    {{
      "questions": [
        {{
          "id": "q1",
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Option A",
          "explanation": "Detailed explanation of why this answer is correct."
        }}
      ]
    }}
    
    Ensure questions test comprehension, and the explanation is pedagogical. Return only valid JSON.

    Study Material:
    ---
    {truncated}
    ---
    """
    return run_gemini_json(prompt, system_instruction)

def evaluate_short_answers(questions, user_answers):
    """Use Gemini to grade short answer questions and provide detailed feedback."""
    system_instruction = "You are an objective academic evaluator grading short answer questions."
    
    prompt = f"""
    Evaluate the following user answers against the questions and expected answer guide.
    For each answer:
    1. Score the answer (from 0 to 100).
    2. Determine if it is 'isCorrect' (score >= 60).
    3. Provide constructive feedback explaining what they got right, what they missed, or how to improve.
    4. Identify any specific weak topics (e.g., "Mitochondria", "Big O Notation") if their score is below 60.

    Questions & Student Answers:
    """
    
    for i, q in enumerate(questions):
        user_ans = user_answers.get(q['id'], "")
        prompt += f"\n--- Question {i+1} ---\n"
        prompt += f"ID: {q['id']}\n"
        prompt += f"Question: {q['question']}\n"
        prompt += f"Expected Guide: {q['answer']}\n"
        prompt += f"Student Answer: {user_ans}\n"
        
    prompt += """
    
    The output MUST be a JSON object with this structure:
    {
      "evaluations": [
        {
          "questionId": "q1",
          "score": 85,
          "isCorrect": true,
          "feedback": "Feedback text here...",
          "weakTopics": ["Topic Name"]
        }
      ]
    }
    
    Return only valid JSON.
    """
    return run_gemini_json(prompt, system_instruction)

def generate_schedule(text_contents_list, weak_topics):
    """Generate a personalized 7-day study plan based on study materials and weak topics."""
    # Combine texts and truncate
    combined_text = "\n\n".join(text_contents_list)
    truncated = truncate_text(combined_text, max_chars=30000)
    weak_topics_str = ", ".join(weak_topics) if weak_topics else "None identified yet"
    
    system_instruction = "You are a personal academic advisor and scheduling coach."
    
    prompt = f"""
    Generate a highly customized, realistic 7-day study plan for a student.
    
    Student context:
    - Target weak topics needing review: {weak_topics_str}
    - Study materials available: Summarized in the reference text below.
    
    Create a 7-day plan (Day 1 through Day 7). 
    Ensure you explicitly address the weak topics in the first few days, and review the uploaded study materials throughout the plan.
    
    The output MUST be a JSON object with this structure:
    {{
      "plan": [
        {{
          "day": 1,
          "dayName": "Monday",
          "topic": "Topic of Focus",
          "tasks": [
            "Read concept X",
            "Solve 5 practice problems"
          ],
          "timeSlot": "2 Hours (e.g., 6:00 PM - 8:00 PM)",
          "tips": [
            "Study tip 1",
            "Study tip 2"
          ]
        }}
      ]
    }}
    
    Provide exactly 7 days of items. Return only valid JSON.

    Reference Study Material Context:
    ---
    {truncated}
    ---
    """
    return run_gemini_json(prompt, system_instruction)
