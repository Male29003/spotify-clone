from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import GenreSerializer
from ..models import Genre

# Create your views here.
class GenreListView(generics.ListCreateAPIView):
    """
    API view to retrieve and create genres.
    """
    queryset = Genre.objects.all()  # Replace with your queryset
    serializer_class = GenreSerializer  # Replace with your serializer class

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
    
    def get(self, request, *args, **kwargs):
        """
        Handle GET requests to retrieve a list of genres.
        """
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        """
        Handle POST requests to create a new genre.
        """
        return self.create(request, *args, **kwargs)