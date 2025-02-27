import{ FaEdit, FaTrash, FaSave, FaPlus } from "react-icons/fa";
import { useState } from "react";
import Link from "next/link";

interface PinProps {
  pin: {
    id: number;
    title: string;
    image: string;
    description: string;
    category: string;
    creator: {
      username: string;
      profile_picture: string;
    };
  };
  onEdit: (pin: any) => void;
  onDelete: (pinId: number) => void;
  onSave: (updatedPin: { id: number; title: string; description: string; category: string; image: File | null | string }) => void;
  onAddToBoard: (pinId: number) => void;
}

export default function PinCard({ pin, onEdit, onDelete, onSave, onAddToBoard }: PinProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{
    id: number;
    title: string;
    description: string;
    category: string;
    image: string | File | null;
  }>({
    id: pin.id,
    title: pin.title || "",
    description: pin.description || "",
    category: pin.category || "",
    image: pin.image || null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition duration-300">
      {isEditing ? (
        <>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Title"
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="w-full p-2 mb-4 border rounded"
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="Category"
            className="w-full p-2 mb-4 border rounded"
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 flex items-center gap-2"
            >
              <FaSave /> Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <Link href={`/pin/${pin.id}`}>
            <img
              src={pin.image}
              alt={pin.title}
              className="w-full h-48 object-cover rounded-lg cursor-pointer"
            />
          </Link>
          <h3 className="text-lg font-semibold mt-2">{pin.title}</h3>
          <p className="text-gray-600">{pin.description}</p>
          <p className="text-gray-500">{pin.category}</p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setIsEditing(true);
                onEdit(pin);
              }}
              className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => onDelete(pin.id)}
              className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600"
            >
              <FaTrash />
            </button>
            <button
              onClick={() => onAddToBoard(pin.id)}
              className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600"
            >
              <FaPlus />
            </button>
          </div>
          <div className="flex items-center mt-2">
            <img
              src={pin.creator.profile_picture}
              alt={pin.creator.username}
              className="w-8 h-8 rounded-full mr-2"
            />
            <span className="text-sm">{pin.creator.username}</span>
          </div>
        </>
      )}
    </div>
  );
}
