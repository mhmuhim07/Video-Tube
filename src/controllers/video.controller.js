import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { extractPublicId } from "cloudinary-build-url";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const pageNumber = parseInt(page);
  const pageLimit = parseInt(limit);

  const sortObject = {};
  sortObject[sortBy] = sortType === "asc" ? 1 : -1;

  const filter = {};
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }
  if (userId) {
    filter.owner = userId;
  }
  try {
    const videos = await Video.aggregate([
      { $match: filter },
      { $sort: sortObject },
      { $skip: (pageNumber - 1) * pageLimit },
      { $limit: pageLimit },
    ]);
    const totalVideos = await Video.countDocuments(filter);
    const totalPages = Math.ceil(totalVideos / pageLimit);
    if (!videos) {
      throw new ApiError(404, "Something went wrong while fatching videos");
    }
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          videos,
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalVideos,
          },
        },
        "Videos fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching videos");
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videofile = req.files.videoFile ? req.files.videoFile[0] : null;
  const thumbnailfile = req.files.thumbnail ? req.files.thumbnail[0] : null;
  const userId = req.user?._id;
  if (!title || !description || !videofile || !thumbnailfile) {
    throw new ApiError(
      400,
      "Title, description, video file, and thumbnail are required."
    );
  }
  const videoFileResponse = await uploadOnCloudinary(videofile.path);
  const thumbnailFileResponse = await uploadOnCloudinary(thumbnailfile.path);
  if (!videoFileResponse || !thumbnailFileResponse) {
    throw new ApiError(
      500,
      "Error uploading video or thumbnail to Cloudinary."
    );
  }
  try {
    const video = new Video({
      videofile: videoFileResponse.url,
      thumbnail: thumbnailFileResponse.url,
      title,
      description,
      owner: userId,
    });
    await video.save();
    return res
      .status(201)
      .json(new ApiResponse(201, video, "Video published successfully"));
  } catch (error) {
    // console.error("Error while publishing video:", error);
    throw new ApiError(500, "Something went wrong while publishing video");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const Id = videoId.replace(/^:/, "");
  try {
    const video = await Video.findById(Id);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while fatching video");
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const Id = videoId.replace(/^:/, "");
  const { title, description } = req.body;
  const thumbnailfile = req.files?.thumbnail ? req.files.thumbnail[0] : null;

  if (!title && !description && !thumbnailfile) {
    throw new ApiError(
      400,
      "At least one field (title, description, or thumbnail) must be provided."
    );
  }

  const video = await Video.findById(Id);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  let thumbnailUrl = video.thumbnail; // Keep the current thumbnail if no new thumbnail is provided
  if (thumbnailfile) {
    const thumbnailUploadResponse = await uploadOnCloudinary(
      thumbnailfile.path
    );
    if (!thumbnailUploadResponse) {
      throw new ApiError(
        500,
        "Error uploading the new thumbnail to Cloudinary."
      );
    }
    thumbnailUrl = thumbnailUploadResponse.url; // Update with the new thumbnail URL
  }

  try {
    video.title = title || video.title;
    video.description = description || video.description;
    video.thumbnail = thumbnailUrl;

    await video.save();
    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video updated successfully"));
  } catch (error) {
    console.error("Error while updating video:", error);
    throw new ApiError(500, "Something went wrong while updating the video");
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const Id = videoId.replace(/^:/, "");
  try {
    const video = await Video.findByIdAndDelete(Id);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    return res
      .status(204)
      .json(new ApiResponse(204, null, "Video deleted successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Error finding video from DB.");
  }
});
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const Id = videoId.replace(/^:/, "");
  try {
    const video = await Video.findById(Id);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    video.isPublished = !video.isPublished;
    await video.save();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          video,
          `Video is now ${video.isPublished ? "published" : "unpublished"}`
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Something went wrong while toggling public status"
    );
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
