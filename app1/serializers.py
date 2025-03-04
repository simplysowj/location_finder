# myapp/serializers.py

from rest_framework import serializers
from .models import User, Image, Location

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_super_admin', 'is_admin', 'is_user']

class ImageSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')  # Read-only to prevent manual input

    class Meta:
        model = Image
        fields = ['id', 'user', 'image', 'uploaded_at', 'latitude', 'longitude', 'location_name']

    def create(self, validated_data):
        return Image.objects.create(**validated_data)

    
    
        
        

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name', 'latitude', 'longitude']