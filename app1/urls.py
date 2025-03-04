# myapp/urls.py

from django.urls import path
from . import views
from .views import ImageListCreateView, ImageRetrieveUpdateDestroyView
from rest_framework.authtoken.views import obtain_auth_token
from .views import upload_target_image, calculate_distance
from .views import calculate_transport_cost
from .views import upload_users

urlpatterns = [
    path("images/", ImageListCreateView.as_view(), name="image-list-create"),
    path('token-auth/', obtain_auth_token, name='api_token_auth'),  # Add this line
    path("images/<int:pk>/", ImageRetrieveUpdateDestroyView.as_view(), name="image-retrieve-update-destroy"),
    # User authentication
    path('login/', views.user_login, name='login'),
    path('upload-users/', upload_users, name='upload-users'),
    path('logout/', views.user_logout, name='logout'),
    path('user-role/', views.get_user_role, name='user-role'),
    path('upload-target-image/', upload_target_image, name='upload_target_image'),
    path('calculate-distance/', calculate_distance, name='calculate_distance'),
    path('calculate-transport-cost/', calculate_transport_cost, name='calculate_transport_cost'),
    
    # Image upload and comparison
    path('upload/', views.upload_image, name='upload_image'),
    path('compare/', views.compare_images, name='compare_images'),

    # Location and distance
    path('coordinates/', views.get_coordinates, name='get_coordinates'),
    path('distance/', views.calculate_distance, name='calculate_distance'),
]