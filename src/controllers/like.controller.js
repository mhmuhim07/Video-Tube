import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const Id = videoId.replace(/^:/, "");
  const userId = req.user._id;
  try {
    let like = await Like.findOne({ video: Id, likedBy: userId });

    if (like) {
      await Like.deleteOne({ _id: like._id });
      return res.status(200).json(new ApiResponse(200, null, "Like removed"));
    } else {
      like = new Like({
        video: Id,
        likedBy: userId,
      });
      await like.save();
      return res.status(200).json(new ApiResponse(200, like, "Video liked"));
    }
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "something went wrong while togolling like in vide"
    );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const Id = commentId.replace(/^:/, "");
  const userId = req.user._id;

  let like = await Like.findOne({ comment: Id, likedBy: userId });

  if (like) {
    await Like.deleteOne({ _id: like._id });
    return res.status(200).json(new ApiResponse(200, null, "Like removed"));
  } else {
    like = new Like({
      comment: Id,
      likedBy: userId,
    });
    await like.save();
    return res.status(200).json(new ApiResponse(200, like, "Comment liked"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const Id = tweetId.replace(/^:/, "");
  const userId = req.user._id;

  let like = await Like.findOne({ tweet: Id, likedBy: userId });

  if (like) {
    await Like.deleteOne({ _id: like._id });
    return res.status(200).json(new ApiResponse(200, null, "Like removed"));
  } else {
    like = new Like({
      tweet: Id,
      likedBy: userId,
    });
    await like.save();
    return res.status(200).json(new ApiResponse(200, like, "Tweet liked"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const likedVideos = await Like.find({
      likedBy: userId,
      video: { $exists: true },
    })
      .populate("video")
      .exec();

    if (!likedVideos || likedVideos.length === 0) {
      throw new ApiError(404, "No liked videos found for this user.");
    }
    const videos = likedVideos.map((like) => like.video);

    return res
      .status(200)
      .json(new ApiResponse(200, videos, "Liked videos fetched successfully"));
  } catch (error) {
    console.log("Error fetching liked videos:", error);
    throw new ApiError(500, "Error fetching liked videos for this user");
  }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
