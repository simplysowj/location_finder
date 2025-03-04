from django.db import migrations
import pandas as pd
import os

def create_users_from_file(apps, schema_editor):
    User = apps.get_model('app1', 'User')  # Adjust with your actual app name

    # Define file path based on your given location
    FILE_PATH = r"C:\Users\simpl\Downloads\location_finder\backend_locationfinder\users.csv"

    # Read user data from CSV
    try:
        df = pd.read_csv(FILE_PATH)
    except FileNotFoundError:
        print(f"Error: {FILE_PATH} not found. Ensure the file is present.")
        return

    # Iterate through the file and create users dynamically
    for index, row in df.iterrows():
        username = row['username']
        email = row['email']
        password = row['password']
        role = row['role']
        first_name = row['first_name']
        last_name = row['last_name']

        # Check if the user already exists
        if not User.objects.filter(username=username).exists():
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
                user.is_user = False
                user.is_admin = False
            elif role == "admin":
                user.is_admin = True
                user.is_staff = True
                user.is_user = False
                user.is_super_admin = False
            elif role == "user":
                user.is_user = True
                user.is_admin = False
                user.is_super_admin = False

            user.save()
            print(f"✅ User {username} created successfully")

class Migration(migrations.Migration):
    dependencies = [
        ('app1', '0001_initial'),  # Update with your latest migration name
    ]

    operations = [
        migrations.RunPython(create_users_from_file),
    ]
