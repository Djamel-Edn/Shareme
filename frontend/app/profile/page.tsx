"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FaEdit, FaHome, FaPlus, FaTrash } from "react-icons/fa";
import { Session } from "next-auth";
import imageCompression from 'browser-image-compression';
import PinCard from "../components/Pin";
import BoardCard from "../components/Board";

interface ExtendedSession extends Session {
  user: {
    id: number;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface User {
  id: number;
  username: string;
  profile_picture: string;
  background_picture: string;
  pins: Pin[];
  boards: Board[];
}

interface Pin {
  id: number;
  title: string;
  image: string;
  description: string;
  category: string;
  creator: {
    username: string;
    profile_picture: string;
  };
}

interface Board {
  id: number;
  name: string;
  pins: Pin[];
}

export default function Profile() {
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: string };
  const [user, setUser] = useState<User | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingBackground, setIsEditingBackground] = useState(false);
  const [isCreatingPin, setIsCreatingPin] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [pinForm, setPinForm] = useState({ title: "", image: null as File | null, description: "", category: "" });
  const [boardForm, setBoardForm] = useState({ name: "", pins: [] as number[] });
  const [displayPins, setDisplayPins] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isBoardSelectionModalOpen, setIsBoardSelectionModalOpen] = useState(false);
  const [selectedPinForBoard, setSelectedPinForBoard] = useState<number | null>(null);
  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = '/login';
    }
  }, [status]);

  async function compressImage(file: File) {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: 'image/jpeg',
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  }
  const handleAddToBoard = (pinId: number) => {
    setSelectedPinForBoard(pinId);
    setIsBoardSelectionModalOpen(true);
  };
  const handleCreateBoardWithPin = async (boardName: string) => {
    setLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/boards/`;
      const method = "POST";
  
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: boardName,
          pins: [selectedPinForBoard],
          user: session?.user?.id,
        }),
      });
  
      if (response.ok) {
        fetchUserProfile();
        setIsBoardSelectionModalOpen(false);
        setSelectedPinForBoard(null);
      }
    } catch (error) {
      console.error("Error creating board:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddPinToExistingBoard = async (boardId: number) => {
    setLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/boards/${boardId}/add-pin/`;
      const method = "PATCH";
  
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinId: selectedPinForBoard }),
      });
  
      if (response.ok) {
        fetchUserProfile();
        setIsBoardSelectionModalOpen(false);
        setSelectedPinForBoard(null);
      }
    } catch (error) {
      console.error("Error adding pin to board:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const BoardSelectionModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Add Pin to Board</h2>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => {
              const boardName = prompt("Enter a name for the new board:");
              if (boardName) {
                handleCreateBoardWithPin(boardName);
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
          >
            Create New Board
          </button>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">Add to Existing Board</h3>
            {user?.boards.map((board) => (
              <button
                key={board.id}
                onClick={() => handleAddPinToExistingBoard(board.id)}
                className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600"
              >
                {board.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsBoardSelectionModalOpen(false)}
            className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
  const handleFileUpload = async (file: File) => {
    try {
      const compressedFile = await compressImage(file);
      const response = await fetch('/api/upload');
      const { signature, timestamp, cloud_name, api_key } = await response.json();

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('api_key', api_key);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('folder', 'uploads');

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!cloudinaryResponse.ok) {
        const errorResponse = await cloudinaryResponse.json();
        throw new Error(`Upload failed: ${errorResponse.error?.message || 'Unknown error'}`);
      }

      const result = await cloudinaryResponse.json();
      return result.secure_url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile();
    }
  }, [session]);
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${session?.user?.id}/`,{
          headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${session?.accessToken}`
        }}
      );
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleUpdateProfilePicture = async (file: File) => {
    setLoading(true);
    try {
      const profilePictureUrl = await handleFileUpload(file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${session?.user?.id}/update/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_picture: profilePictureUrl }),
        }
      );

      if (res.ok) {
        fetchUserProfile();
        setIsEditingProfile(false);
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBackgroundPicture = async (file: File) => {
    setLoading(true);
    try {
      const backgroundPictureUrl = await handleFileUpload(file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${session?.user?.id}/update/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ background_picture: backgroundPictureUrl }),
        }
      );

      if (res.ok) {
        fetchUserProfile();
        setIsEditingBackground(false);
      }
    } catch (error) {
      console.error("Error updating background picture:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = pinForm.image;

      if (pinForm.image instanceof File) {
        imageUrl = await handleFileUpload(pinForm.image);
      }

      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pins/`;
      const method = "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pinForm.title,
          image: imageUrl,
          description: pinForm.description,
          category: pinForm.category,
          creator: session?.user?.id,
        }),
      });

      if (response.ok) {
        fetchUserProfile();
        setIsCreatingPin(false);
        setPinForm({ title: "", image: null, description: "", category: "" });
      }
    } catch (error) {
      console.error("Error creating pin:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/boards/`;
      const method = "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...boardForm, user: session?.user?.id }),
      });

      if (response.ok) {
        fetchUserProfile();
        setIsCreatingBoard(false);
        setBoardForm({ name: "", pins: [] });
      }
    } catch (error) {
      console.error("Error creating board:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePin = async (pinId: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pins/${pinId}/`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchUserProfile();
      }
    } catch (error) {
      console.error("Error deleting pin:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBoard = async (boardId: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/boards/${boardId}/`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchUserProfile();
      }
    } catch (error) {
      console.error("Error deleting board:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePin = async (updatedPin: { id: number; title: string; description: string; category: string; image: File | null | string }) => {
    setLoading(true);
    try {
      let imageUrl = updatedPin.image;

      if (updatedPin.image instanceof File) {
        imageUrl = await handleFileUpload(updatedPin.image);
      }

      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pins/${updatedPin.id}/`;
      const method = "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updatedPin.title,
          image: imageUrl,
          description: updatedPin.description,
          category: updatedPin.category,
        }),
      });

      if (response.ok) {
        fetchUserProfile();
      }
    } catch (error) {
      console.error("Error updating pin:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBoard = async (updatedBoard: { id: number; name: string; pins: number[] }) => {
    setLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/boards/${updatedBoard.id}/`;
      const method = "PUT";
  
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedBoard.name,
          pins: updatedBoard.pins,
          user: session?.user?.id,
        }),
      });
  
      if (response.ok) {
        fetchUserProfile();
      }
    } catch (error) {
      console.error("Error updating board:", error);
    } finally {
      setLoading(false);
    }
  };
  

 
  if (!user) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <div className="absolute z-10 top-4 left-4">
        <a
          href="/"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300"
        >
          <FaHome /> Home
        </a>
      </div>
      <div
        className="relative h-72 w-full bg-cover bg-center rounded-b-3xl shadow-lg"
        style={{ backgroundImage: `url(${user.background_picture})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          {isEditingBackground ? (
            <div className="flex gap-2 p-4 bg-white rounded-lg shadow-md">
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleUpdateBackgroundPicture(e.target.files[0]);
                      }
                    }}
                    accept="image/*"
                    className="p-2 border rounded"
                  />
                  <button
                    onClick={() => setIsEditingBackground(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsEditingBackground(true)}
              className="bg-white px-4 py-2 rounded shadow-md flex items-center gap-2 hover:bg-gray-200"
            >
              <FaEdit /> Edit Background
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center -mt-16">
        <div className="relative">
          <img
            src={user.profile_picture}
            alt="Profile"
            className="w-32 h-32 rounded-full border-4 border-white shadow-md"
          />
          {isEditingProfile ? (
            <div className="absolute bottom-0 right-0 flex gap-2 bg-white p-2 rounded-lg shadow-md">
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleUpdateProfilePicture(e.target.files[0]);
                      }
                    }}
                    accept="image/*"
                    className="p-2 border rounded"
                  />
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg hover:bg-gray-200"
            >
              <FaEdit />
            </button>
          )}
        </div>
        <h1 className="text-3xl font-bold mt-4">{user.username}</h1>
      </div>

      <div className="flex justify-center space-x-4 mt-6">
        <button
          onClick={() => { setDisplayPins(true); setIsCreatingBoard(false); }}
          className={`p-3 rounded-lg shadow-md transition duration-300 ${
            displayPins ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Pins
        </button>
        <button
          onClick={() => { setDisplayPins(false); setIsCreatingPin(false);  }}
          className={`p-3 rounded-lg shadow-md transition duration-300 ${
            !displayPins ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Boards
        </button>
      </div>

      {displayPins ? (
  <div className="p-6 w-full max-w-4xl">
    <h2 className="text-2xl font-bold mb-4">Pins</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {user.pins.map((pin) => (
        <PinCard
          key={pin.id}
          pin={pin}
          onEdit={(pin) => {
            setPinForm({ title: pin.title, image: pin.image, description: pin.description, category: pin.category });
          }}
          onDelete={handleDeletePin}
          onSave={handleSavePin}
          onAddToBoard={handleAddToBoard}
        />
      ))}
    </div>
    <button
      onClick={() => setIsCreatingPin(true)}
      className="mt-6 bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600"
    >
      <FaPlus /> Add Pin
    </button>
  </div>
) : (
  <div className="p-6 w-full max-w-4xl">
    <h2 className="text-2xl font-bold mb-4">Boards</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {user.boards.map((board) => (
        <BoardCard
          key={board.id}
          board={board}
          onEdit={(board) => {
            setBoardForm({ name: board.name, pins: board.pins.map((pin: Pin) => pin.id) });
          }}
          onDelete={handleDeleteBoard}
          onSave={handleSaveBoard}
        />
      ))}
    </div>
    <button
      onClick={() => setIsCreatingBoard(true)}
      className="mt-6 bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600"
    >
      <FaPlus /> Add Board
    </button>
  </div>
)}

      {isCreatingPin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Create Pin</h2>
            <form onSubmit={handleCreatePin}>
              <input
                type="text"
                value={pinForm.title}
                onChange={(e) => setPinForm({ ...pinForm, title: e.target.value })}
                placeholder="Title"
                className="w-full p-2 mb-4 border rounded"
                required
              />
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setPinForm({ ...pinForm, image: e.target.files[0] });
                  }
                }}
                accept="image/*"
                className="w-full p-2 mb-4 border rounded"
                required
              />
              <textarea
                value={pinForm.description}
                onChange={(e) => setPinForm({ ...pinForm, description: e.target.value })}
                placeholder="Description"
                className="w-full p-2 mb-4 border rounded"
                required
              />
              <input
                type="text"
                value={pinForm.category}
                onChange={(e) => setPinForm({ ...pinForm, category: e.target.value })}
                placeholder="Category"
                className="w-full p-2 mb-4 border rounded"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
                >
                  Create
                </button>
                <button
                  onClick={() => setIsCreatingPin(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreatingBoard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Create Board</h2>
            <form onSubmit={handleCreateBoard}>
              <input
                type="text"
                value={boardForm.name}
                onChange={(e) => setBoardForm({ ...boardForm, name: e.target.value })}
                placeholder="Board Name"
                className="w-full p-2 mb-4 border rounded"
                required
              />
              <div className="flex flex-col gap-2">
                {user.pins.map((pin) => (
                  <div key={pin.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={boardForm.pins.includes(pin.id)}
                      onChange={() => {
                        setBoardForm((prev) => ({
                          ...prev,
                          pins: prev.pins.includes(pin.id)
                            ? prev.pins.filter((id) => id !== pin.id)
                            : [...prev.pins, pin.id],
                        }));
                      }}
                    />
                    <span>{pin.title}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
                >
                  Create
                </button>
                <button
                  onClick={() => setIsCreatingBoard(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
       {isBoardSelectionModalOpen && <BoardSelectionModal />}
    </div>
  );
}
