import React, { useState, useRef } from 'react';

const WebcamCapture = () => {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);

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
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);  // Clears the canvas
    }
  };

  const handleFrameCapture = () => {
    if (videoRef.current && canvasRef.current && socketRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvasRef.current.toDataURL('image/jpeg');

      // Send the image frame to the Django WebSocket server
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

  React.useEffect(() => {
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
    };
  }, [isWebcamActive]);

  return (
    <div>
      <button onClick={handleStartWebcam}>Start Webcam</button>
      <button onClick={handleStopWebcam}>Stop Webcam</button>
      {isWebcamActive && (
        <video ref={videoRef} autoPlay style={{ transform: 'scaleX(-1)' }} />
      )}
     <canvas ref={canvasRef} style={{ display: 'none' }} />
     {isWebcamActive && processedImage && <img src={processedImage} alt="Processed" style={{ transform: 'scaleX(-1)' }}/>} 
    </div>
  );
};

export default WebcamCapture;
