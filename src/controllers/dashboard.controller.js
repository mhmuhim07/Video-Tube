import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  try {
    const channelId = req.user._id;

    // Total number of subscribers
    const totalSubscribers = await Subscription.countDocuments({
      channel: channelId,
    });

    // Total number of videos
    const totalVideos = await Video.countDocuments({ owner: channelId });

    // Total likes across all videos (considering likes for videos, comments, and tweets)
    const totalLikes = await Like.countDocuments({ likedBy: channelId });

    const stats = {
      totalSubscribers,
      totalVideos,
      totalLikes,
    };

    res
      .status(200)
      .json(
        new ApiResponse(200, stats, "Channel statistics retrieved successfully")
      );
  } catch (error) {
    throw new ApiError(500, "Error retrieving channel statistics.");
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  try {
    const channelId = req.user._id;

    // Retrieve all videos uploaded by the channel (owner is the channelId)
    const videos = await Video.find({ owner: channelId }).populate("owner");

    if (!videos.length) {
      throw new ApiError(404, "No videos found for this channel.");
    }

    res
      .status(200)
      .json(new ApiResponse(200, videos, "Videos retrieved successfully"));
  } catch (error) {
    throw new ApiError(500, "Error retrieving channel videos.");
  }
});

export { getChannelStats, getChannelVideos };
