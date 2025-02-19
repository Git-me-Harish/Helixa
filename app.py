from flask import Flask, request, jsonify, render_template, session, send_from_directory
from pymongo import MongoClient
from datetime import datetime
import ollama
import uuid
from functools import lru_cache, wraps
import threading
from queue import Queue
import json
import os
from werkzeug.utils import secure_filename
from bson import json_util
import pytz

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Change this to a secure secret key
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# MongoDB Connection
client = MongoClient('mongodb://localhost:27017/mentora')
db = client.mentora

# Exception handler decorator
def handle_exceptions(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return decorated_function

# Enhanced system prompt
SYSTEM_PROMPT = """
You are Meditron, an advanced medical AI assistant trained to provide accurate and helpful medical information.

Key Guidelines:
1. Provide evidence-based medical information
2. Clearly state limitations and uncertainties
3. Recommend professional medical consultation when appropriate
4. Maintain medical context from previous messages
5. Use clear, professional, and empathetic language
6. Provide structured responses with relevant medical details
7. Include preventive measures and lifestyle recommendations when applicable
8. Process and analyze medical documents when provided
9. Maintain patient privacy and confidentiality
10. Provide references to medical literature when applicable

Important Notes:
- For emergencies, always advise immediate medical attention
- Verify medication interactions and contraindications
- Consider patient history from previous messages
- Provide holistic health advice when appropriate
- Always maintain HIPAA compliance in responses
"""

# LRU cache for storing recent model responses
@lru_cache(maxsize=100)
def get_cached_response(message_key, context=""):
    return ollama.chat(
        model="meditron:7b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Context: {context}\n\nQuery: {message_key}"}
        ],
        stream=False
    )

# Response queue for handling multiple requests
response_queue = Queue()

def process_response_queue():
    while True:
        if not response_queue.empty():
            chat_id, user_message, context = response_queue.get()
            try:
                response = get_cached_response(user_message, context)
                save_message(chat_id, 'assistant', response['message']['content'])
            except Exception as e:
                print(f"Error processing message: {str(e)}")
            response_queue.task_done()

# Start background thread for processing responses
response_thread = threading.Thread(target=process_response_queue, daemon=True)
response_thread.start()

def parse_json(data):
    """Convert MongoDB BSON to JSON."""
    return json.loads(json_util.dumps(data))

def save_message(chat_id, role, content, attachment=None):
    """Save a message and update the chat's last message."""
    timestamp = datetime.utcnow()
    
    # Save the message
    message = {
        'chat_id': chat_id,
        'role': role,
        'content': content,
        'timestamp': timestamp,
        'attachment': attachment
    }
    db.messages.insert_one(message)
    
    # Update chat's last message and timestamp
    db.chats.update_one(
        {'_id': chat_id},
        {
            '$set': {
                'last_message': content[:197] + "..." if len(content) > 200 else content,
                'last_updated': timestamp
            }
        }
    )

@app.route('/')
@handle_exceptions
def index():
    if 'chat_id' not in session:
        chat_id = str(uuid.uuid4())
        new_chat = {
            '_id': chat_id,
            'title': "New Medical Consultation",
            'last_message': "Start a new conversation",
            'created_at': datetime.utcnow(),
            'last_updated': datetime.utcnow()
        }
        db.chats.insert_one(new_chat)
        session['chat_id'] = chat_id

    # Get all chats for the sidebar
    chats = list(db.chats.find().sort('last_updated', -1))
    
    # Get messages for current chat
    messages = list(db.messages.find({'chat_id': session['chat_id']}).sort('timestamp', 1))
    
    return render_template(
        'chat.html',
        chats=chats,
        messages=messages,
        current_chat_id=session['chat_id']
    )

@app.route('/chats')
@handle_exceptions
def get_chats():
    chats = list(db.chats.find().sort('last_updated', -1))
    return jsonify(parse_json(chats))

@app.route('/new_chat')
@handle_exceptions
def new_chat():
    chat_id = str(uuid.uuid4())
    new_chat = {
        '_id': chat_id,
        'title': "New Medical Consultation",
        'last_message': "Start a new conversation",
        'created_at': datetime.utcnow(),
        'last_updated': datetime.utcnow()
    }
    db.chats.insert_one(new_chat)
    session['chat_id'] = chat_id
    
    return jsonify({
        "chat_id": chat_id,
        "title": new_chat['title']
    })

@app.route('/chat/<chat_id>')
@handle_exceptions
def load_chat(chat_id):
    chat = db.chats.find_one({'_id': chat_id})
    if not chat:
        return jsonify({"error": "Chat not found"}), 404
        
    session['chat_id'] = chat_id
    messages = list(db.messages.find({'chat_id': chat_id}).sort('timestamp', 1))
    
    return jsonify(parse_json({
        "chat_id": chat['_id'],
        "title": chat['title'],
        "messages": messages
    }))

@app.route('/chat', methods=['POST'])
@handle_exceptions
def chat():
    data = request.json
    user_message = data.get("message", "").strip()
    chat_id = session.get('chat_id')

    if not user_message or not chat_id:
        return jsonify({"error": "Invalid request"}), 400

    # Save user message
    save_message(chat_id, 'user', user_message)

    # Get chat history for context
    chat_history = list(db.messages.find({'chat_id': chat_id})
                      .sort('timestamp', -1)
                      .limit(5))
    chat_history.reverse()
    
    # Prepare context from previous messages
    context_messages = [{"role": msg['role'], "content": msg['content']} for msg in chat_history]

    # Get response from model
    response = ollama.chat(
        model="meditron:7b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            *context_messages,
            {"role": "user", "content": user_message}
        ],
        stream=False
    )

    bot_reply = response['message']['content']
    
    # Save assistant's response
    save_message(chat_id, 'assistant', bot_reply)

    return jsonify({
        "reply": bot_reply,
        "chat_id": chat_id
    })

@app.route('/update_chat_title', methods=['POST'])
@handle_exceptions
def update_chat_title():
    data = request.json
    chat_id = data.get('chat_id')
    new_title = data.get('title')
    
    if not chat_id or not new_title:
        return jsonify({"error": "Missing required fields"}), 400
    
    result = db.chats.update_one(
        {'_id': chat_id},
        {'$set': {'title': new_title}}
    )
    
    if result.modified_count == 0:
        return jsonify({"error": "Chat not found"}), 404
    
    return jsonify({"success": True, "title": new_title})

@app.route('/upload', methods=['POST'])
@handle_exceptions
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    chat_id = request.form.get('chat_id')
    
    if not file.filename or not chat_id:
        return jsonify({"error": "Invalid request"}), 400
        
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    # Save file upload message
    save_message(
        chat_id,
        'user',
        f"Uploaded file: {filename}",
        attachment=filename
    )
    
    # Generate response about the file
    response = ollama.chat(
        model="meditron:7b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"I have uploaded a file named {filename}. Please acknowledge the upload and provide any relevant medical context if applicable."}
        ],
        stream=False
    )
    
    bot_reply = response['message']['content']
    save_message(chat_id, 'assistant', bot_reply)
    
    return jsonify({
        "success": True,
        "filename": filename,
        "reply": bot_reply
    })

@app.route('/uploads/<filename>')
@handle_exceptions
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, threaded=True)