import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UserDashboard = () => {
  const [images, setImages] = useState([]);
  const [targetImage, setTargetImage] = useState(null);
  const [targetLocation, setTargetLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const [cabCost, setCabCost] = useState(null);
  const [airplaneCost, setAirplaneCost] = useState(null);
  const [suggestedTransport, setSuggestedTransport] = useState(null);
  const [suggestedCost, setSuggestedCost] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/api/images/", {
          headers: { Authorization: `Token ${token}` },
        });

        if (!response.ok) throw new Error("Error fetching images");
        const data = await response.json();
        setImages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load images.");
      }
    };

    fetchImages();
    setUserRole(localStorage.getItem("role"));
  }, [navigate]);
  const handleTargetImageUpload = async () => {
    if (!targetImage) {
        setError("Please select a target image.");
        return;
    }

    const formData = new FormData();
    formData.append("image", targetImage);

    try {
        const response = await fetch("http://localhost:8000/api/upload-target-image/", {
            method: "POST",
            headers: {
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Failed to upload target image.");
        }

        const data = await response.json();
        setTargetLocation(data);
        setError("");
    } catch (err) {
        console.error("Error uploading target image:", err);
        setError(err.message);
    }
};

const handleCalculateDistance = async (imageId) => {
    

    try {
        const response = await fetch("http://localhost:8000/api/calculate-distance/", {
            method: "POST",
            headers: {
                Authorization: `Token ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({  image_id: imageId  }),
        });

        if (!response.ok) {
            throw new Error("Failed to calculate distance.");
        }

        const data = await response.json();
        setDistance(data.distance_km);
        setError("");
    } catch (err) {
        console.error("Error calculating distance:", err);
        setError(err.message);
    }
};

const calculateTransportCost = async (imageId) => {
    const token = localStorage.getItem("token");
    if (!token) {
        setError("User is not authenticated. Please log in.");
        console.error("No authentication token found.");
        return;
    }
    try {
      console.log("entered")
      

      const response = await fetch(
        `http://localhost:8000/api/calculate-transport-cost/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({  image_id: imageId  }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to calculate transport cost.: ${response.status}");
      }

      const data = await response.json();
      console.log("Transport Cost API Response:", data); 
      setCabCost(data.cab_cost);
      setAirplaneCost(data.airplane_cost);
      setSuggestedTransport(data.suggested_transport);
      setSuggestedCost(data.suggested_cost);
    } catch (err) {
      console.error("Error calculating transport cost:", err);
      setError(err.message);
    }
  };
  useEffect(() => {
    console.log("Cab Cost Updated:", cabCost);
    console.log("Airplane Cost Updated:", airplaneCost);
  }, [cabCost, airplaneCost]);
  

  return (
    <div>
      <h1>User Dashboard</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      


      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
        {images.map((image) => {
          
          const googleMapsLink = `https://www.google.com/maps?q=${image.latitude},${image.longitude}`;

          return (
          <div key={image.id} style={{ textAlign: "center", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
            <img
              src={image.image}
              alt="Uploaded"
              style={{ width: "100px", height: "100px", objectFit: "cover" }}
            />
            <br />
            <p><strong>Latitude:</strong> {image.latitude}</p>
            <p><strong>Longitude:</strong> {image.longitude}</p>
            <p><strong>Location:</strong> {image.location_name}</p>
            
            <a
                href={googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "blue", textDecoration: "underline" }}
              >
                View on Google Maps
              </a>
              <br />
            <button onClick={() => handleCalculateDistance(image.id)}>Calculate Distance</button>
            <button onClick={() => calculateTransportCost(image.id)}>Calculate Transportation Cost</button>
          </div>
          );
        })}
        </div>
       {/* Display Distance */}
       {distance !== null && (
                <div>
                    <h3>Calculated Distance</h3>
                    <p><strong>Distance:</strong> {distance.toFixed(2)} km</p>
                </div>
            )}
        {/* Display Transport Costs */}
      
      {cabCost !== null && airplaneCost !== null && (
        <div>
          <h3>Transport Costs</h3>
          <p><strong>Cab Cost:</strong> ${cabCost.toFixed(2)}</p>
          <p><strong>Airplane Cost:</strong> ${airplaneCost.toFixed(2)}</p>
          <p><strong>Suggested Transport:</strong> {suggestedTransport}</p>
          <p><strong>Suggested Cost:</strong> ${suggestedCost.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
