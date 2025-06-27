import { useEffect, useRef, useState } from "react";
import {
  api,
  streamAPIResponse,
  retryAutomation,
} from "../Services/ApiService";
import "../style.css";
import { BiSave } from "react-icons/bi";
import { FiUpload } from "react-icons/fi";
import { IoMdTime } from "react-icons/io";
import { LiaCheckCircleSolid, LiaTimesCircleSolid } from "react-icons/lia";

const Dashboard = () => {
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [credentialMessages, setCredentialMessages] = useState("");
  const [fileName, setFileName] = useState("");
  const [showLogsError, setshowLogsError] = useState("");
  const [inputFileUrl, setInputFileUrl] = useState(null);
  const [outputFileUrl, setOutputFileUrl] = useState(null);
  const [amazonCredentials, setAmazonCredentials] = useState({
    username: "",
    password: "",
    email: "",
  });
  const [otp, setOtp] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [otpRequested, setOtpRequested] = useState(false);
  const [runAutomation, setRunAutomation] = useState(false);
  const [activeTab, setActiveTab] = useState("Credentials");
  const [showForm, setShowForm] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAmountForm, setShowAmountForm] = useState(false);
  const [showAmazonPrompt, setShowAmazonPrompt] = useState(false);
  const [showAutomationPrompt, setShowAutomationPrompt] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState(false);
  const [checkoutAmount, setCheckoutAmount] = useState("");
  const otpSubmitted = useRef(false);

  const fileInputRef = useRef(null);
  const [tasks, setTasks] = useState([
    {
      time: "Mar 20, 05:05 PM",
      status: "Success",
      duration: "20s",
      message: "Task completed successfully",
    },
    {
      time: "Mar 20, 04:05 PM",
      status: "Success",
      duration: "34s",
      message: "Task completed successfully",
    },
    {
      time: "Mar 20, 03:05 PM",
      status: "Failed",
      duration: "36s",
      message: "Task completed successfully",
    },
  ]);

  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     setProcessing(true);
  //     setMessage("Running scheduled tasks");
  //     try {
  //       const inputFileResponse = await api.get("/inputfile", {
  //         responseType: "blob",
  //       });

  //       if (inputFileResponse.status !== 200) {
  //         setMessage("Failed to retrieve file, scheduled task stopped");
  //         return;
  //       }
  //       setMessage("File retrieved successfully, checking credentials");
  //       const requirement = await checkRequirements();
  //       if (requirement) {
  //         await handleAutomationtask();
  //       }
  //     } catch (error) {
  //       console.error(`Error: ${error.message}${error.status ? ` [Status Code: ${error.status}]` : ''}`);
  //     } finally {
  //       setProcessing(false);
  //     }
  //   }, 604800000);

  //   return () => clearInterval(interval);
  // }, []);

  const getCredentials = async () => {
    try {
      const data = await api.get("/get_credentials");
      const message = data?.error || data?.message;

      if (message !== "No credentials stored") {
        setAmazonCredentials({
          username: data.amazon.username,
          password: data.amazon.password,
          email: data.email,
        });
      }
    } catch (error) {
      setCredentialMessages(error.message);
    }
  };

  useEffect(() => {
    getCredentials();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAmazonCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const convertBlobToURL = (blob) => {
    return window.URL.createObjectURL(new Blob([blob]));
  };

  // Drag-and-Drop Handlers
  const handleDragOver = (event) => {
    event.preventDefault(); // Prevent default behavior (opening file in browser)
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleFileUpload = async (inputFile) => {
    let file;
    setUploadedFile(inputFile);
    setShowAutomationPrompt(false);
    if (inputFile.target) {
      // get file when uploaded through an input
      file = inputFile.target.files[0];
    } else {
      // get file when using drag-and-drop file
      file = inputFile;
    }

    if (!file) {
      setMessage("file not found");
      return;
    }

    setProcessing(true);
    setFileName(file.name);
    try {
      const requirement = await checkRequirements();
      if (requirement) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          setMessage("Uploading file, please wait...");
          await api.post("/upload", formData);
        } catch (error) {
          setMessage(error.message);
          return;
        }
        await handleAutomationtask();
      } else {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const checkRequirements = async () => {
    setProcessing(true);
    setMessage("Checking credentials, please wait...");

    try {
      const credentialsData = await api.get("/get_credentials");
      if (
        credentialsData.error === "No credentials stored" ||
        credentialsData.message === "No credentials stored"
      ) {
        setMessage("Credentials not found, please enter your credentials");
        return;
      }
      setMessage("Credentials found, please wait...");
      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    }
  };

  const handleAutomationtask = async () => {
    setProcessing(true);
    try {
      setMessage("Scraping started...");
      await streamAPIResponse("/scrape", setMessage);
      setMessage("Scraping completed, fetching output file");
      setOutputFileUrl(null);
      setInputFileUrl(null);

      const outputResponse = await api.get("/outputfile", {
        responseType: "blob",
      });
      const outputFileUrl = convertBlobToURL(outputResponse);
      setOutputFileUrl(outputFileUrl);
      setMessage("Output file is ready! automation started");
      handleAutomationAPIs();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAutomationAPIs = async () => {
    setProcessing(true);
    setRunAutomation(false);
    try {
      const automationResponse = await retryAutomation(
        "/automation",
        setMessage,
        setOtpRequested,
        otpSubmitted
      );
      setMessage("Fetching updated output file");
      const newOutputResponse = await api.get("/outputfile", {
        responseType: "blob",
      });
      const newOutputFileUrl = convertBlobToURL(newOutputResponse);
      setOutputFileUrl(newOutputFileUrl);
      setMessage("Fetched output file, fetching input file!");

      const inputFileResponse = await api.get("/inputfile", {
        responseType: "blob",
      });
      const inputFileUrl = convertBlobToURL(inputFileResponse);
      setInputFileUrl(inputFileUrl);

      setMessage(automationResponse.message);

      if (automationResponse.status) {
        setShowCheckout(true);
      } else {
        setRunAutomation(true);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSetCredentials = async () => {
    if (
      !amazonCredentials.username ||
      !amazonCredentials.password ||
      !amazonCredentials.email
    ) {
      setCredentialMessages("Please enter all the credentials.");
      return;
    }

    setProcessing(true);
    setCredentialMessages("Saving credentials");
    try {
      await api.post("/set_credentials", {
        username: amazonCredentials.username,
        password: amazonCredentials.password,
        email: amazonCredentials.email,
      });
      setCredentialMessages("Credentials saved successfully");
      if (uploadedFile) {
        setShowAutomationPrompt(true);
      }
    } catch (error) {
      setCredentialMessages(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleClearCredentials = async () => {
    setProcessing(true);
    setCredentialMessages("Clearing credentials");
    try {
      await api.get("/clear_credentials");
      setAmazonCredentials({ username: "", password: "", email: "" });
      setCredentialMessages("Credentials cleared successfully!");
    } catch (error) {
      setCredentialMessages(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp) return;

    setMessage("Submitting OTP, Please wait");

    try {
      await api.post("/submit_otp", { otp });
      setOtp("");
      setOtpRequested(false);
      otpSubmitted.current = true;
    } catch (error) {
      setMessage(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckoutAmount = async () => {
    if (!checkoutAmount) {
      setMessage("Please enter checkout amount");
      return;
    }

    setProcessing(true);
    setRefreshMessage(true);
    try {
      const checkoutResponse = await api.post("/send_to_odoo", {
        total_paid: checkoutAmount,
      });
      setShowCheckout(false);
      setMessage(
        `${checkoutResponse.message} with the odoo order id: ${checkoutResponse.odoo_purchase_order_id}`
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleProceedClick = (e) => {
    e.preventDefault();

    // Open Amazon in a new tab
    window.open("https://www.amazon.com", "_blank");

    // Show your custom confirmation popup
    setShowAmazonPrompt(true);
  };

  const handleAmazonConfirmation = (confirmed) => {
    setShowAmazonPrompt(false);

    if (confirmed) {
      setShowAmountForm(true);
    } else {
      setShowAmountForm(false);
    }
  };

  const handleDownloadLogsFile = async () => {
    setProcessing(true);

    try {
      const response = await api.get("/download_logs", {
        responseType: "json",
      });
      if (response.error === "Log file does not exist") {
        setshowLogsError(response.error);
        return;
      } else {
        setshowLogsError("Fetching logs file, please wait...");
        const blobUrl = convertBlobToURL(response);

        // Create a temporary <a> element to trigger download
        const link = document.createElement("a");
        link.href = blobUrl;

        // Optional: set a default filename
        link.download = "logs_file.txt";

        // Append link to body and trigger click
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        setshowLogsError("Logs File was downloaded successfully");
      }
    } catch (error) {
      setshowLogsError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleClearLogs = async () => {
    setProcessing(true);
    try {
      const response = await api.get("/clear_logs");
      if (response.error === "Log file does not exist") {
        setshowLogsError(response.error);
      } else {
        setshowLogsError("Logs cleared successfully");
      }
    } catch (error) {
      setshowLogsError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async (type) => {
    const apiPath = type === "output" ? "/outputfile" : "/inputfile";
    const downloadFileName = type === "output" ? "output.xlsx" : "input.xlsx";
    const apiUrl = apiPath;

    try {
      const response = await api.get(apiUrl, { responseType: "blob" });

      const contentType =
        response.type || response.headers?.get?.("content-type");
      if (contentType && contentType.includes("application/json")) {
        const text = await response.text();
        const json = JSON.parse(text);
        throw new Error(
          json?.error || json?.message || "Server error during file download."
        );
      }

      const blob = new Blob([response], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert(
        `Error downloading ${type === "output" ? "output" : "input"} file: ${
          error.message
        }`
      );
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-8">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {refreshMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded shadow-lg z-50 flex items-center justify-between min-w-[300px]">
            <span>Kindly refresh the tab to reuse the app.</span>
            <button
              className="ml-4 text-white font-bold"
              onClick={() => setRefreshMessage(false)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b bg-gray-200 rounded-lg overflow-hidden">
          {["Credentials", "File Upload", "Logs"].map((tab) => (
            <button
              key={tab}
              className={`py-2 px-4 flex-1 text-center font-medium transition-all ${
                activeTab === tab
                  ? "bg-white text-black border-b-2 "
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Credentials Manager */}
        {activeTab === "Credentials" && (
          <div className="bg-white p-6 rounded-lg shadow-md mt-6">
            <h2 className="text-xl font-bold">Credentials Manager</h2>
            <p className="text-gray-600 text-sm">
              Manage Amazon and Email credentials
            </p>
            <div className="flex justify-end gap-4 mt-4">
              <button
                className=" border rounded-lg bg-white text-black px-4 py-2 hover:bg-gray-100"
                onClick={() => setShowForm(!showForm)}
              >
                View Credentials
              </button>
              {outputFileUrl && (
                <button
                  onClick={() => handleDownload("output")}
                  className="border rounded-lg bg-white text-black px-4 py-2 hover:bg-gray-100"
                >
                  Download Output File
                </button>
              )}
              {inputFileUrl && (
                <button
                  onClick={() => handleDownload("input")}
                  className="border rounded-lg bg-white text-black px-4 py-2 hover:bg-gray-100"
                >
                  Download Input File
                </button>
              )}
            </div>
            {showForm && (
              <div className="mt-4 p-4 border rounded-lg bg-white">
                <div className="bg-gray-100 border border-gray-200 p-4 rounded-md shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mt-4">
                    Email (Add to cart updates will be sent on this email)
                  </label>
                  <input
                    type="email"
                    placeholder="Enter the email, you want to receive the updates on after the product is added to cart"
                    name="email"
                    value={amazonCredentials.email}
                    onChange={handleChange}
                    className="w-full p-2 mb-2 border rounded"
                  />
                </div>
                <div className="bg-gray-100 border border-gray-200 p-4 rounded-md shadow-sm mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Amazon Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your amazon username"
                    name="username"
                    value={amazonCredentials.username}
                    onChange={handleChange}
                    className="w-full p-2 mb-2 border rounded"
                  />
                  <label className="block text-sm font-medium text-gray-700 mt-4">
                    Amazon Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your amazon password"
                    name="password"
                    value={amazonCredentials.password}
                    onChange={handleChange}
                    className="w-full p-2 mb-2 border rounded"
                  />
                </div>
                {credentialMessages && (
                  <p
                    className={`text-base mt-3 ${
                      credentialMessages === "Please enter all the credentials."
                        ? "text-red-700"
                        : "text-black-700"
                    } break-words whitespace-normal overflow-hidden leading-relaxed`}
                  >
                    {credentialMessages}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    className="flex item-center gap-2 mt-4 bg-black text-white px-4 py-2 rounded-md"
                    onClick={handleSetCredentials}
                    disabled={processing}
                  >
                    <BiSave size={20} />
                    Save Changes
                  </button>
                  <button
                    onClick={handleClearCredentials}
                    disabled={processing}
                    className="flex item-center gap-2 mt-4 bg-black text-white px-4 py-2 rounded-md"
                  >
                    Clear Amazon Credentials
                  </button>
                </div>
              </div>
            )}

            {showAutomationPrompt && (
              <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded shadow-lg text-center">
                  <p className="mb-4">
                    Do you want to run the automation for the uploaded file?
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => handleFileUpload(uploadedFile)}
                      className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowAutomationPrompt(false)}
                      className="bg-red-600 text-white px-4 py-2 rounded"
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* File Upload */}
        {activeTab === "File Upload" && (
          <div
            className="p-6 bg-white shadow-md rounded-lg mx-auto mt-6"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <h2 className="text-2xl font-bold mb-2">Upload Excel File</h2>
            {fileName && (
              <p className="text-gray-600 mb-2">File Name: {fileName}</p>
            )}
            <p className="text-gray-600 mb-4">
              Upload or drag and drop an Excel file (.xls or .xlsx)
            </p>

            <label className="border-2 border-dashed border-gray-400 rounded-lg p-10 flex flex-col items-center text-center cursor-pointer hover:border-gray-600">
              <FiUpload className="w-12 h-12 text-gray-500 mb-2" />
              <input
                id="file-upload"
                type="file"
                onChange={handleFileUpload}
                disabled={processing}
                className="hidden"
              />
              <p className="text-gray-700">
                Drag and drop an Excel file here, or click to select
              </p>
              <p className="text-gray-500 text-sm">
                Only Excel files (.xls, .xlsx) are supported
              </p>
            </label>
            {message && (
              <div className="w-[750px] max-lg:w-full justify-self-center flex flex-row items-center justify-center space-x-2 border-2 rounded-lg mt-3 p-2 bg-gray-50">
                {/* {processing && <Loader />} */}
                <p
                  className={`text-base text-gray-800 break-words whitespace-normal overflow-hidden leading-relaxed text-justify custom-font-style`}
                >
                  {message}
                </p>
              </div>
            )}
            {runAutomation && (
              <div className="mt-5 p-6 flex justify-center items-center">
                <button
                  onClick={handleAutomationAPIs}
                  className="mx-4 bg-black text-white px-4 py-2 rounded-md w-full flex justify-center items-center"
                >
                  Re-Initiate Login Process
                </button>
              </div>
            )}
            {otpRequested && (
              <div className="flex items-center justify-center space-x-2 mt-5">
                <div className="flex flex-col items-center justify-center">
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full p-2 mb-2 border rounded"
                  />
                  <button
                    onClick={handleOtpSubmit}
                    className="mt-4 bg-black text-white px-4 py-2 rounded-md w-full flex justify-center items-center"
                  >
                    Submit OTP
                  </button>
                </div>
              </div>
            )}
            {showCheckout && (
              <div className="flex items-center justify-center space-x-2 mt-5">
                <div className="flex flex-col items-center justify-center">
                  <button
                    onClick={handleProceedClick}
                    className="my-4 bg-black text-white px-4 py-2 rounded-md w-full flex justify-center items-center"
                  >
                    Proceed to Checkout
                  </button>

                  {/* Custom Modal Prompt */}
                  {showAmazonPrompt && (
                    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-6 rounded shadow-lg text-center">
                        <p className="mb-4">
                          Have you completed the payment on Amazon?
                        </p>
                        <div className="flex justify-center space-x-4">
                          <button
                            onClick={() => handleAmazonConfirmation(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleAmazonConfirmation(false)}
                            className="bg-red-600 text-white px-4 py-2 rounded"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {showAmountForm && (
                    <div className="flex flex-col items-center justify-center text-center">
                      <input
                        type="text"
                        placeholder="Enter the amount"
                        value={checkoutAmount}
                        onChange={(e) => setCheckoutAmount(e.target.value)}
                        className="w-full p-2 mb-2 border rounded"
                      />
                      <button
                        onClick={handleCheckoutAmount}
                        className="mt-4 bg-black text-white px-4 py-2 rounded-md w-full flex justify-center items-center"
                      >
                        {processing ? "Sending..." : "Send to odoo"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Logs" && (
          <div className="mt-10 p-6 bg-white rounded-lg shadow-md">
            <div className="flex justify-center items-center">
              <button
                onClick={handleDownloadLogsFile}
                className="mx-4 bg-black text-white px-4 py-2 rounded-md w-full flex justify-center items-center"
              >
                Download Logs File
              </button>
              <button
                onClick={handleClearLogs}
                className="mx-4 bg-black text-white px-4 py-2 rounded-md w-full flex justify-center items-center"
              >
                Clear Logs
              </button>
            </div>
            <div className="text-center mt-5">
              {showLogsError && <p>{showLogsError}</p>}
            </div>
          </div>
          // <div className=" mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
          //   <h2 className="text-2xl font-bold">Logs</h2>
          //   <p className="text-gray-500">View hourly task execution reports</p>

          //   <div className="flex items-center justify-between mt-4">
          //     <div className="flex items-center gap-2">
          //       <span className="text-gray-500 flex items-center gap-1">
          //         <IoMdTime /> Runs hourly
          //       </span>
          //       <span className="bg-green-100 text-green-700 px-2 py-1 text-sm rounded-full flex items-center gap-1">
          //         <LiaCheckCircleSolid /> Success
          //       </span>
          //       <span className="bg-red-100 text-red-700 px-2 py-1 text-sm rounded-full flex items-center gap-1">
          //         <LiaTimesCircleSolid /> Failed
          //       </span>
          //     </div>
          //     {/* <button className="flex items-center bg-gray-100 px-4 py-2 text-gray-700 rounded-lg shadow hover:bg-gray-200">
          //       <FaSyncAlt className="mr-2" /> Refresh
          //     </button> */}
          //   </div>
          //   {/* <p className="text-gray-500 text-right mt-4">
          //     Next run: 5:30:00 PM
          //   </p> */}

          //   <div className="mt-4">
          //     <table className="w-full border-collapse">
          //       <thead>
          //         <tr className="text-left text-gray-600 bg-gray-100">
          //           <th className="p-3">Time</th>
          //           <th className="p-3">Status</th>
          //           <th className="p-3">Duration</th>
          //           <th className="p-3">Message</th>
          //         </tr>
          //       </thead>
          //       <tbody>
          //         {tasks.map((task, index) => (
          //           <tr key={index} className="border-b text-gray-700">
          //             <td className="p-3">{task.time}</td>

          //             <td className="p-3">
          //               {task.status === "Success" ? (
          //                 <span className="flex items-center w-24 gap-1 px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
          //                   <LiaCheckCircleSolid className="text-green-600" />
          //                   {task.status}
          //                 </span>
          //               ) : (
          //                 <span className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700 w-24">
          //                   <LiaTimesCircleSolid className="text-red-600" />
          //                   {task.status}
          //                 </span>
          //               )}
          //             </td>

          //             <td className="p-3">{task.duration}</td>
          //             <td className="p-3">{task.message}</td>
          //           </tr>
          //         ))}
          //       </tbody>
          //     </table>
          //   </div>
          // </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
