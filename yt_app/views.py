# yt_qa/views.py
from django.http import JsonResponse
from urllib.parse import urlparse, parse_qs
from .service import answer_question
from django.views.decorators.csrf import csrf_exempt

def extract_video_id(video_url: str) -> str | None:
    """
    Supports:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    """
    try:
        parsed = urlparse(video_url)
        if "youtube.com" in parsed.netloc:
            qs = parse_qs(parsed.query)
            return qs.get("v", [None])[0]
        if "youtu.be" in parsed.netloc:
            return parsed.path.lstrip("/")
    except Exception:
        return None

@csrf_exempt
def ask_youtube_question(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    import json
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    video_url = data.get("video_url")
    question = data.get("question")

    if not video_url or not question:
        return JsonResponse(
            {"error": "Video_url and question are required"},
            status=400
        )

    video_id = extract_video_id(video_url)
    if not video_id:
        return JsonResponse({"error": "Could not extract video ID"}, status=400)

    try:
        answer = answer_question(video_id, question)
        return JsonResponse({"answer": answer})
    except ValueError as e:   # transcript problems
        return JsonResponse({"error": str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
