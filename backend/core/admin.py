from django.contrib import admin
from .models import Pin, CustomUser, Board
# Register your models here.
admin.site.register(Pin)
admin.site.register(CustomUser)
admin.site.register(Board)
