import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Redirect unauthorized users
import axios from "axios";

const AdminDashboard = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [distance, setDistance] = useState(null);
  const navigate = useNavigate(); // To redirect if unauthorized
  const [cabCost, setCabCost] = useState(null);
  const [airplaneCost, setAirplaneCost] = useState(null);
  const [suggestedTransport, setSuggestedTransport] = useState(null);
  const [suggestedCost, setSuggestedCost] = useState(null);
  const [message, setMessage] = useState("");
  const handleFileChange1 = (event) => {
    setFile(event.target.files[0]);
  };
  const handleUpload1 = async () => {
    if (!file) {
      setMessage("Please select a file.");
      return;
    }
    const formData1 = new FormData();
    formData1.append("users", file);
    console.log("Selected File:", file);
    console.log("FormData Keys:", formData1.keys());
    console.log("entered");
    try {
        console.log("entered1")
        const response = await axios.post(
          "http://127.0.0.1:8000/api/upload-users/", 
          
          
          formData1, 
          { 
            headers: { 
              "Content-Type": "multipart/form-data",
              Authorization: `Token ${localStorage.getItem("token")}`,
            } 
          }
        );
        setMessage(response.data.message);
      } catch (error) {
        setMessage(error.response?.data?.error || "Upload failed.");
      }
    };
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
    // Include latitude, longitude, and location_name if available
    if (selectedImage.latitude) {
        formData.append("latitude", selectedImage.latitude);
    }
    if (selectedImage.longitude) {
        formData.append("longitude", selectedImage.longitude);
    }
    if (selectedImage.location_name) {
        formData.append("location_name", selectedImage.location_name);
    }

    console.log("Updating image with ID:", selectedImage.id); // Debugging
    console.log("FormData:", formData); // Debugging

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
      console.log("Update response status:", response.status); // Debugging

      if (response.status === 401) {
        setError("Unauthorized. Please log in again.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json(); // Get detailed error message
        console.error("Update failed with errors:", errorData); // Debugging
        throw new Error("Failed to update image");
    }

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
      <h1>Admin Dashboard</h1>
      <div>
      <h2>Upload User Data</h2>
      <input type="file" accept=".csv, .xlsx" onChange={handleFileChange1} />
      <button onClick={handleUpload1}>Upload</button>
      {message && <p>{message}</p>}
    </div>
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
        // Log the image path to the console
        //console.log(image.image);
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

export default AdminDashboard;
