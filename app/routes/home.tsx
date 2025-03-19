import type { Route } from "./+types/home";
import { useState, useRef } from "react";
import React from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Image Optimization Demo" },
    { name: "description", content: "Demo for image optimization" },
  ];
}

// Define interface for image parameters
interface ImageParams {
  src: string;
  width: number | null;
  height: number | null;
  format: string;
}

// Define interface for image history item
interface ImageHistoryItem {
  timestamp: number;
  requestedParams: {
    src: string;
    width: number | null;
    height: number | null;
    format: string;
  };
  actualDimensions: {
    width: number;
    height: number;
    fileSize?: number;
  };
}

export default function Home() {
  const defaultParams: ImageParams = {
    src: "/cat.png",
    width: null,
    height: null,
    format: "original"
  };

  const [imageParams, setImageParams] = useState(defaultParams);
  const [loadedImageSize, setLoadedImageSize] = useState<{width: number, height: number, fileSize?: number} | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle width and height specially
    if (name === "width" || name === "height") {
      // If value is empty, set as null
      const numericValue = value === "" ? null : Number(value);
      setImageParams({
        ...imageParams,
        [name]: numericValue
      });
    } else {
      // For other fields, just set the value directly
      setImageParams({
        ...imageParams,
        [name]: value
      });
    }
  };

  const resetToDefaults = () => {
    setImageParams(defaultParams);
    // We need to wait for the next render cycle for the previewUrl to update
    setTimeout(() => {
      loadImage();
    }, 0);
  };

  const generatePreviewUrl = () => {
    const params = new URLSearchParams();
    
    // Always include the source
    params.append('src', imageParams.src);
    
    // Only include width if it has a value
    if (imageParams.width) {
      params.append('w', imageParams.width.toString());
    }
    
    // Only include height if it has a value
    if (imageParams.height) {
      params.append('h', imageParams.height.toString());
    }
    
    // Only include format if it's not "original"
    if (imageParams.format !== 'original') {
      params.append('format', imageParams.format);
    }
    
    return `/img?${params.toString()}`;
  };

  const previewUrl = generatePreviewUrl();

  const loadImage = () => {
    // If the URL hasn't changed, don't reload the image
    if (currentUrl === previewUrl) {
      console.log('Image URL unchanged, skipping reload');
      return;
    }
    
    setErrorMessage(null);
    setCurrentUrl(previewUrl);
    setImageLoading(true);
    
    // Safety timeout to ensure loading state is cleared after reasonable time
    const safetyTimeout = setTimeout(() => {
      if (imageLoading) {
        console.error('Image loading timeout - forcing reset of loading state');
        setImageLoading(false);
      }
    }, 5000); // 5 seconds timeout
    
    // Clean up timeout if component unmounts
    return () => clearTimeout(safetyTimeout);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    if (imgRef.current) {
      // Get the dimensions of the image as displayed in the browser
      const { naturalWidth, naturalHeight } = imgRef.current;
      
      // Fetch the optimized image to get its size
      fetch(currentUrl, { 
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(response.statusText || `HTTP error! Status: ${response.status}`);
          }
          return response.blob();
        })
        .then(blob => {
          console.log(`Image size: ${blob.size} bytes (${blob.size / 1000} KB)`);
          
          // Set image dimensions and file size
          const dimensions = {
            width: naturalWidth,
            height: naturalHeight,
            fileSize: blob.size
          };
          
          setLoadedImageSize(dimensions);
          
          // Add to history
          const historyItem: ImageHistoryItem = {
            timestamp: Date.now(),
            requestedParams: { ...imageParams },
            actualDimensions: dimensions
          };
          
          setImageHistory(prev => [historyItem, ...prev]);
        })
        .catch(err => {
          console.error('Error loading image:', err);
          setImageLoading(false);
          setErrorMessage(err.message || 'Failed to load image');
        });
    }
  };
  
  const handleImageError = () => {
    console.error('Image failed to load:', currentUrl);
    setImageLoading(false);
    setLoadedImageSize(null);
    // Error message is now set by the fetch error handler
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-8">
      <h1 className="text-3xl font-bold text-center text-indigo-800 mb-8">
        Image Optimization Demo
      </h1>
      
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          {/* Form side */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Configure Image Parameters</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="src" className="block text-sm font-medium text-gray-800 mb-1">
                  Image Source URL
                </label>
                <input
                  type="text"
                  id="src"
                  name="src"
                  value={imageParams.src}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                />
              </div>
              
              <div>
                <label htmlFor="width" className="block text-sm font-medium text-gray-800 mb-1">
                  Width
                </label>
                <input
                  type="number"
                  id="width"
                  name="width"
                  value={imageParams.width === null ? "" : imageParams.width}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                />
              </div>
              
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-800 mb-1">
                  Height
                </label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={imageParams.height === null ? "" : imageParams.height}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                />
              </div>
              
              <div>
                <label htmlFor="format" className="block text-sm font-medium text-gray-800 mb-1">
                  Format
                </label>
                <select
                  id="format"
                  name="format"
                  value={imageParams.format}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                >
                  <option value="webp">webp</option>
                  <option value="avif">avif</option>
                  <option value="original">original</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-indigo-50 rounded-md border border-indigo-100">
              <h3 className="text-sm font-medium text-indigo-800 mb-2">URL Preview:</h3>
              <code className="block text-sm bg-white p-3 rounded overflow-x-auto border border-indigo-100 text-indigo-900 font-medium">
                {previewUrl}
              </code>
            </div>
            
            <div className="mt-6 flex gap-2">
              <button
                onClick={loadImage}
                disabled={currentUrl === previewUrl}
                className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  currentUrl === previewUrl 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                {currentUrl === previewUrl ? 'Image Loaded' : 'Load Image'}
              </button>
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
          
          {/* Image preview side */}
          <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Image Preview</h2>
            {errorMessage && (
              <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {errorMessage}
                <button 
                  className="ml-2 text-xs underline"
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
                  <img
                    src={currentUrl}
                    alt="Optimized preview"
                    className={`max-w-full max-h-[400px] object-contain rounded shadow-md ${imageLoading ? 'opacity-30' : ''}`}
                    ref={imgRef}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500 p-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Click "Load Image" to preview</p>
                </div>
              )}
            </div>
            <div className="w-full mt-4">
              {loadedImageSize && (
                <div className="bg-gray-100 p-4 rounded-md border border-gray-200 shadow-sm">
                  <h3 className="font-medium text-gray-800 text-base mb-2">Image Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-xs uppercase text-gray-500 font-medium">Dimensions</p>
                      <p className="text-gray-800 font-medium">
                        {loadedImageSize.width} × {loadedImageSize.height} px
                      </p>
                    </div>
                    {loadedImageSize.fileSize && (
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs uppercase text-gray-500 font-medium">File Size</p>
                        <p className={`font-medium ${loadedImageSize.fileSize >= 1000 * 1000 ? 'text-red-600' : 'text-gray-800'}`}>
                          {(() => {
                            if (loadedImageSize.fileSize < 1000 * 1000) {
                              return `${(loadedImageSize.fileSize / 1000).toFixed(2)} KB`;
                            } else {
                              const mbSize = loadedImageSize.fileSize / (1000 * 1000);
                              const kbSize = mbSize * 1000;
                              return `${mbSize.toFixed(2)} MB (${Math.round(kbSize)} KB)`;
                            }
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      {imageHistory.length > 0 && (
        <div className="max-w-6xl mx-auto mt-8 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">Image History</h2>
            <p className="text-sm text-gray-600 mt-1">Record of previously loaded images</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Requested</th>
                  <th className="px-6 py-3">Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {imageHistory.map((item, index) => (
                  <tr key={item.timestamp} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="text-gray-900 font-medium">
                        {item.requestedParams.width ? `w: ${item.requestedParams.width}` : "w: auto"}, 
                        {item.requestedParams.height ? `h: ${item.requestedParams.height}` : "h: auto"}
                      </div>
                      <div className="text-gray-500">format: {item.requestedParams.format}</div>
                      <div className="text-gray-500 truncate max-w-xs">src: {item.requestedParams.src}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="text-gray-900 font-medium">
                        w: {item.actualDimensions.width}, h: {item.actualDimensions.height}
                      </div>
                      {item.actualDimensions.fileSize && (
                        <div className="text-gray-500">
                          size: {(() => {
                            if (item.actualDimensions.fileSize! < 1000 * 1000) {
                              return `${(item.actualDimensions.fileSize! / 1000).toFixed(2)} KB`;
                            } else {
                              const mbSize = item.actualDimensions.fileSize! / (1000 * 1000);
                              const kbSize = mbSize * 1000;
                              return `${mbSize.toFixed(2)} MB (${Math.round(kbSize)} KB)`;
                            }
                          })()}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {imageHistory.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <button
                onClick={() => setImageHistory([])}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
              >
                Clear History
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}