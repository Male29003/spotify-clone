from django.urls import path
from .views import (
    GenreListView, 
    GenreDetailView,
    RandomGenreMixView,
    # Admin
    AdminGenreListView,
    AdminDetailGenreView,
    AdminToggleActiveGenreView
)

app_name = "genres"

urlpatterns = [
    # Listener
    path('', GenreListView.as_view(), name='genre-list'),
    path('random-mix/', RandomGenreMixView.as_view(), name='random-mix'),
    
    # Admin
    path('admin/manage/', AdminGenreListView.as_view(), name='admin-genre-list'),
    path('admin/manage/<slug:slug>/', AdminDetailGenreView.as_view(), name='admin-genre-detail'),
    path('admin/manage/<slug:slug>/toggle-active/', AdminToggleActiveGenreView.as_view(), name='admin-toggle-genre-active'),
    
    # Listener - dồn xuống cùng
    path('<slug:slug>/', GenreDetailView.as_view(), name='genre-detail'),
]