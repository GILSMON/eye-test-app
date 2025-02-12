import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <h1>Eye Test App</h1>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/login" className="nav-button">Login</Link>
        <Link to="/signup" className="nav-button">Sign Up</Link>
       
      
      </div>
    </nav>
  );
};

export default Navbar;