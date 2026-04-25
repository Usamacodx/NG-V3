import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin({ setIsAdmin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

    const admins = [
    { email: "amnashabbir@gmail.com", password: "Java*20" }
  ];

  const handleLogin = (e) => {
    e.preventDefault();

    // ✅ Check if entered credentials match any admin
    const validAdmin = admins.find(
      (admin) => admin.email === email && admin.password === password
    );
  
    if (validAdmin) {
      // Save login state
      localStorage.setItem("isAdminLoggedIn", "true");

      // Update state
      setIsAdmin(true);

      // Notify other tabs
      window.dispatchEvent(new Event("storage"));

      // Redirect
      navigate("/products");
    } else {
      alert("Invalid admin credentials");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Admin Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <button type="submit" style={{ padding: "10px 15px", width: "100%" }}>
          Login
        </button>
      </form>
    </div>
  );
}