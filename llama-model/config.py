# config.py

import os
from dotenv import load_dotenv

# Load all environment variables from a .env file
load_dotenv()

# ==============================================================================
# API KEYS & MODEL CONFIGURATIONS
# ==============================================================================
# Get the API key for Hugging Face from the environment variables
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Define the ID for the generative model on Hugging Face Hub
GENERATIVE_MODEL_ID = "meta-llama/Llama-2-7b-chat-hf"

# ==============================================================================
# LOCAL ANALYSIS MODEL CONFIGURATIONS
# ==============================================================================
# These models run locally for analysis and preprocessing tasks
MODERATION_MODEL_ID = "facebook/roberta-hate-speech-dynabench-r4-target"
SENTIMENT_MODEL_ID = "cardiffnlp/twitter-roberta-base-sentiment-latest"
EMOTION_MODEL_ID = "bhadresh-savani/distilbert-base-uncased-emotion"

# ==============================================================================
# ENHANCED CRISIS & CONCERN PATTERNS
# ==============================================================================
CRISIS_PATTERNS = [
    r"\bi (want to|wanna|'m going to|gonna|will|plan to|need to|am going to) (die|kill myself|k.m.s|end it all|end my life)\b",
    r"\bi'm going to (kill myself|end my life)\b",
    r"\bi can't (go on|live|take it) (like this )?anymore\b",
    r"\b(i'm|i am) (seriously|really) thinking of suicide\b",
    r"\b(i'm|i am) cutting myself (right now|currently)\b",
    r"\b(i'm|i am) being (abused|raped|assaulted) (right now|currently)\b",
    r"\bplanning to end my life\b",
    r"\bgoing to hurt myself (tonight|today|now)\b",
    r"\b(i'm|i am) going to (jump|hang|overdose) (myself )?(tonight|today|now)\b",
    r"\b(i've|i have) taken (pills|medication) to end my life\b",
    r"\bi have a plan to kill myself\b",
    r"\bgoodbye (forever|world|everyone)\b",
    r"\bthis is my last (message|day)\b"
]

CONCERN_PATTERNS = [
    r"\bi've been feeling (really )?(depressed|suicidal)\b",
    r"\bi (sometimes|often) think about (dying|self-harm)\b",
    r"\b(i'm|i am) struggling with (suicidal thoughts|self-harm)\b",
    r"\bno reason to live\b",
    r"\bdon't want to be here anymore\b",
    r"\bi feel (so )?(hopeless|trapped|worthless|empty|numb)\b",
    r"\b(what's|what is) the point of (living|anything)\b",
    r"\bno one (cares|would miss me)\b",
    r"\bcan't cope (anymore|with life)\b",
    r"\b(i'm|i am) a burden\b"
]

# ==============================================================================
# CBT COGNITIVE DISTORTION PATTERNS
# ==============================================================================
CBT_PATTERNS = {
    'catastrophizing': r"\b(everything is|always|never|worst|ruined|hopeless|disaster|catastrophe)\b",
    'all_or_nothing': r"\b(all|nothing|completely|totally|failure|useless|perfect|impossible)\b",
    'overgeneralization': r"\b(everyone|nobody|always|never|every time|no one ever)\b",
    'personalization': r"\b(my fault|blame myself|because of me|i caused|i'm responsible)\b"
}

# ==============================================================================
# CBT INTERVENTION MAPPING
# ==============================================================================
CBT_INTERVENTIONS = {
    'catastrophizing': [
        "Could you try identifying one piece of evidence that things might not be as bad as they seem?",
        "When we imagine the worst, it helps to ask: 'What's the most likely outcome?' Can you think of that?",
        "Let's try a 'best case, worst case, most likely case' exercise. What's the most realistic scenario here?",
        "Catastrophizing can make situations feel overwhelming. What's one small step you could take right now?"
    ],
    'all_or_nothing': [
        "It seems like you're seeing things as all good or all bad. Can you think of a middle ground or small positive aspect?",
        "Life is rarely 100% one way or another. What's one small step you could take that isn't all-or-nothing?",
        "Let's find the '50% solution' - what's one manageable action you could take right now?",
        "Black-and-white thinking can be limiting. What's one 'maybe' or 'sometimes' possibility here?"
    ],
    'overgeneralization': [
        "You mentioned words like 'always' or 'never.' Could you reflect on a time when things were different?",
        "One experience doesn't define all experiences. Can you think of a time when this wasn't true for you?",
        "Let's challenge that 'always' thought. What's one counterexample you can remember?",
        "Overgeneralizing can trap us in negative patterns. What's one exception to this rule you can identify?"
    ],
    'personalization': [
        "You seem to be taking a lot of responsibility for this. Can you consider other factors that might be contributing?",
        "Not everything that happens is because of us. What else might be influencing this situation?",
        "Let's separate what we can control from what we can't. What part of this is truly in your hands?",
        "Personalizing events can be exhausting. What's one thing outside your control that might be at play here?"
    ]
}

# ==============================================================================
# GENERAL CBT TECHNIQUES (FALLBACK)
# ==============================================================================
GENERAL_CBT_TECHNIQUES = [
    "Try a grounding exercise: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.",
    "Deep breathing can help: Inhale for 4 counts, hold for 4, exhale for 4, repeat 3 times.",
    "Let's try thought challenging: What's one piece of evidence that contradicts this negative thought?",
    "Behavioral activation: What's one small, positive action you could take in the next hour?",
    "Let's reframe: Instead of 'I failed,' try 'I'm learning how to improve.' What's one thing you're learning?"
]

# ==============================================================================
# ENHANCED MENTAL HEALTH RESOURCES
# ==============================================================================
MENTAL_HEALTH_RESOURCES = {
    'crisis': [
        "**National Suicide Prevention Lifeline (US)**: Call or text 988 (24/7)",
        "**Crisis Text Line**: Text HOME to 741741 (24/7)",
        "**International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/",
        "**Emergency Services**: 911 (US) or your local emergency number"
    ],
    'concern': [
        "**SAMHSA National Helpline (US)**: 1-800-662-HELP (4357) (24/7)",
        "**7 Cups (free online therapy)**: https://www.7cups.com",
        "**BetterHelp Online Therapy**: https://www.betterhelp.com"
    ],
    'general': [
        "**Anxiety and Depression Association of America**: https://adaa.org",
        "**Psychology Today Therapist Finder**: https://www.psychologytoday.com",
        "**CBT Worksheets (Free)**: https://www.psychologytools.com/self-help/"
    ]
}

# ==============================================================================
# ANTI-REPETITION PHRASES
# ==============================================================================
ANTI_REPETITION_STARTERS = [
    "Of course I'm here to help",
    "I'm here for you",
    "I understand how difficult",
    "That sounds really tough",
    "Thank you for sharing",
    "It's completely normal to",
    "I can imagine how",
    "You're not alone in"
]

print("Enhanced configuration file for CBT-Integrated Hybrid Architecture loaded successfully.")