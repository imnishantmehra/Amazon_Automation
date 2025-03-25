import { useEffect, useRef, useState } from "react";
import {
  api,
  streamAPIResponse,
  retryAutomation,
} from "../Services/ApiService";
import "../style.css";
import Loader from "../LoaderComponent/Loader";
import { RiDeleteBin7Line } from "react-icons/ri";
import { BiSave } from "react-icons/bi";
import { FiUpload } from "react-icons/fi";

const Dashboard = () => {
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [inputFileUrl, setInputFileUrl] = useState(null);
  const [outputFileUrl, setOutputFileUrl] = useState(null);
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const [amazonCredentials, setAmazonCredentials] = useState({
    username: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const otpSubmitted = useRef(false);
  const [email, setEmail] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [activeTab, setActiveTab] = useState("Credentials");
  const [activeCredential, setActiveCredential] = useState("Amazon");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      setProcessing(true);
      setMessage("Running scheduled tasks...");
      try {
        const inputFileResponse = await api.get("/inputfile", {
          responseType: "blob",
        });

        if (inputFileResponse.status !== 200) {
          setMessage("Failed to retrieve file, scheduled task stopped");
          return;
        }

        setMessage("File retrieved successfully, checking email...");
        await checkRequirements();
      } catch (error) {
        console.error("Error in scheduled tasks:", error);
      } finally {
        setProcessing(false);
      }
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  //   const getEmail = async() => {
  // try{
  //   const emailData = await api.get("/get_email");

  //   if (
  //     emailData.message == "No email stored" &&
  //     emailData.status === "error"
  //   )
  // }catch(){

  // }finally{
  //   setProcessing(false)
  // }
  //   }

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

  const handleFileUpload = async (uploadedfile) => {
    let file;

    if (uploadedfile.target) {
      // get file when uploaded through an input
      file = uploadedfile.target.files[0];
    } else {
      // get file when using drag-and-drop file
      file = uploadedfile;
    }

    if (!file) return;

    setProcessing(true);
    setMessage("Uploading file, please wait...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post("/upload", formData);
      setMessage("File saved, checking email...");

      await checkRequirements();
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const checkRequirements = async () => {
    setProcessing(true);

    try {
      const emailData = await api.get("/get_email");

      if (
        emailData.message == "No email stored" &&
        emailData.status === "error"
      ) {
        setMessage("No email found, please enter your email");
        setShowEmailForm(true);
        return;
      }

      setMessage("Email found, checking amazon credentails...");

      const credentailsData = await api.get("/get_amazon_credentials");

      if (
        credentailsData.message === "No Amazon credentials stored" &&
        credentailsData.status === "error"
      ) {
        setMessage(
          "Amazon credentials not found, Please enter both username and password."
        );
        setShowCredentialsForm(true);
        return;
      }

      setMessage("Credentials found, running scraping...");
      await handleAutomationtask();
    } catch (error) {
      setMessage(`${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleSetEmail = async () => {
    if (!email) return;

    setProcessing(true);
    setMessage("Saving email...");
    try {
      await api.post("/set_email", { email });
      setShowEmailForm(false);
      setEmail("");
      setMessage("Email saved! Checking amazon credentails...");

      const data = await api.get("/get_amazon_credentials");

      if (
        data.message === "No Amazon credentials stored" &&
        data.status === "error"
      ) {
        setMessage("Amazon credentials not found, Please enter them below.");
        setShowCredentialsForm(true);
        return;
      }

      setMessage("Credentials found, running scraping...");

      await handleAutomationtask();
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleAutomationtask = async () => {
    setProcessing(true);
    try {
      await streamAPIResponse("/scrape", setMessage);
      setMessage("Scraping completed, fetching output file...");
      setOutputFileUrl(null);
      setInputFileUrl(null);

      const outputResponse = await api.get("/outputfile", {
        responseType: "blob",
      });
      const outputFileUrl = convertBlobToURL(outputResponse);
      setOutputFileUrl(outputFileUrl);
      setMessage("Output file is ready! automation started...");

      const automationResponse = await retryAutomation(
        "/automation",
        setMessage,
        setOtpRequested,
        otpSubmitted
      );
      setMessage("Fetching updated output file...");
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

      setMessage(
        automationResponse.message || "Process completed successfully"
      );
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleSetCredentials = async () => {
    if (!amazonCredentials.username || !amazonCredentials.password) return;

    setProcessing(true);
    setMessage("Saving credentials...");
    try {
      await api.post("/set_amazon_credentials", {
        username: amazonCredentials.username,
        password: amazonCredentials.password,
      });
      setMessage("Credentials saved! Running scraping...");
      setAmazonCredentials({ username: "", password: "" });
      setShowCredentialsForm(false);

      await handleAutomationtask();
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleClearCredentials = async () => {
    setProcessing(true);
    setMessage("Clearing credentials...");
    try {
      await api.get("/clear_amazon_credentials");
      setMessage("Amazon credentials cleared successfully!");
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp) return;

    setMessage("Submitting OTP, Please wait...");

    try {
      await api.post("/submit_otp", { otp });
      setOtp("");
      setOtpRequested(false);
      otpSubmitted.current = true;
    } catch (error) {
      setMessage(`Wrong OTP Entered: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleClearEmail = async () => {
    setProcessing(true);
    setMessage("Clearing emails...");
    try {
      await api.get("/clear_email");
      setMessage("Email cleared successfully!");
    } catch (error) {
      setMessage(`Error clearing email: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-8">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* Navigation Tabs */}
        <div className="flex border-b bg-gray-200 rounded-lg overflow-hidden">
          {["Credentials", "File Upload", "Task Manager"].map((tab) => (
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

            {/* Credential Type Toggle */}
            <div className="flex border-b mt-4 bg-gray-200 rounded-lg overflow-hidden">
              {["Amazon", "Email"].map((cred) => (
                <button
                  key={cred}
                  className={`py-2 px-4 flex-1 text-center font-medium transition-all ${
                    activeCredential === cred
                      ? "bg-white text-black border-b-2 "
                      : "text-gray-600"
                  }`}
                  onClick={() => setActiveCredential(cred)}
                >
                  {cred} Credentials
                </button>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 mt-4">
              <button
                className=" border rounded-lg bg-white text-black px-4 py-2 hover:bg-gray-100"
                onClick={() => setShowForm(true)}
              >
                View Credentials
              </button>
              <button
                className="flex items-center gap-2 border text-black px-4 py-2 rounded-md hover:bg-gray-100"
                onClick={() => setShowForm(false)}
              >
                <RiDeleteBin7Line className="text-lg" />
                Clear
              </button>
            </div>

            {/* Credentials Form */}
            {activeCredential === "Amazon" && showForm && (
              <div className="mt-4 p-4 border rounded-lg bg-white">
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Username"
                  name="username"
                  value={amazonCredentials.username}
                  onChange={handleChange}
                  className="w-full p-2 mb-2 border rounded"
                />
                <label className="block text-sm font-medium text-gray-700 mt-4">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  name="password"
                  value={amazonCredentials.password}
                  onChange={handleChange}
                  className="w-full p-2 mb-2 border rounded"
                />
                <button
                  className="flex item-center gap-2 mt-4 bg-black text-white px-4 py-2 rounded-md"
                  onClick={handleSetCredentials}
                  disabled={processing}
                >
                  <BiSave size={20} />
                  Save Changes
                </button>
              </div>
            )}

            {activeCredential === "Email" && showForm && (
              <div className="mt-4 p-4 border rounded-lg bg-white">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 mb-2 border rounded"
                />
                <button
                  className="flex item-center gap-2 mt-4 bg-black text-white px-4 py-2 rounded-md"
                  onClick={handleSetEmail}
                  disabled={processing}
                >
                  <BiSave size={20} />
                  Save Changes
                </button>
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
            <div>
              {message && (
                <p className="text-sm mt-2 text-gray-700">{message}</p>
              )}
              {processing && <Loader />}
            </div>
          </div>
        )}
      </div>

      {/* old code */}
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white/50 to-gray-900 p-4 dark:bg-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
          Amazon Automation Dashboard
        </h2>

        <div
          className="w-full max-w-xl border border-dashed border-gray-400 rounded-lg p-6 mb-4 bg-white dark:bg-gray-700"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center">
            <img src="./files.svg" alt="Upload" className="mb-2 w-16 h-16" />
            <p className="text-gray-700 dark:text-gray-200 mb-4">
              Drag & Drop your file here
            </p>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
            OR
          </p>
          <div className="text-center">
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              {processing ? "Processing" : "Browse Files"}
              {processing && <Loader />}
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              disabled={processing}
              className="hidden"
            />
          </div>
        </div>

        {message && (
          <p className="mb-4 text-gray-800 dark:text-gray-100">{message}</p>
        )}

        <div className="flex space-x-4 mb-4">
          {outputFileUrl && (
            <a
              href={outputFileUrl}
              download="output.xlsx"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Download Output File
            </a>
          )}
          {inputFileUrl && (
            <a
              href={inputFileUrl}
              download="input.xlsx"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Download Input File
            </a>
          )}
        </div>

        {!processing && (
          <div className="flex space-x-4 mb-4">
            <button
              onClick={handleClearCredentials}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Clear Credentials
            </button>
            <button
              onClick={handleClearEmail}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Clear Email
            </button>
          </div>
        )}

        {showCredentialsForm && (
          <div className="w-full max-w-md bg-white dark:bg-gray-700 p-4 rounded mb-4">
            <input
              type="text"
              placeholder="Username"
              name="username"
              value={amazonCredentials.username}
              onChange={handleChange}
              className="w-full p-2 mb-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={amazonCredentials.password}
              onChange={handleChange}
              className="w-full p-2 mb-2 border rounded"
            />
            <button
              onClick={handleSetCredentials}
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
            >
              Submit
            </button>
          </div>
        )}

        {showEmailForm && (
          <div className="w-full max-w-md bg-white dark:bg-gray-700 p-4 rounded mb-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 mb-2 border rounded"
            />
            <button
              onClick={handleSetEmail}
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
            >
              Submit Email
            </button>
          </div>
        )}

        {otpRequested && (
          <div className="w-full max-w-md bg-white dark:bg-gray-700 p-4 rounded">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-2 mb-2 border rounded"
            />
            <button
              onClick={handleOtpSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
            >
              Submit OTP
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
