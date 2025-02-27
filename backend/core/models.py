from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    profile_picture = models.URLField(blank=True)
    background_picture = models.URLField( blank=True)
    pins= models.ManyToManyField('Pin', related_name='pinned_by', blank=True)
    boards= models.ManyToManyField('Board', related_name='created_by', blank=True)

class Pin(models.Model):
    title = models.CharField(max_length=255)
    image = models.URLField()
    description = models.TextField()
    creator = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    category= models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

class Board(models.Model):
    name = models.CharField(max_length=255)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    pins = models.ManyToManyField(Pin)