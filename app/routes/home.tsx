import type { Route } from "./+types/home";
import { useState, useRef, useMemo } from "react";
import React from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Image Optimization Demo" },
    { name: "description", content: "Demo for image optimization" },
  ];
}

function formatSize(sizeInBytes: string | number) {
  let sizeNumber: number;
  if (typeof sizeInBytes === "string") {
    sizeNumber = Math.abs(parseInt(sizeInBytes, 10));
  } else {
    sizeNumber = sizeInBytes;
  }

  if (sizeNumber < 1000 * 1000) {
    return `${(sizeNumber / 1000).toFixed(2)} KB`;
  } else {
    const mbSize = sizeNumber / (1000 * 1000);
    return `${mbSize.toFixed(2)} MB`;
  }
}

// Define interface for image parameters
interface ImageParams {
  src: string;
  width: number | null;
  height: number | null;
  format: string;
  endpoint: string;
}

interface ImageStats {
  width: number;
  height: number;
  fileSize: number;
  memoryUsage: string;
}

// Define interface for image history item
interface ImageHistoryItem {
  timestamp: number;
  requestedParams: {
    src: string;
    width: number | null;
    height: number | null;
    format: string;
    endpoint: string;
  };
  imageStats: ImageStats;
}

const defaultParams: ImageParams = {
  src: "/cat.png",
  width: null,
  height: null,
  format: "original",
  endpoint: "img",
};

export default function Home() {
  const [imageParams, setImageParams] = useState(defaultParams);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const imageDimensions = useRef<{
    promise: Promise<{
      width: number;
      height: number;
    }>;
    resolve: (value: { width: number; height: number }) => void;
  }>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Handle width and height specially
    if (name === "width" || name === "height") {
      // If value is empty, set as null
      const numericValue = value === "" ? null : Number(value);
      setImageParams({
        ...imageParams,
        [name]: numericValue,
      });
    } else {
      // For other fields, just set the value directly
      setImageParams({
        ...imageParams,
        [name]: value,
      });
    }
  };

  const previewUrl = useMemo(() => {
    const params = new URLSearchParams();

    // Always include the source
    params.append("src", imageParams.src);

    // Only include width if it has a value
    if (imageParams.width) {
      params.append("w", imageParams.width.toString());
    }

    // Only include height if it has a value
    if (imageParams.height) {
      params.append("h", imageParams.height.toString());
    }

    // Only include format if it's not "original"
    if (imageParams.format !== "original") {
      params.append("format", imageParams.format);
    }

    return `/${imageParams.endpoint}?${params.toString()}`;
  }, [imageParams]);

  const loadImage = () => {
    // If the URL hasn't changed, don't reload the image
    if (currentUrl === previewUrl) {
      console.log("Image URL unchanged, skipping reload");
      return;
    }

    let resolve: (value: { width: number; height: number }) => void;
    const promise = new Promise<{ width: number; height: number }>((r) => {
      resolve = r;
    });

    imageDimensions.current = {
      promise,
      resolve,
    };

    setErrorMessage(null);
    setCurrentUrl(previewUrl);
    setImageLoading(true);
    fetchImageStats();

    async function fetchImageStats() {
      const response = await fetch(previewUrl, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      setImageLoading(false);
      if (!response.ok) {
        setErrorMessage(
          response.statusText || `HTTP error! Status: ${response.status}`
        );
        return;
      }

      // Get memory usage from header
      const memoryUsage = response.headers.get("X-Memory-Usage");
      if (!memoryUsage) {
        setErrorMessage("Memory usage header not found");
        return;
      }
      if (!imageDimensions.current) {
        setErrorMessage("Image dimensions not found");
        return;
      }
      const dimensions = await imageDimensions.current.promise;
      const blob = await response.blob();
      const stats = {
        width: dimensions.width,
        height: dimensions.height,
        fileSize: blob.size,
        memoryUsage,
      };

      // Add to history
      const historyItem: ImageHistoryItem = {
        timestamp: Date.now(),
        requestedParams: { ...imageParams },
        imageStats: stats,
      };

      setImageHistory((prev) => [historyItem, ...prev]);
    }
  };

  // Reset loading state when URL changes
  React.useEffect(() => {
    if (currentUrl) {
      setImageLoading(true);
    }
  }, [currentUrl]);

  // Initialize with the default image on mount
  React.useEffect(() => {
    loadImage();
  }, []);

  const currentImageStats = imageHistory[0]?.imageStats;
  const previousImageStats = imageHistory[1]?.imageStats;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 relative">
      <div className="min-h-screen pt-6 max-w-full bg-white border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          {/* Form side */}
          <div className="space-y-6">
            {/* Preview URL - Moved to top */}
            <div className="p-6 bg-indigo-50 rounded-lg border border-indigo-100 mb-8">
              <h3 className="text-xl font-semibold text-indigo-800 mb-3">
                URL Preview
              </h3>
              <code className="block text-xl bg-white p-4 rounded-md overflow-x-auto border border-indigo-100 text-indigo-900 font-medium">
                {previewUrl}
              </code>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="src"
                  className="block text-lg font-medium text-gray-800 mb-1"
                >
                  Image Source URL
                </label>
                <input
                  type="text"
                  id="src"
                  name="src"
                  value={imageParams.src}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                />
              </div>

              <div>
                <label
                  htmlFor="width"
                  className="block text-lg font-medium text-gray-800 mb-1"
                >
                  Width
                </label>
                <input
                  type="number"
                  id="width"
                  name="width"
                  value={imageParams.width === null ? "" : imageParams.width}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-3 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                />
              </div>

              <div>
                <label
                  htmlFor="height"
                  className="block text-lg font-medium text-gray-800 mb-1"
                >
                  Height
                </label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={imageParams.height === null ? "" : imageParams.height}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-3 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                />
              </div>

              <div>
                <label
                  htmlFor="format"
                  className="block text-lg font-medium text-gray-800 mb-1"
                >
                  Format
                </label>
                <select
                  id="format"
                  name="format"
                  value={imageParams.format}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                >
                  <option value="webp">webp</option>
                  <option value="avif">avif</option>
                  <option value="original">original</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="endpoint"
                  className="block text-lg font-medium text-gray-800 mb-1"
                >
                  Endpoint
                </label>
                <select
                  id="endpoint"
                  name="endpoint"
                  value={imageParams.endpoint}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                >
                  <option value="img">Buffer Processing (/img)</option>
                  <option value="img-stream">
                    Stream Processing (/img-stream)
                  </option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={loadImage}
                disabled={currentUrl === previewUrl}
                className={`px-6 py-3 text-xl rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  currentUrl === previewUrl
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
                }`}
              >
                {currentUrl === previewUrl ? "Image Loaded" : "Load Image"}
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="w-full mb-8">
              <div
                className={`bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm ${
                  imageLoading ? "opacity-75" : ""
                }`}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-md border border-gray-200">
                    <p className="text-base uppercase text-gray-500 font-medium">
                      Dimensions
                    </p>
                    {imageLoading ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : currentImageStats ? (
                      <p className="text-3xl font-medium text-gray-800">
                        {currentImageStats.width} × {currentImageStats.height}{" "}
                        px
                      </p>
                    ) : (
                      <p className="text-3xl font-medium text-gray-400">
                        Not available
                      </p>
                    )}
                  </div>
                  <div className="bg-white p-5 rounded-md border border-gray-200">
                    <p className="text-base uppercase text-gray-500 font-medium">
                      File Size
                    </p>
                    {imageLoading ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : currentImageStats?.fileSize ? (
                      <>
                        <p
                          className={`text-3xl font-medium ${
                            currentImageStats.fileSize >= 1000 * 1000
                              ? "text-red-600"
                              : currentImageStats.fileSize < 100 * 1000
                              ? "text-green-600"
                              : "text-gray-800"
                          }`}
                        >
                          {formatSize(currentImageStats.fileSize)}
                        </p>
                        {previousImageStats && (
                          <p className="text-base text-gray-500">
                            Previous: {formatSize(previousImageStats.fileSize)}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-3xl font-medium text-gray-400">
                        Not available
                      </p>
                    )}
                  </div>
                  <div className="bg-white p-5 rounded-md border border-gray-200">
                    <p className="text-base uppercase text-gray-500 font-medium">
                      Server Memory Usage
                    </p>
                    {imageLoading ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : currentImageStats?.memoryUsage ? (
                      <>
                        <p
                          className={`text-3xl font-medium ${(() => {
                            const memUsageMatch =
                              currentImageStats.memoryUsage.match(/(-?\d+)/);
                            if (memUsageMatch) {
                              const memBytes = Math.abs(
                                parseInt(memUsageMatch[0], 10)
                              );
                              return memBytes >= 1000 * 1000
                                ? "text-red-600"
                                : "text-indigo-600";
                            }
                            return "text-indigo-600";
                          })()}`}
                        >
                          {formatSize(currentImageStats.memoryUsage)}
                        </p>
                        {previousImageStats && (
                          <p className="text-base text-gray-500">
                            Previous:{" "}
                            {formatSize(previousImageStats.memoryUsage)}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-3xl font-medium text-gray-400">
                        Not available
                      </p>
                    )}
                  </div>
                  <div className="bg-white p-5 rounded-md border border-gray-200">
                    <p className="text-base uppercase text-gray-500 font-medium">
                      Processing Method
                    </p>
                    <p className="text-3xl font-medium text-purple-600">
                      {imageHistory[0]?.requestedParams.endpoint ===
                      "img-stream"
                        ? "Stream Processing"
                        : "Buffer Processing"}
                    </p>
                    {imageHistory[1] && (
                      <p className="text-base text-gray-500">
                        {imageHistory[1].requestedParams.endpoint ===
                        "img-stream"
                          ? "Previous: Stream Processing"
                          : "Previous: Buffer Processing"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {errorMessage && (
              <div className="w-full mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-lg">
                {errorMessage}
                <button
                  className="ml-2 text-lg underline"
                  onClick={() => {
                    setErrorMessage(null);
                    setImageLoading(false);
                  }}
                >
                  Clear
                </button>
              </div>
            )}
            <div className="flex items-center justify-center w-full h-full bg-gray-100 p-4 rounded-md relative">
              {currentUrl ? (
                <>
                  <div className="w-[600px] h-[400px] relative flex items-center justify-center">
                    <img
                      src={currentUrl}
                      alt="Optimized preview"
                      className={`max-w-full max-h-full object-contain rounded shadow-md ${
                        imageLoading ? "opacity-30" : ""
                      }`}
                      ref={imgRef}
                      onLoad={() => {
                        if (imgRef.current && imageDimensions.current) {
                          imageDimensions.current.resolve({
                            width: imgRef.current.naturalWidth,
                            height: imgRef.current.naturalHeight,
                          });
                        } else {
                          throw new Error("Image dimensions not found");
                        }
                      }}
                    />
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-[600px] h-[400px] flex flex-col items-center justify-center text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-lg">Click "Load Image" to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      {imageHistory.length > 0 && (
        <div className="max-w-full mx-4 mt-8 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-3xl font-semibold text-gray-800">
              Image History
            </h2>
            <p className="text-lg text-gray-600 mt-1">
              Record of previously loaded images
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Requested</th>
                  <th className="px-6 py-4">Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {imageHistory.map((item, index) => (
                  <tr
                    key={item.timestamp}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-600">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-base font-medium text-gray-900">
                        {item.requestedParams.width
                          ? `w: ${item.requestedParams.width}`
                          : "w: auto"}
                        ,
                        {item.requestedParams.height
                          ? `h: ${item.requestedParams.height}`
                          : "h: auto"}
                      </div>
                      <div
                        className={`text-base mt-1 font-medium ${
                          item.requestedParams.format === "webp" ||
                          item.requestedParams.format === "avif"
                            ? "text-green-600 bg-green-50 inline-block px-3 py-1 rounded-full"
                            : item.requestedParams.format === "original"
                            ? "text-yellow-600 bg-yellow-50 inline-block px-3 py-1 rounded-full"
                            : "text-gray-500"
                        }`}
                      >
                        format: {item.requestedParams.format}
                      </div>
                      <div className="text-base text-gray-500 truncate max-w-xs mt-1">
                        src: {item.requestedParams.src}
                      </div>
                      <div
                        className={`text-base mt-1 font-medium text-purple-600 bg-purple-50 inline-block px-3 py-1 rounded-full`}
                      >
                        {item.requestedParams.endpoint === "img"
                          ? "Buffer Processing"
                          : "Stream Processing"}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-base font-medium text-gray-900">
                        w: {item.imageStats.width}, h: {item.imageStats.height}
                      </div>
                      {item.imageStats.fileSize && (
                        <div
                          className={`text-base font-medium mt-1 ${
                            item.imageStats.fileSize >= 1000 * 1000
                              ? "text-red-600 bg-red-50 inline-block px-3 py-1 rounded-full"
                              : item.imageStats.fileSize < 100 * 1000
                              ? "text-green-600 bg-green-50 inline-block px-3 py-1 rounded-full"
                              : "text-gray-500"
                          }`}
                        >
                          size:{" "}
                          {(() => {
                            if (item.imageStats.fileSize! < 1000 * 1000) {
                              return `${(
                                item.imageStats.fileSize! / 1000
                              ).toFixed(2)} KB`;
                            } else {
                              const mbSize =
                                item.imageStats.fileSize! / (1000 * 1000);
                              const kbSize = mbSize * 1000;
                              return `${mbSize.toFixed(2)} MB (${Math.round(
                                kbSize
                              )} KB)`;
                            }
                          })()}
                        </div>
                      )}
                      {item.imageStats.memoryUsage && (
                        <div
                          className={`text-base font-medium mt-1 inline-block px-3 py-1 rounded-full ${(() => {
                            const memUsageMatch =
                              item.imageStats.memoryUsage.match(/(-?\d+)/);
                            if (memUsageMatch) {
                              const memBytes = Math.abs(
                                parseInt(memUsageMatch[0], 10)
                              );
                              return memBytes >= 1000 * 1000
                                ? "text-red-600 bg-red-50"
                                : "text-indigo-600 bg-indigo-50";
                            }
                            return "text-indigo-600 bg-indigo-50";
                          })()}`}
                        >
                          server memory:{" "}
                          {(() => {
                            const memUsageMatch =
                              item.imageStats.memoryUsage.match(/(-?\d+)/);
                            if (memUsageMatch) {
                              const memBytes = Math.abs(
                                parseInt(memUsageMatch[0], 10)
                              );
                              if (memBytes < 1000 * 1000) {
                                return `${(memBytes / 1000).toFixed(2)} KB`;
                              } else {
                                const mbSize = memBytes / (1000 * 1000);
                                const kbSize = mbSize * 1000;
                                return `${mbSize.toFixed(2)} MB (${Math.round(
                                  kbSize
                                )} KB)`;
                              }
                            }
                            return item.imageStats.memoryUsage;
                          })()}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => setImageHistory([])}
              className="px-6 py-3 text-base bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Clear History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
