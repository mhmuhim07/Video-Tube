import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// const Id = userId.replace(/^:/, "");

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user?._id;

  if (!name || !description) {
    throw new ApiError(400, "Name and description are required.");
  }
  try {
    const playList = new Playlist({
      name,
      description,
      owner: userId,
    });
    await playList.save();
    res.status(201).json(new ApiResponse(201, playList));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while creating Playlist");
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const Id = userId.replace(/^:/, "");

  const playlists = await Playlist.find({ owner: Id }).populate("videos");
  if (!playlists.length) {
    throw new ApiError(404, "No playlists found for this user.");
  }
  res.status(200).json(new ApiResponse(playlists));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const Id = playlistId.replace(/^:/, "");

  const playlist = await Playlist.findById(Id).populate("videos");

  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }

  res
    .status(200)
    .json(new ApiResponse(playlist, "Geting playlist by ID successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const PId = playlistId.replace(/^:/, "");
  const VId = videoId.replace(/^:/, "");
  const playlist = await Playlist.findById(PId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }

  if (playlist.videos.includes(VId)) {
    throw new ApiError(400, "Video already added to the playlist.");
  }

  playlist.videos.push(VId);
  await playlist.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video Added to the playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const PId = playlistId.replace(/^:/, "");
  const VId = videoId.replace(/^:/, "");
  const playlist = await Playlist.findById(PId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }
  if (!playlist.videos.includes(VId)) {
    throw new ApiError(400, "Video not found the playlist.");
  }
  playlist.videos = playlist.videos.filter((id) => id.toString() !== VId);
  await playlist.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlist,
        "Video deleted from the playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const Id = playlistId.replace(/^:/, "");

  const playList = await Playlist.findByIdAndDelete(Id);

  if (!playList) {
    throw new ApiError(404, "Playlist not found.");
  }

  res.status(200).json(new ApiResponse("Playlist deleted successfully."));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const Id = playlistId.replace(/^:/, "");

  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID.");
  }

  const playlist = await Playlist.findById(Id);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }

  playlist.name = name || playlist.name;
  playlist.description = description || playlist.description;

  await playlist.save();
  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
