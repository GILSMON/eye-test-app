import base64
import cv2
import numpy as np
import json
import mediapipe as mp
from PIL import Image
from channels.generic.websocket import AsyncWebsocketConsumer
from io import BytesIO

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
        # print(image_data)

        # Process the image (for example, apply image processing)
        processed_image = self.process_image(image_data)

        # Send the processed image back to the frontend
        # await self.send(text_data=json.dumps({
        #     'image': processed_image
        # }))
        await self.send(text_data=json.dumps({
            "image": f"data:image/jpeg;base64,{processed_image}"
            }))

    def process_image(self, image_data):
        # Process the image and return (currently we just return the same image)
        img_data = base64.b64decode(image_data.split(",")[1])  # Remove the "data:image/jpeg;base64," prefix
        image = Image.open(BytesIO(img_data))
        buffered = BytesIO()
        image.save(buffered, format="JPEG")
        processed_image_data = base64.b64encode(buffered.getvalue()).decode('utf-8')
        return f"{processed_image_data}"
        
    # def process_mediapipe_imgae(self, image_data):
    #     img_data = base64.b64decode(image_data.split(",")[1])
    #     np_img = np.frombuffer(img_data, dtype=np.uint8)
    #     img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    #     # Process the image with MediaPipe Face 
    #     with self.face_mesh as face_mesh:
    #         # Convert the image to RGB (MediaPipe expects RGB)
    #         rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    #         results = face_mesh.process(rgb_img)

    #         if results.multi_face_landmarks:
    #             for face_landmarks in results.multi_face_landmarks:
    #                 # Extract landmarks for the eyes (indices for iris landmarks)
    #                 left_eye = face_landmarks.landmark[33]  # Index 33 corresponds to the left eye
    #                 right_eye = face_landmarks.landmark[263]  # Index 263 corresponds to the right eye

    #                 # Calculate the iris movement (e.g., x, y position of the iris)
    #                 iris_data = {
    #                     "left_eye_x": left_eye.x,
    #                     "left_eye_y": left_eye.y,
    #                     "right_eye_x": right_eye.x,
    #                     "right_eye_y": right_eye.y,
    #                 }

    #                 # Send the iris data back to the frontend
    #                 # await self.send(text_data=json.dumps(iris_data))

    #             # Send the processed image (optional, if you want to send it back)
    #             # You can send back the frame as base64 if needed
    #             ret, buffer = cv2.imencode('.jpg', img)
    #             frame_data = base64.b64encode(buffer).decode('utf-8')
    #             return frame_data
    #           # Add your processing logic here
