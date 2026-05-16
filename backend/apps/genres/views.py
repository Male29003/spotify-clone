from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from .serializers import GenreSerializer, ShortGenreSerializer, ListenerGenreDetailSerializer
from .models import Genre
from apps.core.permissions import AdminPermission
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.http import Http404
from django_filters.rest_framework import DjangoFilterBackend

# ==========================================================================================
# -------------------------------- Chức năng cho Listener --------------------------------
# ==========================================================================================
# Tìm keim61 danh sách genre
class GenreListView(generics.ListAPIView):
    serializer_class = ShortGenreSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        return Genre.objects.filter( is_active=True ).order_by('created_at')

# Lấy trang chi tiết genre
class GenreDetailView(generics.RetrieveAPIView):
    queryset = Genre.objects.filter(is_active=True)
    serializer_class = ListenerGenreDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

# Lấy ngẫu nhiên genre nào đó
class RandomGenreMixView(generics.RetrieveAPIView):
    serializer_class = ListenerGenreDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        genre = Genre.objects.filter(is_active=True).order_by('?').first()
        if not genre:
            raise Http404("No active genres found.")
        return genre


# ==========================================================================================
# -------------------------------- Chức năng cho Admin --------------------------------
# ==========================================================================================
# Lấy data về admin
class AdminGenreListView(generics.ListCreateAPIView):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    parser_classes = [MultiPartParser, FormParser] 
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    filterset_fields = ['is_active']

# Update genre
class AdminDetailGenreView(generics.RetrieveUpdateAPIView):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [permissions.IsAuthenticated, AdminPermission]
    lookup_field = 'slug'
    
# active hoặc bỏ active 
class AdminToggleActiveGenreView(generics.UpdateAPIView):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [permissions.IsAuthenticated, AdminPermission]
    lookup_field = 'slug'

    def patch(self, request, *args, **kwargs):
        genre = self.get_object()
        status = request.data.get('is_active', genre.is_active)
        genre.is_active = status
        genre.save()

        return Response(
            {
                "is_Active": genre.is_active,
                "detail": "Status updated",
            },
        )