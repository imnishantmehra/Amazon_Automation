import axios from "axios";

const API_BASE_URL =
    "https://ebab-2405-201-3009-d88a-9d61-b8e1-b06a-5f70.ngrok-free.app/";

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
        const response = await axiosInstance({ method, url: endpoint, data, ...config })
        return response.data
    } catch (error) {
        throw error.response?.data?.message || error.response?.data || error.message;
    }
}

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
        // setMessage(`Error: ${error.response?.data?.message || error.response?.data || error.message}`);
        // console.log("error", error);
        throw (error.response?.data?.message || error.response?.data || error.message);
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

            if (error === "OTP submission timeout. Please re-initiate the process.") {
                console.log("nsted Error if");
                return { "status": false, "message": "OTP submission timeout. Please re-initiate the process." }
            }

            if (attempts >= 5) {
                // setMessage("Automation failed after 5 attempts.");
                return { "status": false, "message": "Automation failed after 5 attempts." }
            }
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
};
