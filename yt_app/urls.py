from django.urls import path
from .views import ask_youtube_question

urlpatterns = [
    path("api/ask-video/", ask_youtube_question, name="ask-video"),
]