// components/Board.tsx
import { FaEdit, FaTrash, FaSave, FaPlus, FaMinus } from "react-icons/fa";
import { useState } from "react";
import Link from "next/link";

interface Pin {
  id: number;
  title: string;
  image: string;
}

interface BoardProps {
  board: {
    id: number;
    name: string;
    pins: Pin[];
  };
  allPins: Pin[];
  onEdit: (board: any) => void;
  onDelete: (boardId: number) => void;
  onSave: (updatedBoard: { id: number; name: string; pins: number[] }) => void;
  onCancel: () => void;
}

export default function BoardCard({ board, allPins, onEdit, onDelete, onSave, onCancel }: BoardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: board.id,
    name: board.name || "",
    pins: board.pins.map((pin) => pin.id),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  const togglePin = (pinId: number) => {
    setFormData((prev) => ({
      ...prev,
      pins: prev.pins.includes(pinId)
        ? prev.pins.filter((id) => id !== pinId)
        : [...prev.pins, pinId],
    }));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition duration-300">
      {isEditing ? (
        <>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Board Name"
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <div className="flex flex-col gap-2">
            <h4 className="text-lg font-semibold">Edit Pins</h4>
            {board.pins.map((pin) => (
              <div key={pin.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!formData.pins.includes(pin.id)}
                  onChange={() => togglePin(pin.id)}
                />
                <Link href={`/pin/${pin.id}`}>
                  <img src={pin.image} alt={pin.title} className="w-16 h-16 object-cover rounded" />
                </Link>
                <span>{pin.title}</span>
              </div>
            ))}
          </div>
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
                onCancel();
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold">{board.name}</h3>
          <div className="flex flex-col gap-2 mt-4">
            <h4 className="text-lg font-semibold">Pins</h4>
            {board.pins.map((pin) => (
              <div key={pin.id} className="flex items-center gap-2">
                <Link href={`/pin/${pin.id}`}>
                  <img src={pin.image} alt={pin.title} className="w-16 h-16 object-cover rounded" />
                </Link>
                <span>{pin.title}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setIsEditing(true);
                onEdit(board);
              }}
              className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => onDelete(board.id)}
              className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600"
            >
              <FaTrash />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
    