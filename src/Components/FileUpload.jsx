//  import   { useState } from "react";
// import { FiUpload } from "react-icons/fi";

// const FileUpload = () => {
//   const [file, setFile] = useState(null);

//   const handleFileChange = (event) => {
//     if (event.target.files.length > 0) {
//       setFile(event.target.files[0]);
//     }
//   };

//     const handleFileUpload = async (uploadedfile) => {
//       let file;

//       if (uploadedfile.target) {
//         // get file when uploaded through an input
//         file = uploadedfile.target.files[0];
//       } else {
//         // get file when using drag-and-drop file
//         file = uploadedfile;
//       }

//       if (!file) return;

//       setProcessing(true);
//       setMessage("Uploading file, please wait...");

//       try {
//         const formData = new FormData();
//         formData.append("file", file);

//         await api.post("/upload", formData);
//         setMessage("File saved, checking email...");

//         await checkRequirements();
//       } catch (error) {
//         setMessage(`Error: ${error}`);
//       } finally {
//         setProcessing(false);
//       }
//     };

//   const handleUpload = () => {
//     if (file) {
//       console.log("Uploading:", file.name);
//       // Add API upload logic here
//     }
//   };

//   return (
//     <div className="p-6 bg-white shadow-md rounded-lg  mx-auto mt-6">
//       <h2 className="text-2xl font-bold mb-2">Upload Excel File</h2>
//       <p className="text-gray-600 mb-4">Upload or drag and drop an Excel file (.xls or .xlsx)</p>

//       <div className="border-2 border-dashed border-gray-400 rounded-lg p-10 flex flex-col items-center text-center cursor-pointer hover:border-gray-600">
//         {/* <CloudUpload className="w-12 h-12 text-gray-500 mb-2" /> */}
//         <FiUpload className="w-12 h-12 text-gray-500 mb-2"/>

//         <input type="file" className="hidden" onChange={handleFileUpload} accept=".xls,.xlsx" />
//         <p className="text-gray-700">Drag and drop an Excel file here, or click to select</p>
//         <p className="text-gray-500 text-sm">Only Excel files (.xls, .xlsx) are supported</p>
//       </div>

//       {file && <p className="text-gray-600 mt-2">{file.name}</p>}

//       <button
//         onClick={handleUpload}
//         className="mt-4 w-full bg-gray-500 text-white py-2 rounded flex items-center justify-center gap-2"
//         disabled={!file}
//       >
//         <FiUpload className="w-5 h-5" /> Upload File
//       </button>
//     </div>
//   );
// };

// export default FileUpload;

import { useState } from "react";
import { FiUpload } from "react-icons/fi";
import axios from "axios"; // Ensure axios is installed (`npm install axios`)
import { api } from "../Services/ApiService";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [Processing, setProcessing] = useState(false);

  // const handleFileChange = (event) => {
  //   if (event.target.files.length > 0) {
  //     setFile(event.target.files[0]);
  //   }
  // };

  // const handleFileUpload = async (uploadedfile) => {
  //     let file;

  //     if (uploadedfile.target) {
  //       // get file when uploaded through an input
  //       file = uploadedfile.target.files[0];
  //     } else {
  //       // get file when using drag-and-drop file
  //       file = uploadedfile;
  //     }

  //     if (!file) return;

  //     setProcessing(true);
  //     setMessage("Uploading file, please wait...");

  //     try {
  //       const formData = new FormData();
  //       formData.append("file", file);

  //       await api.post("/upload", formData);
  //       setMessage("File saved, checking email...");

  //       await checkRequirements();
  //     } catch (error) {
  //       setMessage(`Error: ${error}`);
  //     } finally {
  //       setProcessing(false);
  //     }
  //   };
  const handleFileChange = (event) => {
    if (event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    setProcessing(true);
    setMessage("Uploading file, please wait...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post("/upload", formData);
      setMessage("File saved, checking email...");

      await checkRequirements();
    } catch (error) {
      setMessage(`Error: ${error.message || error}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg mx-auto mt-6 ">
      <h2 className="text-2xl font-bold mb-2">Upload Excel File</h2>
      <p className="text-gray-600 mb-4">
        Upload or drag and drop an Excel file (.xls or .xlsx)
      </p>

      <label className="border-2 border-dashed border-gray-400 rounded-lg p-10 flex flex-col items-center text-center cursor-pointer hover:border-gray-600">
        <FiUpload className="w-12 h-12 text-gray-500 mb-2" />
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".xls,.xlsx"
        />
        <p className="text-gray-700">
          Drag and drop an Excel file here, or click to select
        </p>
        <p className="text-gray-500 text-sm">
          Only Excel files (.xls, .xlsx) are supported
        </p>
      </label>

      {file && <p className="text-gray-600 mt-2">📂 {file.name}</p>}

      <button
        onClick={handleFileUpload}
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded flex items-center justify-center gap-2"
        disabled={!file || Processing}
      >
        <FiUpload className="w-5 h-5" />
        {Processing ? "Uploading..." : "Upload File"}
      </button>

      {message && <p className="text-sm mt-2 text-gray-700">{message}</p>}
    </div>
  );
};

export default FileUpload;

// import { useState } from "react";
// import { FiUpload } from "react-icons/fi";
// import axios from "axios"; // Ensure axios is installed (`npm install axios`)
// import { api } from "../Services/ApiService";

// const FileUpload = () => {
//   const [file, setFile] = useState(null);
//   console.log()
//   const [message, setMessage] = useState("");
//   const [Processing, setProcessing] = useState(false);

//   const handleFileChange = (event) => {
//     if (event.target.files.length > 0) {
//       setFile(event.target.files[0]);
//     }
//   };

//   const handleFileUpload = async () => {
//     if (!file) {
//       setMessage("Please select a file first.");
//       return;
//     }

//     setProcessing(true);
//     setMessage("Uploading file, please wait...");

//     try {
//       const formData = new FormData();
//       formData.append("file", file);

//       // Adjust API endpoint
//       const response = await api.post("/upload", formData);

//       setMessage(`File uploaded successfully: ${response.data.message || "Success"}`);
//     } catch (error) {
//       setMessage("Error uploading file. Please try again.");
//       console.error("Upload error:", error);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   return (
//     <div className="p-6 bg-white shadow-md rounded-lg mx-auto mt-6">
//       <h2 className="text-2xl font-bold mb-2">Upload Excel File</h2>
//       <p className="text-gray-600 mb-4">Upload or drag and drop an Excel file (.xls or .xlsx)</p>

//       <label className="border-2 border-dashed border-gray-400 rounded-lg p-10 flex flex-col items-center text-center cursor-pointer hover:border-gray-600">
//         <FiUpload className="w-12 h-12 text-gray-500 mb-2" />
//         <input type="file" className="hidden" onChange={handleFileChange} accept=".xls,.xlsx" />
//         <p className="text-gray-700">Drag and drop an Excel file here, or click to select</p>
//         <p className="text-gray-500 text-sm">Only Excel files (.xls, .xlsx) are supported</p>
//       </label>

//       {file && <p className="text-gray-600 mt-2">📂 {file.name}</p>}

//       <button
//         onClick={handleFileUpload}
//         className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded flex items-center justify-center gap-2"
//         disabled={!file || Processing}
//       >
//         <FiUpload className="w-5 h-5" />
//         {Processing ? "Uploading..." : "Upload File"}
//       </button>

//       {message && <p className="text-sm mt-2 text-gray-700">{message}</p>}
//     </div>
//   );
// };

// export default FileUpload;
