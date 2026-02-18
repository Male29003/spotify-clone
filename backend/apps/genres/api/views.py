from rest_framework import generics, permissions, filters
from .serializers import GenreSerializer
from ..models import Genre

class GenreListView(generics.ListCreateAPIView):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']

    def get_permissions(self):
        # If GET -> Every user can access
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        # If POST -> Only admin users can create new genres
        return [permissions.IsAdminUser()]
    
class GenreDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        # If GET -> Every user can access
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        # If PUT, PATCH, DELETE -> Only admin users can modify genres
        return [permissions.IsAdminUser()]