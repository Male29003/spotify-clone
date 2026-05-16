from django.contrib import admin
from .models import User
# Register your models here.
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'type', 'is_premium', 'is_active', 'date_joined')
    list_filter = ('type', 'is_premium', 'is_active')