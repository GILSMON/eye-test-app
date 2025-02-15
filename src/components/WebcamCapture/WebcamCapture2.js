import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';

const WebcamCapture = () => {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [isBlinkDetecting, setIsBlinkDetecting] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [eyeStatus, setEyeStatus] = useState('Open');  // Track the current eye status (Open / Closed / Either / Palm)
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const lastBlinkTimeRef = useRef(0);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      console.log("Models Loaded!");
    };

    loadModels();

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  const handleStartWebcam = () => {
    setIsWebcamActive(true);
  };

  const handleStopWebcam = () => {
    setIsWebcamActive(false);
    if (socketRef.current) {
      socketRef.current.close();
    }
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleFrameCapture = () => {
    if (videoRef.current && canvasRef.current && socketRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      socketRef.current.send(JSON.stringify({ image: imageData }));
    }
    setTimeout(() => {
      requestAnimationFrame(handleFrameCapture);
    }, 200);
  };

  const handleSocketMessage = (event) => {
    const data = JSON.parse(event.data);
    setProcessedImage(data.image);
  };

  const detectBlink = async () => {
    if (videoRef.current) {
      const detections = await faceapi.detectAllFaces(videoRef.current).withFaceLandmarks();
      if (detections && detections.length > 0) {
        const face = detections[0];
        const landmarks = face.landmarks;
        
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const leftEAR = calculateEAR(leftEye);
        const rightEAR = calculateEAR(rightEye);

        const threshold = 0.2; // Threshold for detecting closed eyes
        const currentTime = Date.now();

        // Check for eye status based on EAR values
        if (leftEAR < threshold && rightEAR < threshold) {
          // Both eyes are closed
          setEyeStatus('Closed');
          if (currentTime - lastBlinkTimeRef.current > 1000) {
            lastBlinkTimeRef.current = currentTime;
            setBlinkCount(prevCount => prevCount + 1);
            console.log('Both eyes closed: Blink detected!');
          }
        } else if (leftEAR < threshold || rightEAR < threshold) {
          // One of the eyes is closed
          setEyeStatus('Either Closed');
        } else {
          // Both eyes are open
          setEyeStatus('Open');
        }

        // Check for palm gesture detection (for simplicity, we assume it's part of face landmarks)
        if (isPalmGestureDetected(detections)) {
          setEyeStatus('Closed with Palm');
        }
      }
    }
  };

  const calculateEAR = (eye) => {
    const A = Math.sqrt(Math.pow(eye[1].y - eye[5].y, 2) + Math.pow(eye[2].y - eye[4].y, 2));
    const B = Math.sqrt(Math.pow(eye[0].x - eye[3].x, 2));
    return A / (2.0 * B);
  };

  // Mock function to simulate palm detection (you can replace with an actual model or gesture detection logic)
  const isPalmGestureDetected = (detections) => {
    // Placeholder for palm detection logic. You might use other APIs or logic here.
    return false; // Assuming no palm detected for now
  };

  const startDetectingBlinks = () => {
    setIsBlinkDetecting(true);
    detectionIntervalRef.current = setInterval(detectBlink, 100);  // Check for blinks every 100ms
  };

  const stopDetectingBlinks = () => {
    clearInterval(detectionIntervalRef.current); // Stop the interval for blink detection
    setIsBlinkDetecting(false); // Set detecting flag to false
    setBlinkCount(0); // Reset the blink count
    setEyeStatus('Open'); // Reset eye status
  };

  useEffect(() => {
    if (isWebcamActive) {
      socketRef.current = new WebSocket('ws://127.0.0.1:8000/ws/camera/');
      socketRef.current.onopen = () => {
        console.log('WebSocket connection established');
        handleFrameCapture();
      };
      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      socketRef.current.onclose = () => {
        console.log('WebSocket connection closed');
      };
      socketRef.current.onmessage = handleSocketMessage;

      const startVideo = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
          }
        } catch (err) {
          console.error('Error accessing webcam:', err);
        }
      };

      startVideo();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);  // Clean up interval on unmount
      }
    };
  }, [isWebcamActive]);

  return (
    <div>
      <button onClick={handleStartWebcam}>Start Webcam</button>
      <button onClick={handleStopWebcam}>Stop Webcam</button>
      <button onClick={startDetectingBlinks} disabled={isBlinkDetecting}>Start Detecting Blinks</button>
      <button onClick={stopDetectingBlinks} disabled={!isBlinkDetecting}>Stop Detecting Blinks</button>
      <p>Blinks Detected: {blinkCount}</p>
      <p>Eye Status: {eyeStatus}</p>
      {isWebcamActive && (
        <video ref={videoRef} autoPlay style={{ transform: 'scaleX(-1)' }} />
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
       {isWebcamActive && processedImage && <img src={processedImage} alt="Processed" />}
    </div>
  );
};

export default WebcamCapture;