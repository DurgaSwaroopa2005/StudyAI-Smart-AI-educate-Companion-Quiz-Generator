import os
import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
from dotenv import load_dotenv

load_dotenv()

# Global database and bucket handles
db = None
bucket = None

def init_firebase():
    global db, bucket
    try:
        if not firebase_admin._apps:
            cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")
            bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET")
            
            # Setup storage options if bucket_name is provided
            app_options = {}
            if bucket_name:
                app_options['storageBucket'] = bucket_name
                
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred, app_options)
                print(f"Firebase Admin SDK initialized successfully using certificate from '{cred_path}'.")
            else:
                # Attempt default credentials fallback
                try:
                    firebase_admin.initialize_app(options=app_options)
                    print("Firebase Admin SDK initialized with default options.")
                except Exception as default_err:
                    print(f"WARNING: Firebase credentials file not found at '{cred_path}'.")
                    print("Firestore and Storage operations will require standard credentials configuration.")
                    # Fallback initialize to avoid import crashes
                    firebase_admin.initialize_app()
            
            db = firestore.client()
            if bucket_name:
                bucket = storage.bucket()
        else:
            db = firestore.client()
            try:
                bucket = storage.bucket()
            except Exception:
                pass
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")

init_firebase()
