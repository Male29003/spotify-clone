from rest_framework import serializers
from ..models import Genre

#Artist serializers

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name', 'slug', 'description', 'image', 'created_at', 'updated_at']