import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // For redirecting after login

function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // For redirecting after login

  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
  
      if (!response.ok) {
        throw new Error("Login failed");
      }
  
      const data = await response.json();
      localStorage.setItem("token", data.token); // Store the token
      localStorage.setItem("user", JSON.stringify(data.user)); // Store user data
      localStorage.setItem("role", data.user.role);
      //console.log(role)
      setUser(data.user); // Update user state
      navigate("/admin"); // Redirect to the admin dashboard
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    }
  };
  return (
    <div className="login">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Login;