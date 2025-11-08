"use client";

import React, { useState } from "react";
import { UserIcon, MailIcon, BriefcaseIcon, FileTextIcon, SaveIcon } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Developer",
    bio: "Full-stack engineer passionate about real-time apps and collaborative tools.",
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-10">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6">
        <div className="flex flex-col items-center mb-6">
          <img
            src="https://i.pravatar.cc/120"
            alt="Profile"
            className="w-24 h-24 rounded-full border-4 border-blue-500 shadow-md"
          />
          <h2 className="text-2xl font-semibold mt-3">{profile.name}</h2>
          <p className="text-gray-500">{profile.role}</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <UserIcon className="text-blue-500" size={20} />
            <input
              type="text"
              name="name"
              value={profile.name}
              disabled={!isEditing}
              onChange={handleChange}
              className={`flex-1 border-b focus:outline-none ${
                isEditing ? "border-blue-500" : "border-transparent bg-transparent"
              }`}
            />
          </div>

          <div className="flex items-center gap-3">
            <MailIcon className="text-blue-500" size={20} />
            <input
              type="email"
              name="email"
              value={profile.email}
              disabled={!isEditing}
              onChange={handleChange}
              className={`flex-1 border-b focus:outline-none ${
                isEditing ? "border-blue-500" : "border-transparent bg-transparent"
              }`}
            />
          </div>

          <div className="flex items-center gap-3">
            <BriefcaseIcon className="text-blue-500" size={20} />
            <input
              type="text"
              name="role"
              value={profile.role}
              disabled={!isEditing}
              onChange={handleChange}
              className={`flex-1 border-b focus:outline-none ${
                isEditing ? "border-blue-500" : "border-transparent bg-transparent"
              }`}
            />
          </div>

          <div className="flex items-start gap-3">
            <FileTextIcon className="text-blue-500 mt-1" size={20} />
            <textarea
              name="bio"
              value={profile.bio}
              disabled={!isEditing}
              onChange={handleChange}
              rows="3"
              className={`flex-1 border-b focus:outline-none resize-none ${
                isEditing ? "border-blue-500" : "border-transparent bg-transparent"
              }`}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-all"
            >
              <SaveIcon size={18} />
              Save Changes
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-gray-100 text-blue-600 px-4 py-2 rounded-lg shadow hover:bg-gray-200 transition-all"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
