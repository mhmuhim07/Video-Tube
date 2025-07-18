import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
  // console.log("it came here c");
  return res.status(200).json(new ApiResponse(200, "OK", "Health check ok"));
});

export { healthcheck };
