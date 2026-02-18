from django.urls import path
from .views import GenreListView, GenreDetailView

app_name = "genres"

urlpatterns = [
    path('', GenreListView.as_view(), name='genre-list'),
    path('<slug:slug>/', GenreDetailView.as_view(), name='genre-detail'),
]