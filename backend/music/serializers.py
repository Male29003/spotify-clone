from rest_framework import serializers
from .models import Song

class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ('id', 'title', 'artist', 'album', 'release_date', 
                  'genre', 'duration', 'cover_image', 'audio_file', 'created_at')
