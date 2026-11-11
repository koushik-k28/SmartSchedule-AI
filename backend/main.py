import re
from datetime import datetime
import os
import time
import json
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from groq import Groq

# Load API key
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is missing from .env")

# Connect to Gemini
client = genai.Client(api_key=api_key)
groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key:
    raise ValueError("GROQ_API_KEY is missing from .env")

groq_client = Groq(api_key=groq_api_key)

app = FastAPI(title="SmartSchedule AI API")

# Allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    tasks: list[dict] = []
    completed: list = []
    history: list[dict] = []


class TimetableRequest(BaseModel):
    message: str



def ask_ai(prompt):
    try:
        print("Sending request to Groq...")

        response = groq_client.chat.completions.create(
            model="openai/gpt-oss-20b",
            max_completion_tokens=8192,
            messages=[
                {
                    "role": "system",
                    "content": "You are SmartSchedule AI, a helpful and friendly planning assistant."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        reply = response.choices[0].message.content

        if not reply:
            raise Exception("Groq returned an empty response")

        print("Groq response successful!")
        return reply

    except Exception as e:
        print("Groq API error:", str(e))
        raise HTTPException(
            status_code=503,
            detail="SmartSchedule AI is temporarily unavailable. Please try again later."
        )

@app.get("/")
def home():
    return {
        "message": "SmartSchedule AI Backend is running!"
    }


# Normal AI chat

@app.post("/chat")
def chat(request: ChatRequest):

    prompt = f"""
    You are SmartSchedule AI, a helpful personal planning assistant.

    Help the user with their tasks, schedules, deadlines,
    priorities and time management.

    Current user message:
    {request.message}

    User's pending tasks:
    {json.dumps(request.tasks, indent=2)}

    User's completed tasks:
    {json.dumps(request.completed, indent=2)}
    Previous conversation:
    {json.dumps(request.history[-10:], indent=2)}

    Give a clear, friendly and useful answer.
    Use the user's actual task information when relevant.
    Do not invent tasks or completed work.
    """

    reply = ask_ai(prompt)

    return {"reply": reply}

# Generate structured timetable

@app.post("/generate-timetable")
def generate_timetable(request: TimetableRequest):

    # Extract start and end dates from the frontend prompt
    start_match = re.search(
        r"Start Date:\s*(\d{4}-\d{2}-\d{2})",
        request.message
    )

    end_match = re.search(
        r"End Date:\s*(\d{4}-\d{2}-\d{2})",
        request.message
    )

    if not start_match or not end_match:
        raise HTTPException(
            status_code=400,
            detail="Start date or end date is missing."
        )

    try:
        start_date = datetime.strptime(
            start_match.group(1), "%Y-%m-%d"
        ).date()

        end_date = datetime.strptime(
            end_match.group(1), "%Y-%m-%d"
        ).date()

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format."
        )

    if end_date < start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date."
        )

    prompt = f"""
    You are SmartSchedule AI, an intelligent scheduling assistant.

    Create a practical schedule based on the user's requirements.

    USER REQUIREMENTS:
    {request.message}

    Return ONLY valid JSON. No Markdown or explanations.

    Use this exact structure:

    {{
        "tasks": [
            {{
                "title": "Example task",
                "subject": "Example category",
                "date": "2026-11-11",
                "day": "Wednesday",
                "start": "09:00 AM",
                "end": "10:00 AM",
                "priority": "High"
            }}
        ]
    }}

    RULES:
    1. Generate tasks only between the specified start and end dates, inclusive.
    2. Every task must include its actual date in YYYY-MM-DD format.
    3. The day must match the weekday of that date.
    4. Never generate tasks outside the selected date range.
    5. Use 12-hour time format with AM or PM.
    6. Include title, subject, date, day, start, end and priority.
    7. Priority must be High, Medium or Low.
    8. Avoid overlapping tasks on the same date.
    9. Include reasonable breaks.
    10. Respect available hours and preferences.
    11. Return an empty tasks array if no tasks can be generated.
    """

    result = ask_ai(prompt)

    try:
        cleaned_result = result.strip()

        if cleaned_result.startswith("```"):
            cleaned_result = cleaned_result.split("\n", 1)[1]
            cleaned_result = cleaned_result.rsplit("```", 1)[0]

        data = json.loads(cleaned_result)

        if not isinstance(data.get("tasks"), list):
            raise ValueError("Invalid tasks format")

        valid_tasks = []

        for task in data["tasks"]:

            required_fields = [
                "title", "subject", "date", "day",
                "start", "end", "priority"
            ]

            if not all(task.get(field) for field in required_fields):
                continue

            try:
                task_date = datetime.strptime(
                    task["date"], "%Y-%m-%d"
                ).date()
            except ValueError:
                continue

            if not (start_date <= task_date <= end_date):
                continue

            if task["day"] != task_date.strftime("%A"):
                continue

            if task["priority"] not in ["High", "Medium", "Low"]:
                task["priority"] = "Medium"

            valid_tasks.append(task)

        return {"tasks": valid_tasks}

    except (json.JSONDecodeError, ValueError, AttributeError) as e:
        print("Timetable JSON error:", e)
        print("AI response:", result)

        raise HTTPException(
            status_code=502,
            detail="AI returned an invalid timetable. Please try again."
        )
