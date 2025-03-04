import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Redirect unauthorized users

const SuperAdminDashboard = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState(null); // State to store the user's role
  const navigate = useNavigate(); // To redirect if unauthorized
  const [cabCost, setCabCost] = useState(null);
  const [airplaneCost, setAirplaneCost] = useState(null);
  const [suggestedTransport, setSuggestedTransport] = useState(null);
  const [suggestedCost, setSuggestedCost] = useState(null);
  const [distance, setDistance] = useState(null);



  useEffect(() => {
    const fetchImages = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.warn("Token not found. Redirecting to login...");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/api/images/", {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (response.status === 401) {
          console.error("Unauthorized access. Logging out...");
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const data = await response.json();
        setImages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching images:", err);
        setError("Failed to load images. Please try again.");
      }
    };

    fetchImages();

    // Fetch the user's role from localStorage (set during login)
    const role = localStorage.getItem("role");
    setUserRole(role);
    console.log("User Role:", role); 
  }, [navigate]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
  };

  const handleUpload = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentication required. Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("http://localhost:8000/api/images/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        setError("Unauthorized. Please log in again.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      if (!response.ok) throw new Error("Failed to upload image");

      const newImage = await response.json();
      setImages([...images, newImage]);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image. Please try again.");
    }
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentication required. Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    if (!file || !selectedImage) {
      setError("Please select an image to update.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(
        `http://localhost:8000/api/images/${selectedImage.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Token ${token}`,
          },
          body: formData,
        }
      );

      if (response.status === 401) {
        setError("Unauthorized. Please log in again.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      if (!response.ok) throw new Error("Failed to update image");

      const updatedImage = await response.json();
      setImages(
        images.map((image) => (image.id === updatedImage.id ? updatedImage : image))
      );
      setSelectedImage(null);
      setFile(null);
    } catch (err) {
      console.error("Error updating image:", err);
      setError("Failed to update image. Please try again.");
    }
  };

  const handleDelete = async (imageId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentication required. Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }
    if (userRole !== "Super Admin") {
        setError("You do not have permission to delete this image.");
        return;
      }

    try {
      const response = await fetch(
        `http://localhost:8000/api/images/${imageId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.status === 401) {
        setError("Unauthorized. Please log in again.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      if (!response.ok) throw new Error("Failed to delete image");

      // Remove the deleted image from the state
      setImages(images.filter((image) => image.id !== imageId));
    } catch (err) {
      console.error("Error deleting image:", err);
      setError("Failed to delete image. Please try again.");
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
      <h1>SuperAdmin Dashboard</h1>
      {error && <p className="error" style={{ color: "red" }}>{error}</p>}

      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file}>Upload Image</button>

      {selectedImage && (
        <div>
          <h3>Update Selected Image</h3>
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleUpdate} disabled={!file}>Update Image</button>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
        {images.map((image) => {
          //console.log(image.image); // Log the image path to the console
          const googleMapsLink = `https://www.google.com/maps?q=${image.latitude},${image.longitude}`;

          return (
            <div key={image.id} style={{ textAlign: "center", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
              <img
                src={image.image}
                alt={image.name}
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
              <button onClick={() => setSelectedImage(image)}>Edit</button>
              {/* Show delete button only for Super Admin */}
              {userRole === "Super Admin" && (
                <button
                  onClick={() => handleDelete(image.id)}
                  style={{ marginLeft: "5px", backgroundColor: "red", color: "white" }}
                >
                  Delete
                </button>
              )}
              <br/>
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

export default SuperAdminDashboard;