from django.contrib import admin
from .models import *


# Register your models here.


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    readonly_fields = ["body", "user", "indication"]
    list_filter = ['created_on']
    search_fields = ('user', 'body')
