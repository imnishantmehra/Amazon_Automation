import axios from "axios";

// const API_BASE_URL = "https://amazon-scrape-backend-899820581573.us-central1.run.app";
const API_BASE_URL = "https://77b8-49-43-7-169.ngrok-free.app";

const axiosConfigForFetch = {
    headers: {
        "ngrok-skip-browser-warning": "true",
    },
};

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "ngrok-skip-browser-warning": "true",
    }
})

const request = async (method, endpoint, data = null, config = {}) => {
    try {
        const response = await axiosInstance({ method, url: endpoint, data, ...config });
        return response.data;
    } catch (error) {
        let errorMessage = "Unknown error occurred";
        let errorCode = 500;  // Default to server error

        // Check if error has a response (HTTP error response from the server)
        if (error.response) {
            errorCode = error.response.status;

            // If the server returns an error message or a custom error, include it
            errorMessage = error.response?.data?.error || error.response?.data?.message || "Unknown server error";

            // Handle specific HTTP status codes
            if (errorCode === 400) {
                errorMessage = `Bad Request: ${errorMessage}`;
            } else if (errorCode === 401) {
                errorMessage = `Unauthorized: ${errorMessage}`;
            } else if (errorCode === 403) {
                errorMessage = `Forbidden: ${errorMessage}`;
            } else if (errorCode === 404) {
                errorMessage = `Not Found: ${errorMessage}`;
            } else if (errorCode === 500) {
                errorMessage = `Internal Server Error: ${errorMessage}`;
            } else if (errorCode === 503) {
                errorMessage = `Service Unavailable: ${errorMessage}`;
            }
        } else if (error.request) {
            // This is a case where the request was made but no response was received
            errorMessage = "No response received from the server.";
            errorCode = 504;  // Gateway Timeout
        } else {
            // If the error is not related to HTTP response or request, it's a general Axios error
            errorMessage = error.message || "Unknown error occurred";
            errorCode = 500;  // Default to server error
        }

        // Return a structured error with the status code and message
        throw { status: errorCode, message: errorMessage };
    }
};

export const api = {
    get: (endpoint, config = {}) => request("get", endpoint, null, config),
    post: (endpoint, data, config = {}) => request("post", endpoint, data, config),
    put: (endpoint, data, config = {}) => request("put", endpoint, data, config),
    patch: (endpoint, data, config = {}) => request("patch", endpoint, data, config),
    delete: (endpoint, config = {}) => request("delete", endpoint, null, config),
}

//Fetch function for streaming
export const streamAPIResponse = async (
    url,
    setMessage,
    setOtpRequested = null,
    otpSubmitted = null
) => {
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, axiosConfigForFetch);

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        setMessage("Processing...");
        let waitingForOTP = false;
        const MAX_WAIT_TIME = 180;
        let elapsedTime = 0;

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder
                .decode(value, { stream: true })
                .replace("data: ", "");

            if (chunk.includes("Waiting for OTP submission via API...")) {
                if (!waitingForOTP) {
                    setOtpRequested(true);
                    setMessage("Please Enter OTP sent to your device");
                    waitingForOTP = true;
                }

                while (!otpSubmitted.current && elapsedTime < MAX_WAIT_TIME) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    elapsedTime++;
                }

                if (!otpSubmitted.current) {
                    setOtpRequested(false);
                    setMessage("OTP submission timeout. Please re-initiate the process.");
                    throw new Error("OTP submission timeout. Please re-initiate the process.");
                }
                setMessage("OTP Submitted, Resuming automation...");
            } else {
                setMessage(chunk);
            }
        }
    } catch (error) {
        const message =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error?.message ||
            error.response?.data ||
            'Unknown streaming error';

        throw new Error(message);
    }
};

// Calls automation API 5 times
export const retryAutomation = async (url, setMessage, setOtpRequested, otpSubmitted) => {
    let attempts = 0;
    while (attempts < 5) {
        try {
            setMessage(
                attempts === 0
                    ? "Running automation..."
                    : `Automation failed. Retrying ${attempts + 1}...`
            );
            await streamAPIResponse(
                url,
                setMessage,
                setOtpRequested,
                otpSubmitted
            );
            return { "status": true, "message": "Automation completed." };
        } catch (error) {
            attempts++;

            if (error.message === "OTP submission timeout. Please re-initiate the process.") {
                return { "status": false, "message": "OTP submission timeout. Please re-initiate the process." }
            }

            if (attempts >= 5) {
                return { "status": false, "message": "Automation failed after 5 attempts." }
            }
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
};
