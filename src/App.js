import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Login from "./components/Login/Login";
import Signup from "./pages/Signup/Signup";
import Userpage from "./pages/Userpage/Userpage";
import { ToastContainer } from "react-toastify";



function App() {
  return (
    
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/user" element={<Userpage />} />
      </Routes>
    </Router>
  );
}

export default App;