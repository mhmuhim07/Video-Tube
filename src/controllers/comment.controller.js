import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const Id = videoId.replace(/^:/, "");

  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page);
  const pageLimit = parseInt(limit);

  const skip = (pageNumber - 1) * pageLimit;
  try {
    const comments = await Comment.find({
      video: Id,
    })
      .skip(skip)
      .limit(pageLimit)
      .sort({ createdAt: -1 });

    if (!comments)
      throw new ApiError(404, "Something went wrong while fatching Comments");
    // console.log(comments);
    const totalComments = await Comment.countDocuments(Id);
    const totalPages = Math.ceil(totalComments / pageLimit);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          comments,
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalComments,
          },
        },
        "Comments fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching comments for this video");
  }
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const Id = videoId.replace(/^:/, "");

  const { content } = req.body;
  const userId = req.user._id;

  if (!content) throw new ApiError(400, "Content is required to add a comment");

  const video = await Video.findById(Id);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  try {
    const newComment = new Comment({
      content,
      video: Id,
      owner: userId,
    });
    await newComment.save();
    return res
      .status(201)
      .json(new ApiResponse(201, newComment, "Comment added successfully"));
  } catch (error) {
    throw new ApiError(500, "something went wrong while adding comment");
  }
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const Id = commentId.replace(/^:/, "");

  const { content } = req.body;
  const userId = req.user._id;

  const comment = await Comment.findById(Id);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (comment.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this comment");
  }
  if (content) {
    comment.content = content;
  }
  await comment.save();
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const Id = commentId.replace(/^:/, "");

  const userId = req.user._id;

  const comment = await Comment.findByIdAndDelete(Id);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (comment.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this comment");
  }
  return res
    .status(204)
    .json(new ApiResponse(204, null, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
