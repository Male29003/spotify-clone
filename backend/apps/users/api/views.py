from rest_framework import generics, permissions, status, views, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, ShortUserDetailSerializer, UserSerializer, ChangePasswordSerializer

User = get_user_model()

# Registering
class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

# Change profile's information
class UserOwnerView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
    
# Change password
class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_expectation=True)
        serializer.save()
        return Response({"detail": "New password updated!"}, status=status.HTTP_200_OK)

# Public profile for everyone
class UserPublicProfileView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = ShortUserDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'username'