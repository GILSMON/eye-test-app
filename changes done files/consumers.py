import base64
import cv2
import numpy as np
import json
import mediapipe as mp
import io
from PIL import Image
from channels.generic.websocket import AsyncWebsocketConsumer


class VideoConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            min_detection_confidence=0.5, 
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
    async def connect(self):
        # Accept the WebSocket connection
        await self.accept()
        print("Web Socket Connected")

    async def disconnect(self, close_code):
        # Handle disconnection (cleanup if needed)
        pass

    async def receive(self, text_data):
        # Receive frame from React frontend (image data)
        data = json.loads(text_data)
        image_data = data['image']  # Get the image data
        processed_image = self.process_image(image_data)


        await self.send(text_data=json.dumps({
            "image": f"data:image/jpeg;base64,{processed_image}"
            }))
    
    def is_eye_open(self,image: np.ndarray):
    # Initialize MediaPipe Face Mesh
        mp_face_mesh = mp.solutions.face_mesh
        face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)
        mp_drawing = mp.solutions.drawing_utils

        # Convert the image to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Process the image to get face landmarks
        results = face_mesh.process(rgb_image)

        if not results.multi_face_landmarks:
            return False  # No faces detected

        # Define the indices for the left and right eyes
        LEFT_EYE = [33, 160, 158, 133, 153, 144, 163, 7, 163, 144, 145, 153, 154, 155, 133]
        RIGHT_EYE = [362, 385, 387, 263, 373, 380, 381, 249, 249, 380, 381, 373, 374, 385, 362]

        # Function to calculate the Euclidean distance between two points
        def euclidean_distance(p1, p2):
            return np.linalg.norm(np.array(p1) - np.array(p2))

        # Function to calculate the Eye Aspect Ratio (EAR)
        def eye_aspect_ratio(eye_landmarks):
            # Calculate the distances between the vertical and horizontal eye landmarks
            A = euclidean_distance(eye_landmarks[1], eye_landmarks[5])
            B = euclidean_distance(eye_landmarks[2], eye_landmarks[4])
            C = euclidean_distance(eye_landmarks[0], eye_landmarks[3])
            # Compute the EAR
            ear = (A + B) / (2.0 * C)
            return ear

        # Iterate over each detected face
        for face_landmarks in results.multi_face_landmarks:
            # Get the landmarks for the left and right eyes
            left_eye_landmarks = [face_landmarks.landmark[i] for i in LEFT_EYE]
            right_eye_landmarks = [face_landmarks.landmark[i] for i in RIGHT_EYE]

            # Convert the normalized landmarks to pixel coordinates
            h, w, _ = image.shape
            left_eye_landmarks = [(int(landmark.x * w), int(landmark.y * h)) for landmark in left_eye_landmarks]
            right_eye_landmarks = [(int(landmark.x * w), int(landmark.y * h)) for landmark in right_eye_landmarks]

            # Calculate the EAR for both eyes
            left_ear = eye_aspect_ratio(left_eye_landmarks)
            right_ear = eye_aspect_ratio(right_eye_landmarks)
            
            # Define the threshold for detecting a closed eye
            EAR_THRESHOLD = 0.2

            # Determine if both eyes are open
            if left_ear > EAR_THRESHOLD and right_ear > EAR_THRESHOLD:
                return ("open")  # Eyes are open
            elif left_ear > EAR_THRESHOLD and right_ear< EAR_THRESHOLD:
                return ("Left eye closed")
            elif left_ear <EAR_THRESHOLD and right_ear>EAR_THRESHOLD:
                return ("Right eye closed")
            else:
                return ("closed")  # Eyes are closed
        return None

    def process_image(self, image_data):
    # Make sure to strip 'data:image/jpeg;base64,' from the base64 string
        img_data = image_data.split(",")[1]  # Remove 'data:image/jpeg;base64,'
        
        try:
            imgdata = base64.b64decode(img_data)
            np_arr = np.frombuffer(imgdata, np.uint8)
            # Decode the image using OpenCV
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise ValueError("Failed to decode image")
            
            result_text = self.is_eye_open(img)
            img = cv2.flip(img, 1)

            font = cv2.FONT_HERSHEY_SIMPLEX
            cv2.putText(img, result_text, (50, 50), font, 1, (0, 255, 0), 2, cv2.LINE_AA)

            # Encode the image again and return it to the frontend as base64
            _, buffer = cv2.imencode('.jpg', img)
            processed_image = base64.b64encode(buffer).decode('utf-8')
            
            return f"{processed_image}"
        
        except Exception as e:
            print(f"Error in process_image: {e}")
            return None

        