import React from "react";
import { Button, AppBar, Toolbar } from "@mui/material";

const Navbar = ({ setShowUploader, setShowImageUploader }) => {
  return (
    <AppBar position="sticky" sx={{ backgroundColor: "#333" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button
          color="inherit"
          onClick={() => setShowUploader((prev) => !prev)}
          sx={{ marginRight: 2, fontWeight: "bold" }}
        >
          Upload Data from File
        </Button>
        <Button
          color="inherit"
          onClick={() => setShowImageUploader((prev) => !prev)}
          sx={{ fontWeight: "bold" }}
        >
          Upload Image
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
