import mysql.connector
import bcrypt
from flask_mail import Mail, Message
from flask import Flask, request, jsonify, render_template, Response
from flask_cors import CORS
import pandas as pd
import json
import requests

# ---------------- DB ----------------
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="mysql@2005",
        database="chennai_ai"
    )

app = Flask(__name__)
CORS(app)


# ---------------- MAIL CONFIG ----------------
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'your_mailid'
app.config['MAIL_PASSWORD'] = 'your_password'

mail = Mail(app)

def send_email(to_email):
    try:
        msg = Message(
            "Welcome to AI Business Finder",
            sender=app.config['MAIL_USERNAME'],
            recipients=[to_email]
        )
        msg.body = "Your account has been successfully created!"
        mail.send(msg)
        print("EMAIL SENT")
    except Exception as e:
        print("EMAIL ERROR:", e)

# ---------------- LOAD CSV ----------------
locations_df = pd.read_csv("locations.csv")

latest_context = {}

# ---------------- ROUTES ----------------
@app.route('/')
def home():
    return render_template('login.html')



@app.route('/home')
def home_page():
    return render_template('home.html')

@app.route("/recommendations")
def recommendations_page():
    return render_template("recommendations.html")

@app.route("/innovationhub")
def innovation():
    return render_template("innovationhub.html")

@app.route("/admin")
def admin():
    return render_template("admin.html")

# ---------------- REGISTER ----------------
@app.route('/register', methods=['POST'])
def register():
    data = request.json

    name = data.get('name')
    email = data.get('email').lower().strip()
    phone = data.get('phone').replace(" ", "")
    password = data.get('password')

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (name, email, phone, password) VALUES (%s, %s, %s, %s)",
            (name, email, phone, hashed_password)
        )
        conn.commit()
        send_email(email)
        return jsonify({"message": "Registered successfully"})

    except Exception as e:
        print("REGISTER ERROR:", e)
        return jsonify({"message": "Registration failed"}), 500

    finally:
        cursor.close()
        conn.close()

# ---------------- LOGIN ----------------
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or request.form

    print("DATA RECEIVED:",data)

    email = data.get('email') or "".lower().strip()
    password = data.get('password') or ""

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"message": "User not found"}), 404

        stored_password = user['password']

        if isinstance(stored_password, str):
            stored_password = stored_password.encode('utf-8')

        if bcrypt.checkpw(password.encode('utf-8'), stored_password):
            return jsonify({"message": "Login successful"})
        else:
            return jsonify({"message": "Invalid password"}), 401

    except Exception as e:
        print("LOGIN ERROR:", e)
        return jsonify({"message": "Server error"}), 500

    finally:
        cursor.close()
        conn.close()

# ---------------- RECOMMEND ----------------
@app.route("/recommend", methods=["POST"])
def recommend():
    global latest_context

    data = request.get_json()

    location = data.get("location", "").lower()
    area = data.get("area_type", "").lower()

    # ALWAYS SET CONTEXT (even if CSV fails)
    latest_context = {
        "location": location.title(),
        "area": area,
        "population": "medium",
        "footfall": "medium",
        "rent": "medium"
    }

    print("✅ CONTEXT SET:", latest_context)

    return jsonify({"recommendations": []})

# ---------------- LOCATIONS ----------------
@app.route("/locations", methods=["GET"])
def get_locations():
    try:
        locations = locations_df["location"].dropna().tolist()
        return jsonify({"locations": locations})
    except:
        return jsonify({"locations": []})

# ---------------- AI STREAM ----------------
@app.route("/ai-stream", methods=["POST"])
def ai_stream():
    global latest_context

    def generate():
        try:
            print("🔥 OLLAMA STARTED")
            print("📡 CALLING OLLAMA...")

            prompt = f"""
You are NOT allowed to generate anything except exactly 8 lines.

TASK:
Generate 8 business ideas for the given location.

STRICT FORMAT (MANDATORY):
Each line MUST follow this exact pattern:
Business Name - Reason

STRICT RULES (DO NOT BREAK):
1. Output EXACTLY 8 lines (no more, no less)
2. Each line MUST contain exactly ONE hyphen "-"
3. Do NOT number the lines
4. Do NOT add headings, titles, explanations, or blank lines
5. Do NOT repeat businesses
6. Each reason must be short (max 15 words)
7. If you generate more than 8 lines, your answer is WRONG

OUTPUT MUST LOOK LIKE THIS (EXAMPLE FORMAT ONLY, DO NOT GIVE THIS OR TAKE EXAMPLE REFERENCE FROM THIS):
Tea Shop - High footfall ensures consistent daily sales
Mobile Store - Strong demand for smartphones and accessories
Cloud Kitchen - Rising online food delivery demand
Grocery Store - Essential goods always in demand
Salon - Regular grooming needs ensure repeat customers
Juice Shop - Popular among health-conscious customers
Mini Mart - Convenient for quick daily purchases
Bakery - High demand for snacks and fresh items

NOW GENERATE:

Location: {latest_context['location']}
Area: {latest_context['area']}
Population: {latest_context['population']}
Footfall: {latest_context['footfall']}
Rent: {latest_context['rent']}
"""

            res = requests.post(
                "http://127.0.0.1:11434/api/generate",
                json={
                    "model": "phi3:mini",
                    "prompt": prompt,
                    "stream": True
                },
                stream=True
            )

            for line in res.iter_lines():
                if line:
                    data = json.loads(line.decode())
                    yield data.get("response", "")

            print("✅ OLLAMA DONE")

        except Exception as e:
            print("❌ ERROR:", e)
            yield "ERROR"

    return Response(generate(), content_type="text/plain")

# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
