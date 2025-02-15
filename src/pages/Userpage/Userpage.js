import React, { useEffect, useState } from "react";
import { Container, Typography, Button, AppBar, Toolbar, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import WebcamCapture from "../../components/WebcamCapture/WebcamCapture";

const UserPage = () => {
  const [userName, setUserName] = useState("");
  const [score, setScore] = useState(0); // Placeholder for future score tracking
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            console.log("User Document Data:", userDoc.data());
            setUserName(userDoc.data().firstName || "User");
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
      navigate("/"); // Redirect to homepage
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#F5F5F5",
      }}
    >
      {/* Top Score Bar */}
      <AppBar position="static" sx={{ backgroundColor: "#0D1B2A", padding: 1 }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ color: "#E0E1DD", fontWeight: "bold" }}>
            Welcome, {userName}!
          </Typography>
          <Typography variant="h6" sx={{ color: "#E0E1DD" }}>
            Score: {score}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexGrow: 1,
          mt: 4,
        }}
      >
        <WebcamCapture />
        <Button
          variant="contained"
          color="secondary"
          onClick={handleLogout}
          sx={{ mt: 3 }}
        >
          Logout
        </Button>
      </Container>
    </Box>
  );
};

export default UserPage;