import React, { useState } from 'react';
import { useBIMStore } from '../store/bimStore';

export default function ControlPanel() {
  const { setBeamColor, setAutoRotate, setTowerHeight } = useBIMStore();
  const [color, setColor] = useState("#4f46e5");

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-md w-64">
      <h2 className="font-semibold mb-3">BIM Controls</h2>

      <label className="block mb-1 text-sm">Beam Color</label>
      <input
        type="color"
        value={color}
        onChange={(e) => {
          setColor(e.target.value);
          setBeamColor(e.target.value);
        }}
        className="mb-3 w-full"
      />

      <label className="block mb-1 text-sm">Tower Height</label>
      <input
        type="range"
        min="1"
        max="3"
        step="0.1"
        onChange={(e) => setTowerHeight(parseFloat(e.target.value))}
        className="mb-3 w-full"
      />

      <label className="block mb-1 text-sm">Auto Rotate</label>
      <input
        type="checkbox"
        onChange={(e) => setAutoRotate(e.target.checked)}
        className="ml-2"
      />
    </div>
  );
}
