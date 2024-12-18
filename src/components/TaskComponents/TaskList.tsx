import {useState, useEffect} from "react";
import {doc, getDoc, updateDoc} from "firebase/firestore";

import Loading from "../Loading";

import TaskEditForm from "./TaskEditForm";

import {db} from "@/api/firebase";
import {useFetchTasks, useFetchChildren, useAuth, useDeleteTask, useUpdateTask} from "@/hooks"; // Ensure to import the update task hook
import {Task} from "@/types/TaskProps";

export default function TaskList() {
  const {user} = useAuth();
  const {
    children,
    loading: childrenLoading,
    error: childrenError,
  } = useFetchChildren(user ? user.uid : "");

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    if (children.length > 0) {
      setSelectedChildId(children[0].id); // Set the first child as the default selected child
    }
  }, [children]);

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useFetchTasks(selectedChildId || "");

  const {deleteTask} = useDeleteTask();
  const {updateTask} = useUpdateTask(); // Import your update task hook
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (editingTaskId) {
      refetchTasks(); // Refetch tasks when editing task changes
    }
  }, [editingTaskId, refetchTasks]);

  if (tasksLoading || childrenLoading) return <Loading />;
  if (tasksError) return <p>{tasksError}</p>;
  if (childrenError) return <p>{childrenError}</p>;

  const getChildName = (childId: string) => {
    const child = children.find((child) => child.id === childId);

    return child ? child.name : "Unknown Child";
  };

  const handleEditClick = (taskId: string) => {
    setEditingTaskId(taskId);
  };

  const handleDeleteClick = async (taskId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this task?");

    if (confirmed) {
      try {
        await deleteTask(taskId); // Call your delete task function
        refetchTasks(); // Refetch tasks after deletion
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  const handleCloseEdit = () => {
    setEditingTaskId(null);
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!user) {
      console.error("User is not authenticated.");

      return; // Ensure user is authenticated
    }

    try {
      // Fetch the task to get the child's ID and points for this task
      const taskToUpdate = tasks.find((task) => task.id === taskId);

      if (taskToUpdate) {
        const childId = taskToUpdate.childId; // Get the child's ID from the task
        const pointsToAdd = taskToUpdate.points; // Get the points associated with the task

        // Update the task status to completed
        await updateTask(taskId, {status: "completed"});

        // Now fetch the child's current points
        const childRef = doc(db, "users", user.uid, "children", childId); // Adjusted path to include user ID
        const childSnapshot = await getDoc(childRef);

        if (childSnapshot.exists()) {
          const currentPoints = childSnapshot.data().points || 0; // Get current points or default to 0
          const newPoints = currentPoints + pointsToAdd; // Calculate new points

          // Update the child's points in Firestore
          await updateDoc(childRef, {points: newPoints});
        }

        refetchTasks(); // Refetch tasks after completion
      }
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  return (
    <div className="mx-auto max-w-md p-4">
      <h2 className="text-2xl font-bold text-gray-800">Task List</h2>

      {tasks.length === 0 ? (
        <p>No tasks available.</p>
      ) : (
        <div className="space-y-4">
          {tasks.map((task: Task) => (
            <div key={task.id} className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-md">
              <h3 className="text-xl font-semibold text-gray-800">{task.title}</h3>
              <p className="text-gray-700">
                <strong>Description:</strong> {task.description || "No description provided"}
              </p>
              <p className="text-gray-700">
                <strong>Assigned to:</strong> {getChildName(task.childId)}
              </p>
              <p className="text-gray-700">
                <strong>Status:</strong> {task.status}
              </p>

              <div className="flex justify-between">
                {task.status === "confirmation" && (
                  <button
                    className="rounded bg-green-500 p-2 text-white"
                    onClick={() => handleCompleteTask(task.id)} // Complete task
                  >
                    Complete Task
                  </button>
                )}
                <button
                  className="rounded bg-yellow-500 p-2 text-white"
                  onClick={() => handleEditClick(task.id)}
                >
                  Edit Task
                </button>
                <button
                  className="rounded bg-red-500 p-2 text-white"
                  onClick={() => handleDeleteClick(task.id)}
                >
                  Delete Task
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingTaskId && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="rounded p-6 shadow-lg">
            <TaskEditForm
              taskId={editingTaskId}
              updateTaskList={refetchTasks} // Refetch tasks on update
              onClose={handleCloseEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
