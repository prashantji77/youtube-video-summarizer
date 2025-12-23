
# Youtube-Video-Summarizer
![developer](https://img.shields.io/badge/Developed%20By%20%3A-Prashant%20Sharma-red)

 
Youtube video summarizer is a chrome extension built with **Django** with the help of **LangChain** open source framework, where answer are generated automatically using the **OpenRouter API** (free LLM API gateway).
Where I use **HuggingFace** free model for vector embedding and **FAISS** Vector Database for store vector embedding. I use **Similarity search** for retrive desirable chunk to related prompt or question.

---

## Features

-  Ask any question regarding current youtube video
-  Get AI generated answer
-  Summarize current youtube video

---

## ⚙️ Installation Guide

### 1️⃣ Clone Repository
```
git clone https://github.com/YOUR_USERNAME/youtube-video-summarizer.git
cd youtube-video-summarizer
```

### 2️⃣ Create Virtual Environment
```
#For Linux / Mac
python3 -m venv venv
source venv/bin/activate
```
```
## For Windows
python -m venv venv
venv\Scripts\activate
```

### 3️⃣ Install Dependencies

```pip install -r requirements.txt```

### 4️⃣ Database Setup

```
python manage.py migrate
```

### 5️⃣ Run Server

```python manage.py runserver```

---

## 🤖 OpenRouter API Setup

We use OpenRouter to generate responses.
OpenRouter is free to start and provides access to models like gpt-3.5, llama-3, etc.

Steps:
- Go to https://openrouter.ai/
- Sign up with Google / GitHub.
- Navigate to API Keys → Generate a free API key.
- Copy the API key.

---

### Environment Variables

- Create a .env file inside your project root:

```OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx```

- In ai_client.py, the client automatically picks the API key from .env:
  
```
import os
from dotenv import load_dotenv

load_dotenv()  # Load .env file

```

---

## Future Improvements
- Add session
- Add multiple language support



