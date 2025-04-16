from django.db import models

# Create your models here.
class Song(models.Model):
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    album = models.CharField(null=True, max_length=255)
    release_date = models.DateField()
    genre = models.CharField(max_length=100)
    duration = models.IntegerField()  # Duration in seconds
    cover_image = models.ImageField(upload_to='cover_images/')
    audio_file = models.FileField(upload_to='audio_files/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} by {self.artist}"
    

class Artist(models.Model):
    name = models.CharField(max_length=255)
    bio = models.TextField()
    image = models.ImageField(upload_to='artist_images/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
class Album(models.Model):
    title = models.CharField(max_length=255)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE)
    release_date = models.DateField()
    cover_image = models.ImageField(upload_to='album_images/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
class Playlist(models.Model):
    name = models.CharField(max_length=255)
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    songs = models.ManyToManyField(Song, related_name='playlists')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name