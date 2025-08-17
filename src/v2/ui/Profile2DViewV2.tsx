// v2/ui/Profile2DViewV2.tsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";
import { ProfilePoint } from "../profiles/types";

interface Profile2DViewProps {
  profilePoints: ProfilePoint[];
}

export const Profile2DViewV2: React.FC<Profile2DViewProps> = ({ profilePoints }) => {
  if (!profilePoints || profilePoints.length === 0) {
    return <div className="text-gray-400 p-4">No profile data</div>;
  }

  const data = profilePoints.map((p) => ({
    z: p.x, // length axis
    r: p.r, // radius axis
  }));

  return (
    <div className="w-full h-80 bg-gray-900 rounded p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis
            dataKey="z"
            stroke="#aaa"
            tick={{ fill: "#aaa" }}
            domain={["auto", "auto"]}
            type="number"
          >
            <Label value="Length (mm)" offset={-5} position="insideBottom" fill="#aaa" />
          </XAxis>
          <YAxis
            dataKey="r"
            stroke="#aaa"
            tick={{ fill: "#aaa" }}
            domain={["auto", "auto"]}
            type="number"
          >
            <Label
              value="Radius (mm)"
              angle={-90}
              position="insideLeft"
              offset={-5}
              fill="#aaa"
            />
          </YAxis>
          <Tooltip
            contentStyle={{ backgroundColor: "#222", border: "1px solid #555" }}
            labelStyle={{ color: "#fff" }}
            formatter={(val, name) => [`${val} mm`, name === "r" ? "Radius" : "Length"]}
          />
          <Line type="monotone" dataKey="r" stroke="#0ff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
