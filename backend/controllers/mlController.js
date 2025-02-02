import User from '../models/User.js';
import Sentiment from 'sentiment';
import mongoose from 'mongoose';

const sentiment = new Sentiment();

// Function to calculate Sentiment Score
const calculateSentimentScore = (comments) => {
    const result = sentiment.analyze(comments || "");
    const polarity = result.score;

    if (polarity < 0) return -1;
    if (polarity === 0) return 0;
    return 1;
};

// Export function properly
export const processUserData = async (req, res) => {
    try {
        const { userId, usageFrequency, subscriptionPlan, comments, membership } = req.body;

        const membershipEndDate = membership?.endDate ? new Date(membership.endDate) : new Date();
        const recency = Math.floor((membershipEndDate - new Date()) / (1000 * 60 * 60 * 24));

        const frequencyMap = { "Frequent": 3, "Regular": 2, "Occasional": 1 };
        const frequencyScore = frequencyMap[usageFrequency] || 1;

        const monetaryMap = { "Annual": 2, "Monthly": 1 };
        const monetaryScore = monetaryMap[subscriptionPlan] || 1;

        const rfmScore = recency + frequencyScore + monetaryScore;
        const sentimentScore = calculateSentimentScore(comments || "");
        const churnCategory = rfmScore <= 3 ? "Likely" : rfmScore <= 5 ? "Unlikely" : "Unknown";

        const updatedUser = await User.findOneAndUpdate(
            { userId },
            { sentimentScore, churnCategory, updatedAt: new Date() },
            { new: true, upsert: true }
        );

        res.json({ message: "ML processing completed successfully", userId, sentimentScore, churnCategory });

    } catch (error) {
        console.error("❌ Error in ML processing:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
