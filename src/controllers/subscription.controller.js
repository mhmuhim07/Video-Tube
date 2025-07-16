import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.models.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const Id = channelId.replace(/^:/, "");
  const userId = req.user._id;

  let subscription = await Subscription.findOne({
    subscriber: userId,
    channel: Id,
  });

  if (subscription) {
    await Subscription.deleteOne({ _id: subscription._id });
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Unsubscribed from channel"));
  } else {
    subscription = new Subscription({
      subscriber: userId,
      channel: Id,
      owner: Id,
    });

    await subscription.save();
    return res
      .status(201)
      .json(new ApiResponse(201, subscription, "Subscribed to channel"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const Id = channelId.replace(/^:/, "");
  try {
    const subscriptions = await Subscription.find({
      channel: Id,
    }).populate("subscriber");

    if (!subscriptions || subscriptions.length === 0) {
      throw new ApiError(404, "No subscribers found for this channel");
    }

    const subscribers = subscriptions.map(
      (subscription) => subscription.subscriber
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Something went while geting UserChannel Subscribers"
    );
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const Id = subscriberId.replace(/^:/, "");

  const subscriptions = await Subscription.find({ subscriber: Id }).populate(
    "channel"
  );

  if (!subscriptions || subscriptions.length === 0) {
    throw new ApiError(404, "No channels found for this user");
  }

  const channels = subscriptions.map((subscription) => subscription.channel);

  return res
    .status(200)
    .json(
      new ApiResponse(200, channels, "Subscribed channels fetched successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
