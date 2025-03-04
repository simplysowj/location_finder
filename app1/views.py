from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import get_object_or_404
from .models import User, Image, Location
from .serializers import UserSerializer, ImageSerializer, LocationSerializer
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
import tensorflow as tf
import numpy as np
from PIL import Image as PILImage
from rest_framework import generics, permissions
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from .models import Image
from .serializers import ImageSerializer
from django.contrib.auth.models import User
from rest_framework.authentication import TokenAuthentication
import logging
from django.contrib.auth import get_user_model
import pandas as pd
from io import BytesIO
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
from .serializers import UserSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from exif import Image as ExifImage
from io import BytesIO
from .utils import convert_to_decimal_degrees
from .utils import reverse_geocode
from geopy.distance import geodesic
logger = logging.getLogger(__name__)
from rest_framework.permissions import IsAuthenticated

User = get_user_model()
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_users(request):
    """
    Uploads a CSV/Excel file to create user accounts dynamically.
    Only Super Admins and Admins can perform this action.
    """
    if not (request.user.is_super_admin or request.user.is_admin):
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

    file = request.FILES.get('users')
    if not file:
        return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

    # Read file using pandas
    try:
        if file.name.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.name.endswith('.xlsx'):
            df = pd.read_excel(file)
        else:
            return Response({"error": "Invalid file format. Please upload a CSV or Excel file."}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": f"Error reading file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    created_users = []
    for _, row in df.iterrows():
        username = row.get('username')
        email = row.get('email')
        password = row.get('password', 'defaultpassword')  # Default password if missing
        role = row.get('role', '').lower()
        first_name = row.get('first_name', '')
        last_name = row.get('last_name', '')

        if not username or not email:
            continue  # Skip invalid rows

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            continue

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        # Assign roles based on CSV data
        if role == "super_admin":
            user.is_super_admin = True
            user.is_staff = True
            user.is_superuser = True
        elif role == "admin":
            user.is_admin = True
            user.is_staff = True
        elif role == "user":
            user.is_user = True

        user.save()
        created_users.append(username)

    return Response({"message": f"Users created: {', '.join(created_users)}"}, status=status.HTTP_201_CREATED)

class ImageListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]  # Ensure only authenticated users access
    queryset = Image.objects.all()
    serializer_class = ImageSerializer

class ImageListCreateView(generics.ListCreateAPIView):
    queryset = Image.objects.all()
    serializer_class = ImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) 

    @staticmethod
    def convert_to_decimal_degrees(gps_coords, ref=None):
        """
        Convert GPS coordinates from tuple (degrees, minutes, seconds) to decimal degrees.
        ref: 'N', 'S', 'E', 'W' (optional)
        """
        degrees, minutes, seconds = gps_coords
        decimal_degrees = degrees + (minutes / 60.0) + (seconds / 3600.0)
        if ref in ['S', 'W']:
            decimal_degrees = -decimal_degrees
        return decimal_degrees
    

    def create(self, request, *args, **kwargs):
        print("Authenticated User:", request.user)  # Debugging
        print("Request Data:", request.data)  # Debugging
        print("Request Files:", request.FILES)  # Debugging
        #if request.user.is_user:
         #   return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        image_file = request.FILES['image']
        image_data = image_file.read()

         # Extract EXIF metadata
        exif_image = ExifImage(image_data)
        latitude, longitude, location_name = None, None, None
        print(latitude,location_name)
        try:
            if exif_image.has_exif:
                try:
                    latitude_tuple = exif_image.gps_latitude
                    longitude_tuple = exif_image.gps_longitude
                    latitude_ref = exif_image.gps_latitude_ref  # 'N' or 'S'
                    longitude_ref = exif_image.gps_longitude_ref  # 'E' or 'W'

                    # Convert tuple-based GPS coordinates to decimal degrees
                    latitude = self.convert_to_decimal_degrees(latitude_tuple, latitude_ref)
                    longitude = self.convert_to_decimal_degrees(longitude_tuple, longitude_ref)

                    if latitude and longitude:
                        location_name = self.reverse_geocode1(latitude, longitude)
                        print("Location Name:", location_name)
                except AttributeError as e:
                    logger.error(f"AttributeError while extracting EXIF data: {e}")
        except Exception as e:
            logger.error("Error extracting EXIF data: %s", str(e))

        # Save the image with metadata
        image_instance = Image(
            user=request.user,
            image=image_file,
            latitude=latitude,
            longitude=longitude,
            location_name=location_name
        )
        image_instance.save()
        serializer = self.get_serializer(image_instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def reverse_geocode1(self, latitude, longitude):
        """
        Reverse geocode latitude and longitude to get location name.
        """
        geolocator = Nominatim(user_agent="app1")
        try:
            location = geolocator.reverse((latitude, longitude), exactly_one=True)
            if location:
                return location.address
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.error("Geocoding error: %s", str(e))
            return None
        return None
class ImageRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Image.objects.all()
    serializer_class = ImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Image.objects.all()
        return Image.objects.filter(user=user)
    def update(self, request, *args, **kwargs):
        print(request.user.is_user)
        print(request.user.is_admin)
        if not (request.user.is_admin or request.user.is_super_admin):
            print(request.user.is_super_admin)
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            image = self.get_object()  # Get the image instance to update
            print("Image found:", image.id)  # Debugging
        except Image.DoesNotExist:
            print("Image not found")  # Debugging
            return Response({"detail": "No Image matches the given query."}, status=status.HTTP_404_NOT_FOUND)
        print("Updating image:", image.id)  # Debugging
        print("Request data:", request.data)  # Debugging
        print("Request files:", request.FILES)  # Debugging

        # Handle image file update
        if 'image' in request.FILES:
            image_file = request.FILES['image']
            image_data = image_file.read()

            # Extract EXIF metadata
            exif_image = ExifImage(image_data)
            latitude, longitude, location_name = None, None, None

            try:
                if exif_image.has_exif:
                    try:
                        latitude_tuple = exif_image.gps_latitude
                        longitude_tuple = exif_image.gps_longitude
                        latitude_ref = exif_image.gps_latitude_ref  # 'N' or 'S'
                        longitude_ref = exif_image.gps_longitude_ref  # 'E' or 'W'

                        # Convert tuple-based GPS coordinates to decimal degrees
                        latitude = convert_to_decimal_degrees(latitude_tuple, latitude_ref)
                        longitude = convert_to_decimal_degrees(longitude_tuple, longitude_ref)

                        if latitude and longitude:
                            location_name = self.reverse_geocode1(latitude, longitude)
                    except AttributeError as e:
                        logger.error(f"AttributeError while extracting EXIF data: {e}")
            except Exception as e:
                logger.error("Error extracting EXIF data: %s", str(e))

            # Update image fields
            image.image = image_file
            image.latitude = latitude
            image.longitude = longitude
            image.location_name = location_name
            image.save()

            serializer = self.get_serializer(image)
            return Response(serializer.data)

        # If no image file is provided, update other fields
        serializer = self.get_serializer(image, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Failed to update image. Errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def reverse_geocode1(self, latitude, longitude):
        """
        Reverse geocode latitude and longitude to get location name.
        """
        geolocator = Nominatim(user_agent="app1")
        try:
            location = geolocator.reverse((latitude, longitude), exactly_one=True)
            if location:
                return location.address
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.error("Geocoding error: %s", str(e))
            return None
        return None

@api_view(['POST'])
def user_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        token, _ = Token.objects.get_or_create(user=user)  # Generate or retrieve token
        role = "Super Admin" if user.is_super_admin else "Admin" if user.is_admin else "User"
        return Response({
            'token': token.key,  # Return the token
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_super_admin': user.is_super_admin,
                'is_admin': user.is_admin,
                'is_user': user.is_user,
                'role': role 
            }
        })
    return Response({'error': 'Invalid credentials'}, status=400)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_role(request):
    """
    Returns the role of the currently authenticated user.
    """
    user = request.user
    role = "Super Admin" if user.is_super_admin else "Admin" if user.is_admin else "User"
    
    return Response({"role": role})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    logout(request)
    return Response({'message': 'Logged out successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_image(request):
    images = request.FILES.getlist('images')
    for image in images:
        image_data = image.read()
        exif_image = ExifImage(image_data)
        latitude, longitude , location_name= None, None,None
        if exif_image.has_exif:
            try:
                latitude_tuple = exif_image.gps_latitude
                longitude_tuple = exif_image.gps_longitude
                latitude_ref = exif_image.gps_latitude_ref  # 'N' or 'S'
                longitude_ref = exif_image.gps_longitude_ref  # 'E' or 'W'
                # Convert tuple-based GPS coordinates to decimal degrees
                
                latitude = ImageListCreateView.convert_to_decimal_degrees(latitude_tuple, latitude_ref)
                longitude = ImageListCreateView.convert_to_decimal_degrees(longitude_tuple, longitude_ref)
                print(longitude)
                print(latitude)
                if latitude and longitude:
                    location_name = reverse_geocode(latitude, longitude)
                    print(location_name)
            except AttributeError:
                pass
        Image.objects.create(user=request.user, image=image, latitude=latitude, longitude=longitude,location_name=location_name)
    return Response({'message': 'Images uploaded successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def compare_images(request):
    image1 = request.FILES['image1']
    image2 = request.FILES['image2']

    img1 = PILImage.open(image1).resize((224, 224))
    img2 = PILImage.open(image2).resize((224, 224))

    img1_array = np.array(img1) / 255.0
    img2_array = np.array(img2) / 255.0

    model = tf.keras.applications.MobileNetV2(include_top=False, pooling='avg')
    features1 = model.predict(np.expand_dims(img1_array, axis=0))
    features2 = model.predict(np.expand_dims(img2_array, axis=0))

    similarity = np.dot(features1, features2.T) / (np.linalg.norm(features1) * np.linalg.norm(features2))
    return Response({'similarity': similarity[0][0]})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_coordinates(request):
    location_name = request.data.get('location')
    geolocator = Nominatim(user_agent="app1")
    location = geolocator.geocode(location_name)
    if location:
        Location.objects.create(name=location_name, latitude=location.latitude, longitude=location.longitude)
        return Response({'latitude': location.latitude, 'longitude': location.longitude})
    return Response({'error': 'Location not found'}, status=status.HTTP_404_NOT_FOUND)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_transport_cost(request):
    """
    Calculate the cost of traveling to a location based on distance and suggest the best mode of transport.
    """
    # Your place's coordinates (reference location)
    target_coords = (28.6139, 77.2090)  # Example: Delhi, India
    image_id = request.data.get('image_id')
    if not image_id:
        return Response({"error": "No image ID provided."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        image = Image.objects.get(id=image_id)
    except Image.DoesNotExist:
        return Response({"error": "Image not found."}, status=status.HTTP_404_NOT_FOUND)

    # Get coordinates
    target_coords = (34.075375,-84.294090)
    image_coords = (image.latitude, image.longitude)
    print(image_coords)

    

    # Calculate distance using geopy
    distance_km =  geodesic(target_coords, image_coords).km 

    # Define transport rates
    cab_rate_per_km = 1.5  # $1.5 per km for cab
    airplane_rate_per_km = 0.5  # $0.5 per km for airplane
    airplane_fixed_cost = 100  # $100 fixed cost for airplane

    # Calculate costs
    cab_cost = distance_km * cab_rate_per_km
    airplane_cost = (distance_km * airplane_rate_per_km) + airplane_fixed_cost

    # Decide the best mode of transport
    if distance_km > 500:
        suggested_transport = "airplane"
        suggested_cost = airplane_cost
    else:
        suggested_transport = "cab"
        suggested_cost = cab_cost

    # Return the results as a JSON response
    return Response({
        'distance_km': distance_km,
        'cab_cost': cab_cost,
        'airplane_cost': airplane_cost,
        'suggested_transport': suggested_transport,
        'suggested_cost': suggested_cost,
    }, status=status.HTTP_200_OK)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_target_image(request):
    """
    Upload a target image and extract its location metadata.
    """
    if 'image' not in request.FILES:
        return Response({"error": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)

    image_file = request.FILES['image']
    image_data = image_file.read()

    # Extract EXIF metadata
    exif_image = ExifImage(image_data)
    latitude, longitude, location_name = None, None, None

    try:
        if exif_image.has_exif:
            try:
                latitude_tuple = exif_image.gps_latitude
                longitude_tuple = exif_image.gps_longitude
                latitude_ref = exif_image.gps_latitude_ref  # 'N' or 'S'
                longitude_ref = exif_image.gps_longitude_ref  # 'E' or 'W'

                # Convert tuple-based GPS coordinates to decimal degrees
                latitude = convert_to_decimal_degrees(latitude_tuple, latitude_ref)
                longitude = convert_to_decimal_degrees(longitude_tuple, longitude_ref)

                if latitude and longitude:
                    location_name = reverse_geocode(latitude, longitude)
            except AttributeError as e:
                logger.error(f"AttributeError while extracting EXIF data: {e}")
    except Exception as e:
        logger.error("Error extracting EXIF data: %s", str(e))

    if not latitude or not longitude:
        return Response({"error": "Could not extract location data from the image."}, status=status.HTTP_400_BAD_REQUEST)

    # Save the target location details in the session or database (optional)
    request.session['target_location'] = {
        'latitude': latitude,
        'longitude': longitude,
        'location_name': location_name
    }

    return Response({
        'latitude': latitude,
        'longitude': longitude,
        'location_name': location_name
    }, status=status.HTTP_201_CREATED)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_distance(request):
    """
    Calculate the distance between the target location and a selected image's location.
    """
    target_location = "New Delhi"
    if not target_location:
        return Response({"error": "No target location found. Upload a target image first."}, status=status.HTTP_400_BAD_REQUEST)

    image_id = request.data.get('image_id')
    if not image_id:
        return Response({"error": "No image ID provided."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        image = Image.objects.get(id=image_id)
    except Image.DoesNotExist:
        return Response({"error": "Image not found."}, status=status.HTTP_404_NOT_FOUND)

    # Get coordinates
    target_coords = (28.6139, 77.2090)
    image_coords = (image.latitude, image.longitude)
    print(image_coords)

    # Calculate distance using geopy
    distance = geodesic(target_coords, image_coords).km  # Distance in kilometers

    return Response({
        'distance_km': distance,
        'target_location': target_location,
        'image_location': {
            'latitude': image.latitude,
            'longitude': image.longitude,
            'location_name': image.location_name
        }
    }, status=status.HTTP_200_OK)


