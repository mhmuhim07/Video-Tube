import mongoose from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Contesnt is required!");
  }
  const userId = req.user?._id;

  try {
    const tweet = await Tweet.create({
      content,
      owner: userId,
    });
    const createdTweet = await Tweet.findById(tweet._id);
    if (!createdTweet) {
      throw new ApiError(500, "Something went wrong while creating tweet");
    }
    return res
      .status(201)
      .json(new ApiResponse(200, createdTweet, "Tweet created successfully"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while creating tweet");
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userID } = req.params;
  const newID = userID.replace(/^:/, "");
  if (req.user._id.toString() !== newID) {
    console.log(req.user._id.toString(), newID);
    throw new ApiError(
      400,
      "You are not authorized to view this user's tweets"
    );
  }
  try {
    const tweets = await Tweet.find({ owner: newID }).sort({ createdAt: -1 });
    return res
      .status(200)
      .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while fetching tweets");
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetID } = req.params;
  const newTweetID = tweetID.replace(/^:/, "");
  const { content } = req.body;
  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "New content required to update tweet");
  }
  try {
    const tweet = await Tweet.findByIdAndUpdate(
      newTweetID,
      {
        $set: {
          content,
        },
      },
      { new: true }
    );
    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, tweet, "Tweet update successfully"));
  } catch (error) {
    throw new ApiError(400, "Some thing went wrong while updating tweet");
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetID } = req.params;
  const newTweetID = tweetID.replace(/^:/, "");

  try {
    const tweet = await Tweet.findByIdAndDelete(newTweetID);
    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }
    return res
      .status(204)
      .json(new ApiResponse(204, null, "Tweet deleted successfully"));
  } catch (error) {
    throw new ApiError(400, "Some thing went wrong while deleting tweet");
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
