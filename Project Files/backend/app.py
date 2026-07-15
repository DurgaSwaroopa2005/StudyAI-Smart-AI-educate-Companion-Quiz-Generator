import os
import datetime
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from dotenv import load_dotenv
from firebase_admin import auth as firebase_auth

from firebase_config import db, bucket
import services.parser_service as parser_service
import services.gemini_service as gemini_service

load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes and origins during development
CORS(app, resources={r"/*": {"origins": "*"}})

def get_auth_user():
    """Extract and verify Firebase ID Token from Authorization Header."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        id_token = auth_header.split(" ")[1]
        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            return decoded_token["uid"]
        except Exception as e:
            print(f"Token verification failed: {e}")
            return None
            
    # Developer back-door options to ease initial testing and configuration
    mock_uid = request.headers.get("X-Mock-User-Id")
    if mock_uid:
        return mock_uid
        
    # Check JSON body as a last resort
    if request.is_json:
        try:
            return request.json.get("userId")
        except Exception:
            pass
    return None

@app.before_request
def before_request():
    g.user_id = get_auth_user()

def require_auth():
    if not g.user_id:
        return jsonify({"error": "Unauthorized. Missing or invalid Bearer token."}), 401
    return None

def log_activity(user_id, message):
    """Log an activity event for the user."""
    try:
        activity_ref = db.collection("activity").document()
        activity_ref.set({
            "activityId": activity_ref.id,
            "userId": user_id,
            "message": message,
            "createdAt": datetime.datetime.utcnow().isoformat() + 'Z'
        })
    except Exception as e:
        print(f"Failed to log activity: {e}")

@app.route("/")
def index():
    return jsonify({
        "status": "online",
        "service": "StudyAI Flask Backend REST API",
        "timestamp": datetime.datetime.utcnow().isoformat() + 'Z'
    })

@app.route("/upload", methods=["POST"])
def upload_material():
    auth_error = require_auth()
    if auth_error:
        return auth_error

    user_id = g.user_id
    raw_text = request.form.get("text")
    file_name = request.form.get("fileName", "Pasted_Text.txt")
    
    extracted_text = ""
    file_url = ""
    file_type = "text"
    
    # Handle File Upload
    if "file" in request.files:
        uploaded_file = request.files["file"]
        if uploaded_file.filename != "":
            file_name = uploaded_file.filename
            file_bytes = uploaded_file.read()
            file_type = file_name.split('.')[-1].lower() if '.' in file_name else 'unknown'
            
            # Extract Text content
            try:
                extracted_text = parser_service.extract_text(file_bytes, file_name)
            except Exception as e:
                return jsonify({"error": f"Failed to extract text: {str(e)}"}), 400
                
            # Upload file to Firebase Storage if bucket is configured
            if bucket:
                try:
                    timestamp = int(datetime.datetime.utcnow().timestamp())
                    blob_path = f"users/{user_id}/materials/{timestamp}_{file_name}"
                    blob = bucket.blob(blob_path)
                    # Use upload_from_string for raw bytes
                    blob.upload_from_string(file_bytes, content_type=uploaded_file.content_type or 'application/octet-stream')
                    blob.make_public()
                    file_url = blob.public_url
                except Exception as storage_err:
                    print(f"Firebase Storage upload failed: {storage_err}")
                    file_url = "local-storage-mock"
            else:
                file_url = "storage-not-configured-mock"
                
    elif raw_text:
        extracted_text = raw_text.strip()
        file_type = "text"
        file_url = "pasted-text"
    else:
        return jsonify({"error": "No file or text data found."}), 400

    if not extracted_text:
        return jsonify({"error": "Text content is empty or could not be parsed."}), 400

    # Write document record to Firestore
    doc_ref = db.collection("documents").document()
    doc_id = doc_ref.id
    
    doc_data = {
        "docId": doc_id,
        "userId": user_id,
        "fileName": file_name,
        "fileUrl": file_url,
        "fileType": file_type,
        "textContent": extracted_text,
        "createdAt": datetime.datetime.utcnow().isoformat() + 'Z'
    }
    
    doc_ref.set(doc_data)
    log_activity(user_id, f"Uploaded study material: {file_name}")
    
    return jsonify(doc_data), 200

@app.route("/documents", methods=["GET"])
def get_documents():
    auth_error = require_auth()
    if auth_error:
        return auth_error
        
    try:
        docs_ref = db.collection("documents").where("userId", "==", g.user_id).get()
        docs = []
        for d in docs_ref:
            doc_dict = d.to_dict()
            # Strip heavy text content when listing to save bandwith
            doc_dict.pop("textContent", None)
            docs.append(doc_dict)
        # Sort documents by createdAt descending
        docs.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return jsonify(docs), 200
    except Exception as e:
        return jsonify({"error": f"Failed to list documents: {str(e)}"}), 500

@app.route("/documents/<doc_id>", methods=["DELETE"])
def delete_document(doc_id):
    auth_error = require_auth()
    if auth_error:
        return auth_error
        
    try:
        doc_ref = db.collection("documents").document(doc_id)
        doc_snap = doc_ref.get()
        if not doc_snap.exists:
            return jsonify({"error": "Document not found"}), 404
            
        doc_data = doc_snap.to_dict()
        if doc_data.get("userId") != g.user_id:
            return jsonify({"error": "Unauthorized to delete this document"}), 403
            
        doc_ref.delete()
        log_activity(g.user_id, f"Deleted study material: {doc_data.get('fileName')}")
        return jsonify({"success": True, "message": "Document deleted"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to delete document: {str(e)}"}), 500

@app.route("/generate-summary", methods=["POST"])
def generate_summary():
    auth_error = require_auth()
    if auth_error:
        return auth_error
        
    doc_id = request.json.get("docId")
    if not doc_id:
        return jsonify({"error": "Missing docId"}), 400
        
    # Get document
    doc_ref = db.collection("documents").document(doc_id)
    doc_snap = doc_ref.get()
    if not doc_snap.exists:
        return jsonify({"error": "Document not found"}), 404
        
    doc_data = doc_snap.to_dict()
    if doc_data.get("userId") != g.user_id:
        return jsonify({"error": "Unauthorized"}), 403
        
    text_content = doc_data.get("textContent", "")
    
    try:
        summary_data = gemini_service.generate_summary(text_content)
        
        summary_ref = db.collection("summaries").document()
        summary_id = summary_ref.id
        
        summary_record = {
            "summaryId": summary_id,
            "docId": doc_id,
            "userId": g.user_id,
            "fileName": doc_data.get("fileName"),
            "topicOverview": summary_data.get("topicOverview"),
            "keyConcepts": summary_data.get("keyConcepts", []),
            "definitions": summary_data.get("definitions", []),
            "principles": summary_data.get("principles", []),
            "revisionNotes": summary_data.get("revisionNotes", []),
            "createdAt": datetime.datetime.utcnow().isoformat() + 'Z'
        }
        
        summary_ref.set(summary_record)
        log_activity(g.user_id, f"Generated summary guide for {doc_data.get('fileName')}")
        
        return jsonify(summary_record), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate summary: {str(e)}"}), 500

@app.route("/summaries", methods=["GET"])
def get_summaries():
    auth_error = require_auth()
    if auth_error:
        return auth_error
        
    try:
        summaries_ref = db.collection("summaries").where("userId", "==", g.user_id).get()
        summaries = [s.to_dict() for s in summaries_ref]
        summaries.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return jsonify(summaries), 200
    except Exception as e:
        return jsonify({"error": f"Failed to list summaries: {str(e)}"}), 500

@app.route("/generate-flashcards", methods=["POST"])
def generate_flashcards():
    auth_error = require_auth()
    if auth_error:
        return auth_error
        
    doc_id = request.json.get("docId")
    if not doc_id:
        return jsonify({"error": "Missing docId"}), 400
        
    doc_ref = db.collection("documents").document(doc_id)
    doc_snap = doc_ref.get()
    if not doc_snap.exists:
        return jsonify({"error": "Document not found"}), 404
        
    doc_data = doc_snap.to_dict()
    if doc_data.get("userId") != g.user_id:
        return jsonify({"error": "Unauthorized"}), 403
        
    text_content = doc_data.get("textContent", "")
    
    try:
        flashcards_data = gemini_service.generate_flashcards(text_content)
        
        # Save flashcards using docId as document key for 1-to-1 document flashcard mapping
        flashcard_ref = db.collection("flashcards").document(doc_id)
        
        flashcard_record = {
            "flashcardId": doc_id,
            "docId": doc_id,
            "userId": g.user_id,
            "fileName": doc_data.get("fileName"),
            "cards": flashcards_data.get("cards", []),
            "createdAt": datetime.datetime.utcnow().isoformat() + 'Z'
        }
        
        flashcard_ref.set(flashcard_record)
        log_activity(g.user_id, f"Generated {len(flashcard_record['cards'])} flashcards for {doc_data.get('fileName')}")
        
        return jsonify(flashcard_record), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate flashcards: {str(e)}"}), 500

@app.route("/flashcards/<doc_id>", methods=["GET"])
def get_flashcards(doc_id):
    auth_error = require_auth()
    if auth_error:
        return auth_error
        
    try:
        flashcard_ref = db.collection("flashcards").document(doc_id)
        flashcard_snap = flashcard_ref.get()
        if not flashcard_snap.exists:
            return jsonify({"error": "Flashcards not found for this document"}), 404
            
        flashcard_data = flashcard_snap.to_dict()
        if flashcard_data.get("userId") != g.user_id:
            return jsonify({"error": "Unauthorized"}), 403
            
        return jsonify(flashcard_data), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch flashcards: {str(e)}"}), 500

@app.route("/flashcards/update", methods=["POST"])
def update_flashcards():
    auth_error = require_auth()
    if auth_error:
        return auth_error
        
    doc_id = request.json.get("docId")
    cards = request.json.get("cards")
    
    if not doc_id or cards is None:
        return jsonify({"error": "Missing docId or cards"}), 400
        
    try:
        flashcard_ref = db.collection("flashcards").document(doc_id)
        flashcard_snap = flashcard_ref.get()
        if not flashcard_snap.exists:
            return jsonify({"error": "Flashcards not found"}), 404
            
        flashcard_data = flashcard_snap.to_dict()
        if flashcard_data.get("userId") != g.user_id:
            return jsonify({"error": "Unauthorized"}), 403
            
        flashcard_ref.update({"cards": cards})
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update flashcards: {str(e)}"}), 500

@app.route("/generate-quiz", methods=["POST"])
def generate_quiz():
    auth_error = require_auth()
    if auth_error:
        return auth_error
        
    doc_id = request.json.get("docId")
    quiz_type = request.json.get("quizType", "mcq") # mcq, tf, short
    num_questions = int(request.json.get("numQuestions", 5))
    
    if not doc_id:
        return jsonify({"error": "Missing docId"}), 400
        
    doc_ref = db.collection("documents").document(doc_id)
    doc_snap = doc_ref.get()
    if not doc_snap.exists:
        return jsonify({"error": "Document not found"}), 404
        
    doc_data = doc_snap.to_dict()
    if doc_data.get("userId") != g.user_id:
        return jsonify({"error": "Unauthorized"}), 403
        
    text_content = doc_data.get("textContent", "")
    
    try:
        quiz_data = gemini_service.generate_quiz(text_content, quiz_type, num_questions)
        
        quiz_ref = db.collection("quizzes").document()
        quiz_id = quiz_ref.id
        
        quiz_record = {
            "quizId": quiz_id,
            "docId": doc_id,
            "userId": g.user_id,
            "fileName": doc_data.get("fileName"),
            "quizType": quiz_type,
            "questions": quiz_data.get("questions", []),
            "createdAt": datetime.datetime.utcnow().isoformat() + 'Z'
        }
        
        quiz_ref.set(quiz_record)
        log_activity(g.user_id, f"Created new {quiz_type.upper()} quiz for {doc_data.get('fileName')}")
        
        # Return quiz to frontend, stripping out correct answers and explanations to prevent cheating
        client_questions = []
        for q in quiz_record["questions"]:
            client_questions.append({
                "id": q["id"],
                "question": q["question"],
                "options": q.get("options", [])
            })
            
        return jsonify({
            "quizId": quiz_id,
            "docId": doc_id,
            "quizType": quiz_type,
            "fileName": doc_data.get("fileName"),
            "questions": client_questions
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to generate quiz: {str(e)}"}), 500

@app.route("/evaluate-quiz", methods=["POST"])
def evaluate_quiz():
    auth_error = require_auth()
    if auth_error:
        return auth_error
        
    quiz_id = request.json.get("quizId")
    user_answers = request.json.get("answers") # dict: { questionId: answerText }
    
    if not quiz_id or user_answers is None:
        return jsonify({"error": "Missing quizId or answers"}), 400
        
    try:
        quiz_ref = db.collection("quizzes").document(quiz_id)
        quiz_snap = quiz_ref.get()
        if not quiz_snap.exists:
            return jsonify({"error": "Quiz not found"}), 404
            
        quiz_data = quiz_snap.to_dict()
        questions = quiz_data.get("questions", [])
        quiz_type = quiz_data.get("quizType", "mcq")
        
        evaluated_answers = []
        correct_count = 0
        weak_topics_identified = []
        
        # MCQ and T/F evaluation done programmatically in python
        if quiz_type in ['mcq', 'tf']:
            for q in questions:
                q_id = q["id"]
                correct_answer = str(q["answer"]).strip().lower()
                user_answer = str(user_answers.get(q_id, "")).strip().lower()
                
                is_correct = (correct_answer == user_answer)
                if is_correct:
                    correct_count += 1
                    feedback = "Correct answer!"
                else:
                    feedback = f"Incorrect. Correct answer is: {q['answer']}."
                    # Extract explanation context to identify potential weak topics
                    weak_topics_identified.append(q.get("explanation", "").split(".")[0][:40])
                    
                evaluated_answers.append({
                    "questionId": q_id,
                    "question": q["question"],
                    "userAnswer": user_answers.get(q_id, ""),
                    "correctAnswer": q["answer"],
                    "isCorrect": is_correct,
                    "feedback": feedback,
                    "explanation": q.get("explanation", "")
                })
                
            score_pct = int((correct_count / len(questions)) * 100) if questions else 0
            
        else:
            # Short Answer evaluation done via Gemini
            gemini_eval = gemini_service.evaluate_short_answers(questions, user_answers)
            evals = gemini_eval.get("evaluations", [])
            
            total_score = 0
            for q in questions:
                q_id = q["id"]
                q_eval = next((e for e in evals if e.get("questionId") == q_id), None)
                
                if q_eval:
                    score = q_eval.get("score", 0)
                    is_correct = q_eval.get("isCorrect", False)
                    feedback = q_eval.get("feedback", "Grader evaluated.")
                    weak = q_eval.get("weakTopics", [])
                    
                    total_score += score
                    if is_correct:
                        correct_count += 1
                    else:
                        weak_topics_identified.extend(weak)
                else:
                    score = 0
                    is_correct = False
                    feedback = "Evaluation failed for this answer."
                    
                evaluated_answers.append({
                    "questionId": q_id,
                    "question": q["question"],
                    "userAnswer": user_answers.get(q_id, ""),
                    "correctAnswer": q["answer"],
                    "isCorrect": is_correct,
                    "feedback": feedback,
                    "explanation": q.get("explanation", "")
                })
            
            score_pct = int(total_score / len(questions)) if questions else 0
            
        # Standardize weak topics list
        cleaned_weak_topics = []
        for topic in weak_topics_identified:
            t = topic.replace("The correct answer is", "").strip()
            if len(t) > 30:
                t = t[:30] + "..."
            if t and t not in cleaned_weak_topics:
                cleaned_weak_topics.append(t)
                
        # Save results
        result_ref = db.collection("quiz_results").document()
        result_id = result_ref.id
        
        result_record = {
            "resultId": result_id,
            "quizId": quiz_id,
            "userId": g.user_id,
            "fileName": quiz_data.get("fileName"),
            "quizType": quiz_type,
            "score": score_pct,
            "totalQuestions": len(questions),
            "correctCount": correct_count,
            "answers": evaluated_answers,
            "weakTopicsIdentified": cleaned_weak_topics,
            "createdAt": datetime.datetime.utcnow().isoformat() + 'Z'
        }
        
        result_ref.set(result_record)
        
        # Update weak_topics statistics in DB
        for topic_name in cleaned_weak_topics:
            topic_title = topic_name.title()
            wt_query = db.collection("weak_topics").where("userId", "==", g.user_id).where("topicName", "==", topic_title).limit(1).get()
            
            if len(wt_query) > 0:
                wt_doc = wt_query[0]
                current_count = wt_doc.to_dict().get("occurrenceCount", 0)
                db.collection("weak_topics").document(wt_doc.id).update({
                    "occurrenceCount": current_count + 1,
                    "lastQuizDate": datetime.datetime.utcnow().isoformat() + 'Z'
                })
            else:
                db.collection("weak_topics").add({
                    "userId": g.user_id,
                    "topicName": topic_title,
                    "occurrenceCount": 1,
                    "lastQuizDate": datetime.datetime.utcnow().isoformat() + 'Z'
                })
                
        log_activity(g.user_id, f"Completed {quiz_type.upper()} quiz with score: {score_pct}%")
        return jsonify(result_record), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to evaluate quiz: {str(e)}"}), 500

@app.route("/generate-schedule", methods=["POST"])
def generate_schedule():
    auth_error = require_auth()
    if auth_error:
        return auth_error
        
    user_id = g.user_id
    
    try:
        # Fetch user's documents
        docs_ref = db.collection("documents").where("userId", "==", user_id).get()
        text_contents = []
        for d in docs_ref:
            doc_dict = d.to_dict()
            text_contents.append(f"Document: {doc_dict.get('fileName')}\nContent snippet: {doc_dict.get('textContent', '')[:1500]}")
            
        if not text_contents:
            text_contents.append("No reference materials uploaded yet.")
            
        # Fetch weak topics, sort in python
        wt_ref = db.collection("weak_topics").where("userId", "==", user_id).get()
        weak_topics_list = [w.to_dict() for w in wt_ref]
        weak_topics_list.sort(key=lambda x: x.get("occurrenceCount", 0), reverse=True)
        weak_topics = [w.get("topicName") for w in weak_topics_list[:5]]
        
        schedule_data = gemini_service.generate_schedule(text_contents, weak_topics)
        
        # Save / overwrite schedule
        schedule_ref = db.collection("schedules").document(user_id)
        schedule_record = {
            "scheduleId": user_id,
            "userId": user_id,
            "plan": schedule_data.get("plan", []),
            "createdAt": datetime.datetime.utcnow().isoformat() + 'Z'
        }
        
        schedule_ref.set(schedule_record)
        log_activity(user_id, "Generated a personalized 7-day study plan")
        
        return jsonify(schedule_record), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate schedule: {str(e)}"}), 500

@app.route("/schedules", methods=["GET"])
def get_schedule():
    auth_error = require_auth()
    if auth_error:
        return auth_error
        
    try:
        schedule_ref = db.collection("schedules").document(g.user_id)
        schedule_snap = schedule_ref.get()
        if not schedule_snap.exists:
            return jsonify({"plan": []}), 200
            
        return jsonify(schedule_snap.to_dict()), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch schedule: {str(e)}"}), 500

@app.route("/analytics", methods=["GET"])
def get_analytics():
    auth_error = require_auth()
    if auth_error:
        return auth_error
        
    user_id = g.user_id
    
    try:
        # Total uploaded materials
        docs_ref = db.collection("documents").where("userId", "==", user_id).get()
        total_materials = len(docs_ref)
        
        # Total summaries
        summaries_ref = db.collection("summaries").where("userId", "==", user_id).get()
        total_summaries = len(summaries_ref)
        
        # Quiz scores averages
        results_ref = db.collection("quiz_results").where("userId", "==", user_id).get()
        scores = [r.to_dict().get("score", 0) for r in results_ref]
        average_score = int(sum(scores) / len(scores)) if scores else 0
        total_quizzes = len(scores)
        
        # Weak topics
        wt_ref = db.collection("weak_topics").where("userId", "==", user_id).get()
        weak_topics_list = [w.to_dict() for w in wt_ref]
        weak_topics_list.sort(key=lambda x: x.get("occurrenceCount", 0), reverse=True)
        weak_topics_summary = [{"topicName": w.get("topicName"), "count": w.get("occurrenceCount")} for w in weak_topics_list[:5]]
        
        # Recent activities
        activity_ref = db.collection("activity").where("userId", "==", user_id).get()
        activities = [a.to_dict() for a in activity_ref]
        activities.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        recent_activity = activities[:10]
        
        # Quiz history chart data
        history = []
        sorted_results = sorted([r.to_dict() for r in results_ref], key=lambda x: x.get("createdAt", ""))
        for r in sorted_results:
            history.append({
                "date": r.get("createdAt")[:10] if r.get("createdAt") else "",
                "score": r.get("score"),
                "quizType": r.get("quizType"),
                "fileName": r.get("fileName")
            })
            
        analytics_data = {
            "totalMaterials": total_materials,
            "totalSummaries": total_summaries,
            "totalQuizzes": total_quizzes,
            "averageScore": average_score,
            "weakTopics": weak_topics_summary,
            "recentActivity": recent_activity,
            "quizHistory": history
        }
        
        return jsonify(analytics_data), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch analytics: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
