"""
URL configuration for spotify_clone project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.contrib import admin
from drf_spectacular.views import SpectacularSwaggerView, SpectacularAPIView
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', RedirectView.as_view(url='api/v1/docs/'), name='index'),

    path('admin/', admin.site.urls),
    # users URLs here as needed
    path('api/v1/users/', include("apps.users.urls"), name="users"),
    # releases URLs here as needed
    path('api/v1/releases/', include("apps.releases.urls"), name="releases"),
    # artists URLs here as needed
    path('api/v1/artists/', include("apps.artists.urls"), name="artists"),
    # genres URLs here as needed
    path('api/v1/genres/', include("apps.genres.urls"), name="genres"),
    # usersmusic URLs here as needed
    path('api/v1/music/', include("apps.music.urls"), name="music"),
    # playlists URLs here as needed
    path('api/v1/playlists/', include("apps.playlists.urls"), name="playlists"),
    path('api/v1/analytics/', include("apps.analytics.urls"), name="analytics"),
    # subscription URLs here as needed
    path('api/v1/subscription/', include("apps.subscription.urls"), name="subscription"),

]

urlpatterns += [
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    # Để trang chủ là Swagger luôn cũng được, hoặc đổi thành 'api/v1/docs/'
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)