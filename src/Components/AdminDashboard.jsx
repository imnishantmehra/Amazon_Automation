import   { useState } from "react";
import { RiDeleteBin7Line } from "react-icons/ri";
import { BiSave } from "react-icons/bi";
import FileUpload from "./FileUpload";
import TaskManager from "./TaskManager";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("Credentials");
  const [activeCredential, setActiveCredential] = useState("Amazon");
  const [showForm, setShowForm] = useState(false);

  return (
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
                className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none"
                defaultValue="amazon_user"
              />
              <label className="block text-sm font-medium text-gray-700 mt-4">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none"
                defaultValue="********"
              />
            <button className="flex item-center gap-2 mt-4 bg-black text-white px-4 py-2 rounded-md">
                <BiSave size={20}/>
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
                className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none"
                defaultValue="admin@example.com"
              />
              <label className="block text-sm font-medium text-gray-700 mt-4">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none"
                defaultValue="********"
              />
              <button className="flex item-center gap-2 mt-4 bg-black text-white px-4 py-2 rounded-md">
                <BiSave size={20}/>
                Save Changes
              </button>
            </div>
          )}
        </div>
      )}

        {/* File Upload */}
        {activeTab === "File Upload" && <FileUpload />}

         {/* Task Manager */}
         {activeTab === "Task Manager" && <TaskManager />}
    </div>
  );
};

export default AdminDashboard;
