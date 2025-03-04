import React, { useState } from "react";
import axios from "axios";

const ImageUpload = () => {
  // State for Single Image Upload
  const [singleImage, setSingleImage] = useState(null);
  const [singleTitle, setSingleTitle] = useState("");
  const [singleMessage, setSingleMessage] = useState("");

  // State for Multiple Image Upload
  const [multiImages, setMultiImages] = useState([]);
  const [multiMessage, setMultiMessage] = useState("");

  // Handle Single Image Selection
  const handleSingleImageChange = (e) => {
    setSingleImage(e.target.files[0]);
  };

  // Handle Multiple Image Selection
  const handleMultiImageChange = (e) => {
    setMultiImages([...e.target.files]);
  };

  // Submit Single Image
  const handleSingleSubmit = async (e) => {
    e.preventDefault();

    if (!singleImage || !singleTitle) {
      setSingleMessage("Please enter a title and select an image.");
      return;
    }

    const formData = new FormData();
    formData.append("title", singleTitle);
    formData.append("image", singleImage);

    try {
      await axios.post("http://localhost:8000/api/images/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSingleMessage("Image uploaded successfully!");
    } catch (error) {
      setSingleMessage("Error uploading image.");
    }
  };

  // Submit Multiple Images
  const handleMultiSubmit = async (e) => {
    e.preventDefault();

    if (multiImages.length === 0) {
      setMultiMessage("Please select at least one image.");
      return;
    }

    const formData = new FormData();
    multiImages.forEach((image) => {
      formData.append("images", image);
    });

    try {
      await axios.post("http://localhost:8000/api/multi-images/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMultiMessage("Images uploaded successfully!");
    } catch (error) {
      setMultiMessage("Error uploading images.");
    }
  };

  return (
    <div>
      <h2>Upload Single or Multiple Images</h2>

      {/* Single Image Upload Form */}
      <form onSubmit={handleSingleSubmit}>
        <h3>Single Image Upload</h3>
        <input
          type="text"
          placeholder="Enter title"
          value={singleTitle}
          onChange={(e) => setSingleTitle(e.target.value)}
        />
        <input type="file" onChange={handleSingleImageChange} />
        <button type="submit">Upload Single Image</button>
        {singleMessage && <p>{singleMessage}</p>}
      </form>

      <hr />

      {/* Multiple Image Upload Form */}
      
    </div>
  );
};

export default ImageUpload;
