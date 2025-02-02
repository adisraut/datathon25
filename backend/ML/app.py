from flask import Flask, jsonify
from pymongo import MongoClient
import numpy as np
import pickle
from textblob import TextBlob
from sklearn.preprocessing import StandardScaler
from datetime import datetime
import schedule
import time
import threading

app = Flask(__name__)

# MongoDB Connection
client = MongoClient('mongodb://localhost:27017/')  # Adjust if needed
db = client["data"]
user_collection = db["users_dataset"]

# Load the trained ML model
model_file = "dbscan_smote_model.pkl"
with open(model_file, "rb") as file:
    model_data = pickle.load(file)

# Ensure correct unpacking
if isinstance(model_data, tuple) and len(model_data) == 3:
    scaler, dbscan, churn_conditions = model_data
else:
    raise ValueError("Unexpected data format in model file.")

# Function to calculate Sentiment Score
def calculate_sentiment_score(comments):
    polarity = TextBlob(comments).sentiment.polarity
    return round(polarity, 4)  # Keeping precision for better analysis

# Function to calculate RFM Score
def calculate_rfm_score(recency, frequency, monetary):
    recency_score = 1 if recency <= 180 else (2 if recency <= 360 else 3)
    return recency_score + frequency + monetary

# Function to process pending records
def process_pending_records():
    print("🔍 Checking for records with missing Sentiment Score or Churn Category...")

    pending_users = list(user_collection.find({
        "$or": [{"Sentiment Score": None}, {"Churn Category": None}]
    }))

    if not pending_users:
        print("✅ No pending records found.")
        return

    print(f"⚡ Processing {len(pending_users)} pending records...")

    for user in pending_users:
        try:
            user_id = user["User ID"]
            comments = user.get("Comments", "")
            usage_frequency = user.get("Usage Frequency", "Occasional")
            subscription_plan = user.get("Subscription Plan", "Monthly")
            membership_end_date = user.get("Membership Start Date")

            # Convert Dates & Calculate Recency
            if isinstance(membership_end_date, str):  # If stored as a string
                membership_end_date = datetime.strptime(membership_end_date[:10], "%d-%m-%Y")
            elif isinstance(membership_end_date, datetime):  # If already a datetime object
                pass
            else:
                membership_end_date = datetime.today()  # Default to today if missing

            recency = (datetime.today() - membership_end_date).days

            # Frequency Score Mapping
            frequency_map = {'Frequent': 3, 'Regular': 2, 'Occasional': 1}
            frequency_score = frequency_map.get(usage_frequency, 1)

            # Monetary Score Mapping
            monetary_map = {'Annual': 2, 'Monthly': 1}
            monetary_score = monetary_map.get(subscription_plan, 1)

            # RFM Score Calculation
            rfm_score = calculate_rfm_score(recency, frequency_score, monetary_score)

            # Sentiment Score Calculation
            sentiment_score = calculate_sentiment_score(comments)

            # Standardize Features & Predict Churn
            test_data = np.array([[recency, frequency_score, monetary_score, rfm_score, sentiment_score]])
            print(f"🔎 Test Data Before Scaling: {test_data}")  # Debugging

            test_scaled = scaler.transform(test_data)
            test_cluster = dbscan.fit_predict(test_scaled)[0]

            # Determine Churn Category
            churn_category = churn_conditions.get(test_cluster, "Unknown")

            # Update Processed Data in MongoDB
            user_collection.update_one(
                {"User ID": user_id},
                {
                    "$set": {
                        "Sentiment Score": sentiment_score,
                        "RFM Score": rfm_score,
                        "Churn Category": churn_category,
                        "Updated At": datetime.now()
                    }
                }
            )

            print(f"✅ Processed User {user_id} - Churn: {churn_category}, Sentiment: {sentiment_score}")

        except Exception as e:
            print(f"❌ Error processing User {user_id}: {str(e)}")

# Schedule the task to run every 10 seconds
def run_scheduler():
    schedule.every(10).seconds.do(process_pending_records)
    while True:
        schedule.run_pending()
        time.sleep(1)

# Start the scheduler in a background thread
threading.Thread(target=run_scheduler, daemon=True).start()

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"message": "ML Processing Service is running", "last_check": str(datetime.now())})

if __name__ == "__main__":
    app.run(debug=True)
