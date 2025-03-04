from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    is_super_admin = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_user = models.BooleanField(default=False)

    def __str__(self):
        return self.username  # Return the username for the User model

class Image(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to='images/')  # Files will be uploaded to MEDIA_ROOT/images/
    uploaded_at = models.DateTimeField(auto_now_add=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    location_name = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"Image uploaded by {self.user.username} at {self.uploaded_at}"

class Location(models.Model):
    name = models.CharField(max_length=255, unique=True)
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        return self.name  # Return the name of the location