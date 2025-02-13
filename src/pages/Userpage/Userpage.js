import React from "react";
import { Container, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { auth,db } from "../../firebaseConfig"; 
import { signOut } from "firebase/auth";

import { useEffect, useState } from "react";

import { doc, getDoc, setDoc} from "../../firebaseConfig";


const UserPage = () => {
    const [userName, setUserName] = useState("");
    const navigate = useNavigate();
  
    useEffect(() => {
      const fetchUserName = async () => {
        const user = auth.currentUser;
        console.log("Current User:", user); // Log the user object
  
        if (user) {
          try {
            const userDocRef = doc(db, "users", user.uid);
            console.log("Fetching document for UID:", user.uid);
  
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              console.log("User Document Data:", userDoc.data()); // Log the fetched data
              setUserName(userDoc.data().firstName); // Assuming 'name' field exists
            } else {
              console.log("User document not found in Firestore");
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        } else {
          console.log("No authenticated user found");
        }
      };
  
      fetchUserName();
    }, []);
  
    const handleLogout = async () => {
      try {
        await auth.signOut();
        navigate("/"); // Redirect to login page
      } catch (error) {
        console.error("Logout error:", error);
      }
    };
  
    return (
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <Typography variant="h3" gutterBottom>
          Welcome, {userName ? userName : "User"}!
        </Typography>
        <Button variant="contained" color="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Container>
    );
  };
  
  export default UserPage;