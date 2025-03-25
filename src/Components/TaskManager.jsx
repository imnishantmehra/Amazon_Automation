import { useState } from "react";
import { FaSyncAlt } from "react-icons/fa";
import { IoMdTime } from "react-icons/io";
import { LiaCheckCircleSolid, LiaTimesCircleSolid } from "react-icons/lia";

const TaskManager = () => {
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

  return (
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
        <button className="flex items-center bg-gray-100 px-4 py-2 text-gray-700 rounded-lg shadow hover:bg-gray-200">
          <FaSyncAlt className="mr-2" /> Refresh
        </button>
      </div>
      <p className="text-gray-500 text-right mt-4">Next run: 5:30:00 PM</p>

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
  );
};

export default TaskManager;
