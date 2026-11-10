
import os
import time
import json
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai

# Load API key
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is missing from .env")

# Connect to Gemini
client = genai.Client(api_key=api_key)

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


class TimetableRequest(BaseModel):
    message: str


def ask_gemini(prompt):
    models = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.5-flash-lite"
    ]

    last_error = None

    for model in models:
        for attempt in range(2):
            try:
                print(f"Trying {model}...")

                response = client.models.generate_content(
                    model=model,
                    contents=prompt
                )

                if not response.text:
                    raise Exception("Gemini returned an empty response")

                print(f"Success using {model}")
                return response.text

            except Exception as e:
                last_error = e
                error_message = str(e)

                print(f"Error with {model}: {error_message}")

                temporary_error = any(
                    code in error_message.upper()
                    for code in [
                        "503",
                        "UNAVAILABLE",
                        "429",
                        "RESOURCE_EXHAUSTED",
                        "HIGH DEMAND"
                    ]
                )

                if temporary_error and attempt == 0:
                    time.sleep(2)
                    continue

                if temporary_error:
                    break

                break

    print("All Gemini models failed:", last_error)

    raise HTTPException(
        status_code=503,
        detail="SmartSchedule AI is temporarily busy. Please try again."
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
    You are SmartSchedule AI, a friendly general-purpose
    planning assistant.

    Help students, professionals, self-learners and anyone
    organize their tasks, schedules, deadlines and goals.

    CURRENT USER'S TASKS:
    {json.dumps(request.tasks, indent=2)}

    COMPLETED TASKS:
    {json.dumps(request.completed, indent=2)}

    USER'S MESSAGE:
    {request.message}

    Instructions:
    - Use the provided task information when answering.
    - Identify pending and completed tasks correctly.
    - Give practical and personalized suggestions.
    - Do not invent tasks or deadlines.
    - If information is missing, ask the user.
    - Keep answers clear and friendly.
    """
    reply = ask_gemini(prompt)
    return {"reply": reply}


# Generate structured timetable
@app.post("/generate-timetable")
def generate_timetable(request: TimetableRequest):

    prompt = f"""
    You are SmartSchedule AI, an intelligent scheduling assistant.

    Create a practical schedule based on the user's requirements.

    The user may be a student, professional, self-learner
    or anyone organizing daily activities.

    USER REQUIREMENTS:
    {request.message}

    Return ONLY valid JSON.
    Do not include Markdown or explanations outside JSON.

    Use this exact structure:

    {{
      "tasks": [
        {{
          "title": "Example task",
          "subject": "Example category",
          "day": "Monday",
          "start": "09:00 AM",
          "end": "10:00 AM",
          "priority": "High"
        }}
      ]
    }}

    RULES:
    1. Use day names Monday through Sunday.
    2. Use 12-hour time format with AM or PM.
    3. Every task must have a title, subject, day, start and end.
    4. Priority must be High, Medium or Low.
    5. Do not create overlapping tasks on the same day.
    6. Include reasonable breaks between activities.
    7. Respect the user's available hours and preferences.
    8. Do not invent fixed commitments the user did not provide.
    9. Create a realistic schedule, not an excessively packed one.
    """

    result = ask_gemini(prompt)

    try:
        # Remove Markdown code fences if Gemini includes them
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
                "title", "subject", "day",
                "start", "end", "priority"
            ]

            if not all(task.get(field) for field in required_fields):
                continue

            if task["day"] not in [
                "Monday", "Tuesday", "Wednesday",
                "Thursday", "Friday", "Saturday", "Sunday"
            ]:
                continue

            if task["priority"] not in ["High", "Medium", "Low"]:
                task["priority"] = "Medium"

            valid_tasks.append(task)

        return {
            "tasks": valid_tasks
        }

    except (json.JSONDecodeError, ValueError, AttributeError) as e:
        print("Timetable JSON error:", e)
        print("Gemini response:", result)

        raise HTTPException(
            status_code=502,
            detail="AI returned an invalid timetable. Please try again."
        )
