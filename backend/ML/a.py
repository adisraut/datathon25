import pickle

# Load the model
model_file = "dbscan_smote_model.pkl"

with open(model_file, "rb") as file:
    model_data = pickle.load(file)

# Unpack variables safely
if isinstance(model_data, tuple) and len(model_data) == 3:
    scaler, dbscan, churn_conditions = model_data
    churn_ratings = None  # Set to None if missing
elif isinstance(model_data, tuple) and len(model_data) == 4:
    scaler, dbscan, churn_conditions, churn_ratings = model_data
else:
    raise ValueError("Unexpected data format in model file.")

print("✅ Model Loaded Successfully!")
print(f"Scaler: {scaler}")
print(f"DBSCAN: {dbscan}")
print(f"Churn Conditions: {churn_conditions}")
print(f"Churn Ratings: {churn_ratings}")  # This might be None
