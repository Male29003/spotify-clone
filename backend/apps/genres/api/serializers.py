from rest_framework import serializers

#Artist serializers

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = None
        fields = ['id', 'name', 'slug', 'description', 'created_at', 'updated_at']