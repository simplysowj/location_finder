from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

def reverse_geocode(latitude, longitude):
    geolocator = Nominatim(user_agent="app1")
    try:
        location = geolocator.reverse((latitude, longitude), exactly_one=True)
        if location:
            return location.address  # Returns the full address as a string
    except GeocoderTimedOut:
        return None
    return None
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