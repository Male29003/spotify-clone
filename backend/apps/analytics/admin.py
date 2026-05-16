from django.contrib import admin
from .models import StreamHistory, TrackDailyStat, UserDailyStat, DownloadHistory

@admin.register(StreamHistory)
class StreamHistoryAdmin(admin.ModelAdmin):
    # Hiện các cột quan trọng để check xem seed có đúng date không
    list_display = ('id', 'user', 'track', 'country', 'created_at')
    list_filter = ('created_at', 'country')
    search_fields = ('track__title', 'user__email')
    # Cho phép sắp xếp theo ngày mới nhất lên đầu
    ordering = ('-created_at',)

@admin.register(TrackDailyStat)
class TrackDailyStatAdmin(admin.ModelAdmin):
    list_display = ('track', 'date', 'listens')
    list_filter = ('date',)

admin.site.register(UserDailyStat)
admin.site.register(DownloadHistory)