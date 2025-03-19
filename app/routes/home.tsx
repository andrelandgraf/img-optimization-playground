import type { Route } from "./+types/home";
import { useState } from "react";

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

export default function Home() {
  const defaultParams: ImageParams = {
    src: "/cat.png",
    width: 400,
    height: 300,
    format: "webp"
  };

  const [imageParams, setImageParams] = useState(defaultParams);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-8">
      <h1 className="text-3xl font-bold text-center text-indigo-800 mb-8">
        Image Optimization Demo
      </h1>
      
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">        
        <div className="p-4 bg-yellow-50 border-b border-yellow-100">
          <p className="text-yellow-800 text-sm">
            <span className="font-bold">Note:</span> Leave width or height empty to omit those parameters. 
            Select "original" format to use the source image format.
          </p>
        </div>
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
            
            <div className="mt-6">
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
            <div className="flex items-center justify-center w-full h-full bg-gray-100 p-4 rounded-md">
              <img
                src={previewUrl}
                alt="Optimized preview"
                className="max-w-full max-h-[400px] object-contain rounded shadow-md"
              />
            </div>
            <div>
              <p className="mt-4 text-sm text-gray-700 font-medium">
                Image optimized with the parameters specified in the form.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
