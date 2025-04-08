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
  const [inputFileUrl, setInputFileUrl] = useState(false);
  const [outputFileUrl, setOutputFileUrl] = useState(false);
  const [amazonCredentials, setAmazonCredentials] = useState({
    username: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const otpSubmitted = useRef(false);
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState("Credentials");
  const [activeCredential, setActiveCredential] = useState("Amazon");
  const [showForm, setShowForm] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutAmount, setCheckoutAmount] = useState("");
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
    {
      time: "Mar 20, 02:05 PM",
      status: "Success",
      duration: "43s",
      message: "Error: File processing error",
    },
    {
      time: "Mar 20, 01:05 PM",
      status: "Success",
      duration: "20s",
      message: "Error: Connection timeout",
    },
    {
      time: "Mar 20, 12:05 PM",
      status: "Failed",
      duration: "24s",
      message: "Task completed successfully",
    },
  ]);

  // const [tasks, setTasks] = useState([]);

  // useEffect(() => {
  //   const fetchlogs = async () => {
  //     try {
  //       const response = await api.get("/logs");
  // console.log(response,"response")

  //     } catch (error) {
  //       console.error("Error fetching data:", error);
  //     }
  //   };

  //   fetchlogs();
  // }, []);

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
  //       setMessage("File retrieved successfully, checking email");
  //       localStorage.setItem("amazonCredentials", JSON.stringify(true));
  //       await checkRequirements();
  //     } catch (error) {
  //       console.error("Error in scheduled tasks:", error);
  //     } finally {
  //       setProcessing(false);
  //     }
  //   }, 60 * 60 * 1000);

  //   return () => clearInterval(interval);
  // }, []);

  const getEmail = async () => {
    try {
      const data = await api.get("/get_email");

      if (data.status !== "error" && data.message !== "No email stored") {
        setEmail(data.email);
      }
    } catch (e) {
      console.error("Error fetching email:", e);
    }
  };
  const getAmazonCredentials = async () => {
    try {
      const data = await api.get("/get_amazon_credentials");

      if (
        data.status !== "error" &&
        data.message !== "No Amazon credentials stored"
      ) {
        setAmazonCredentials({
          username: data.username,
          password: data.password,
        });
      }
    } catch (e) {
      console.error("Error fetching Amazon credentials:", e);
    }
  };

  useEffect(() => {
    getEmail();
    getAmazonCredentials();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("first", name, value);
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
    setMessage("Uploading file, please wait");

    try {
      localStorage.setItem("amazonCredentials", JSON.stringify(true));
      const formData = new FormData();
      formData.append("file", file);

      await api.post("/upload", formData);
      setMessage("File saved, checking email");

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
        setMessage(
          "No email found, please enter your email in credentails tab"
        );
        return;
      }

      setMessage("Email found, checking amazon credentails");

      const credentailsData = await api.get("/get_amazon_credentials");

      if (
        credentailsData.message === "No Amazon credentials stored" &&
        credentailsData.status === "error"
      ) {
        setMessage(
          "Amazon credentials not found, Please enter both username and password in credentails tab."
        );
        return;
      }

      setMessage("Credentials found, running scraping");
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
    setMessage("Saving email");
    try {
      await api.post("/set_email", { email });
      // setEmail("");
      setMessage("Email saved! Checking amazon credentails");

      const data = await api.get("/get_amazon_credentials");

      if (
        data.message === "No Amazon credentials stored" &&
        data.status === "error"
      ) {
        setMessage("Amazon credentials not found, Please enter them below.");
        return;
      }

      setMessage("Credentials found, running scraping");

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
      setMessage("Scraping completed, fetching output file");
      setOutputFileUrl(null);
      setInputFileUrl(null);

      const outputResponse = await api.get("/outputfile", {
        responseType: "blob",
      });
      const outputFileUrl = convertBlobToURL(outputResponse);
      setOutputFileUrl(outputFileUrl);
      setMessage("Output file is ready! automation started");

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
      setMessage("Fetched output file, fetching isetShowCheckOutnput file!");

      const inputFileResponse = await api.get("/inputfile", {
        responseType: "blob",
      });
      const inputFileUrl = convertBlobToURL(inputFileResponse);
      setInputFileUrl(inputFileUrl);

      setMessage(
        automationResponse.message || "Process completed successfully"
      );

      if (automationResponse.status) {
        setShowCheckout(true);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleSetCredentials = async () => {
    if (!amazonCredentials.username || !amazonCredentials.password) return;

    setProcessing(true);
    setMessage("Saving credentials");
    try {
      await api.post("/set_amazon_credentials", {
        username: amazonCredentials.username,
        password: amazonCredentials.password,
      });
      setMessage("Credentials saved! Running scraping");
      // setAmazonCredentials({ username: "", password: "" });
      const storedCredentials = localStorage.getItem("amazonCredentials");
      // console.log(storedCredentials,"storedCredentials")
      if (storedCredentials) {
        await handleAutomationtask();
      } else {
        console.log("No stored credentials found.");
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleClearCredentials = async () => {
    setProcessing(true);
    setMessage("Clearing credentials");
    localStorage.setItem("amazonCredentials", JSON.stringify(false));
    try {
      await api.get("/clear_amazon_credentials");
      setMessage("Amazon credentials cleared successfully!");
      setAmazonCredentials({ username: "", password: "" });
    } catch (error) {
      setMessage(`Error: ${error}`);
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
      setMessage(`Wrong OTP Entered: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleClearEmail = async () => {
    setProcessing(true);
    setMessage("Clearing emails");
    try {
      await api.get("/clear_email");
      setMessage("Email cleared successfully!");
      setEmail("");
    } catch (error) {
      setMessage(`Error clearing email: ${error}`);
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
    try {
      const checkoutResponse = await api.post("/confirm_checkout", {
        total_paid: checkoutAmount,
      });
      console.log("checkoutResponse", checkoutResponse);
      setMessage(checkoutResponse.message);
      setShowCheckout(false);
    } catch (error) {
      setMessage(`Error: ${error}`);
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
                onClick={() => setShowForm(!showForm)}
              >
                View Credentials
              </button>
              {outputFileUrl && (
                <a
                  href={outputFileUrl}
                  download="output.xlsx"
                  className="border rounded-lg bg-white text-black px-4 py-2 hover:bg-gray-100"
                >
                  Download Output File
                </a>
              )}
              {inputFileUrl && (
                <a
                  href={inputFileUrl}
                  download="input.xlsx"
                  className="border rounded-lg bg-white text-black px-4 py-2 hover:bg-gray-100"
                >
                  Download Input File
                </a>
              )}
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
                <div className="flex gap-2">
                  <button
                    className="flex item-center gap-2 mt-4 bg-black text-white px-4 py-2 rounded-md"
                    onClick={handleSetCredentials}
                    disabled={processing}
                  >
                    <BiSave size={20} />
                    Save Changes
                  </button>
                  {/* {showCredentialsForm && (
                    <button
                      className="flex item-center gap-2 mt-4 bg-black text-white px-4 py-2 rounded-md"
                      onClick={handleSetCredentials}
                      disabled={processing}
                    >
                      <BiSave size={20} />
                      Save Changes
                    </button>
                  )} */}
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
                <div className="flex gap-2">
                  <button
                    className="flex item-center gap-2 mt-4 bg-black text-white px-4 py-2 rounded-md"
                    onClick={handleSetEmail}
                    disabled={processing}
                  >
                    <BiSave size={20} />
                    Save Changes
                  </button>
                  {/* {showEmailForm && (
                    <button
                      className="flex item-center gap-2 mt-4 bg-black text-white px-4 py-2 rounded-md"
                      onClick={handleSetEmail}
                      disabled={processing}
                    >
                      <BiSave size={20} />
                      Save Changes
                    </button>
                  )} */}
                  <button
                    onClick={handleClearEmail}
                    disabled={processing}
                    className="flex item-center gap-2 mt-4 bg-black text-white px-4 py-2 rounded-md"
                  >
                    Clear Email
                  </button>
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
            <div className="flex flex-row items-center justify-center space-x-2">
              {/* {processing && <Loader />} */}
              {message && (
                <p className="text-sm mt-3 text-gray-700 break-all whitespace-normal overflow-hidden">
                  {message}
                </p>
              )}
            </div>
            {otpRequested && (
              <div className="flex items-center justify-center space-x-2 mt-5">
                <div>
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
              </div>
            )}
            {showCheckout && (
              <div className="flex items-center justify-center space-x-2 mt-5">
                <div>
                  <a
                    href="https://www.amazon.com"
                    className="flex items-center justify-center text-black w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded mb-4"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Proceed to Checkout
                  </a>
                  <input
                    type="text"
                    placeholder="Enter the checkout amount"
                    value={checkoutAmount}
                    onChange={(e) => setCheckoutAmount(e.target.value)}
                    className="w-full p-2 mb-2 border rounded"
                  />
                  <button
                    onClick={handleCheckoutAmount}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                  >
                    Submit Amount
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Task Manager" && (
          <div className=" mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold">Task Manager</h2>
            <p className="text-gray-500">View hourly task execution reports</p>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 flex items-center gap-1">
                  <IoMdTime /> Runs hourly
                </span>
                <span className="bg-green-100 text-green-700 px-2 py-1 text-sm rounded-full flex items-center gap-1">
                  <LiaCheckCircleSolid /> Success
                </span>
                <span className="bg-red-100 text-red-700 px-2 py-1 text-sm rounded-full flex items-center gap-1">
                  <LiaTimesCircleSolid /> Failed
                </span>
              </div>
              {/* <button className="flex items-center bg-gray-100 px-4 py-2 text-gray-700 rounded-lg shadow hover:bg-gray-200">
                <FaSyncAlt className="mr-2" /> Refresh
              </button> */}
            </div>
            {/* <p className="text-gray-500 text-right mt-4">
              Next run: 5:30:00 PM
            </p> */}

            <div className="mt-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-gray-600 bg-gray-100">
                    <th className="p-3">Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, index) => (
                    <tr key={index} className="border-b text-gray-700">
                      <td className="p-3">{task.time}</td>

                      <td className="p-3">
                        {task.status === "Success" ? (
                          <span className="flex items-center w-24 gap-1 px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
                            <LiaCheckCircleSolid className="text-green-600" />
                            {task.status}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700 w-24">
                            <LiaTimesCircleSolid className="text-red-600" />
                            {task.status}
                          </span>
                        )}
                      </td>

                      <td className="p-3">{task.duration}</td>
                      <td className="p-3">{task.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* old code */}
      {/* <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white/50 to-gray-900 p-4 dark:bg-gray-700">
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
      </div> */}
    </>
  );
};

export default Dashboard;
