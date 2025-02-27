"use client"; 

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FaEdit, FaTrash, FaSave, FaPlus } from "react-icons/fa";
import Link from "next/link";
import { useSession } from "next-auth/react";

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

export default function PinDetails() {
  const params = useParams();
  const pinId = params.id ? params.id[0] : null;
  const [pin, setPin] = useState<Pin | null>(null);
  const [relatedPins, setRelatedPins] = useState<Pin[]>([]);
  const [randomPins, setRandomPins] = useState<Pin[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    title: "",
    description: "",
    category: "",
    image: null as string | File | null,
  });

  const { data: session } = useSession();
  useEffect(() => {
    const fetchPinDetails = async () => {
      if (!session?.accessToken) return ;
      try {
        console.log('test')
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pin/${pinId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json','Authorization': `Bearer ${session.accessToken}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch data");
        const data = await response.json();
        setPin(data.pin);
        setRelatedPins(data.relatedPins);
        setRandomPins(data.randomPins);
        setFormData({
          id: data.pin.id,
          title: data.pin.title || "",
          description: data.pin.description || "",
          category: data.pin.category || "",
          image: data.pin.image || null,
        });
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };  

    if (pinId) {
      fetchPinDetails();
    }
  }, [pinId,session?.accessToken]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pin/${pinId}`,
        {
          method: "PUT",
          body: JSON.stringify(formData),
          headers: { "Content-Type": "application/json" },
          
        }
      );

      if (!response.ok) throw new Error("Failed to save pin");
      setIsEditing(false);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  if (!session || !pin) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg">
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
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <img
              src={pin.image}
              alt={pin.title}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
            <h2 className="text-2xl font-bold mb-2">{pin.title}</h2>
            <p className="text-gray-600 mb-4">{pin.description}</p>
            <p className="text-gray-500 mb-4">Category: {pin.category}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => {
                  
                }}
                className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600"
              >
                <FaTrash />
              </button>
              <button
                onClick={() => {
                 
                }}
                className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600"
              >
                <FaPlus />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Related Pins</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {relatedPins.map((relatedPin) => (
            <Link key={relatedPin.id} href={`/pin/${relatedPin.id}`}>
              <div className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition duration-300">
                <img
                  src={relatedPin.image}
                  alt={relatedPin.title}
                  className="w-full h-48 object-cover rounded-lg mb-2"
                />
                <h4 className="text-lg font-semibold">{relatedPin.title}</h4>
                <p className="text-gray-600">{relatedPin.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Random Pins</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {randomPins.map((randomPin) => (
            <Link key={randomPin.id} href={`/pin/${randomPin.id}`}>
              <div className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition duration-300">
                <img
                  src={randomPin.image}
                  alt={randomPin.title}
                  className="w-full h-48 object-cover rounded-lg mb-2"
                />
                <h4 className="text-lg font-semibold">{randomPin.title}</h4>
                <p className="text-gray-600">{randomPin.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}