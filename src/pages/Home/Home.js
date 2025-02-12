import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import homePageImage from "../../assets/images/home_page_image.jpg"

const Home = () => {
  return (
    <div>
      <Navbar />
      <div className="home-container">
        <img
          src={homePageImage} 
          alt="Eye Test"
          className="home-image"
          
        />
        
      </div>
      
    </div>
  );
};






export default Home;