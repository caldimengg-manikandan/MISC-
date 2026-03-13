import React, { useState, useEffect } from "react";
import { Database, Search, X, ArrowRight } from "lucide-react";

/* ---------------------------
   AISCDatabaseModal
   - categories list on left
   - search + clear
   - profiles grid
   - profile detail panel (right)
   - close button (top-right)
----------------------------*/
const AISCDatabaseModal = ({ isOpen, onClose, onProfileSelect }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null); // for detail view
  const API_BASE = `${API_BASE_URL}/api/aisc`;

  useEffect(() => {
    if (!isOpen) return;
    loadCategories();
    // reset view each open
    setProfiles([]);
    setSearchTerm("");
    setSelectedCategoryId(null);
    setSelectedProfile(null);
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/tree`);
      const data = await res.json();
      setCategories(data || []);
    } catch (err) {
      console.error("Error loading categories:", err);
      setCategories([]);
    }
  };

  const loadProfilesByCategory = async (categoryId) => {
    setSelectedProfile(null);
    setSelectedCategoryId(categoryId);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/profiles/category/${categoryId}`);
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading profiles:", err);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const searchProfiles = async () => {
    const q = (searchTerm || "").trim();
    if (!q) {
      // if empty, do nothing or optionally clear
      return;
    }
    setSelectedProfile(null);
    setSelectedCategoryId(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/profiles/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error searching profiles:", err);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setProfiles([]);
    setSelectedProfile(null);
    setSelectedCategoryId(null);
  };

  const openProfileDetail = (p) => {
    setSelectedProfile(p);
    // optionally fetch more details by id if your backend supports it
    // fetch(`${API_BASE}/profiles/${p.id}`)
  };

  const selectProfile = (profile) => {
    onProfileSelect(profile);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
   <div className="bg-white w-full max-w-[1100px] h-[80vh] rounded-xl overflow-hidden shadow-xl relative flex">

        {/* LEFT: categories */}
        <div className="w-1/5 border-r p-4 overflow-y-auto bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Categories</h3>
            <button
              onClick={() => {
                setProfiles([]);
                setSelectedCategoryId(null);
                setSelectedProfile(null);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Reset
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="text-sm text-gray-500">No categories</div>
          ) : (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => loadProfilesByCategory(cat.id)}
                className={`flex items-center justify-between w-full p-3 rounded-lg mb-2 text-left transition ${
                  selectedCategoryId === cat.id
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                <span>{cat.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ))
          )}
        </div>

        {/* MIDDLE: search + profiles */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col">
          {/* header with search + close */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder='Search (e.g., "W12X22" or "HSS6X4")'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchProfiles()}
                  className="w-full pl-10 pr-24 py-2 border rounded-lg"
                />
                <div className="absolute right-2 top-2 flex gap-1">
                  <button
                    onClick={() => searchProfiles()}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md"
                    title="Search"
                  >
                    Search
                  </button>
                  <button
                    onClick={clearSearch}
                    className="px-3 py-1 bg-gray-100 rounded-md"
                    title="Clear"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="ml-3">
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X />
              </button>
            </div>
          </div>

          {/* profiles grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-10">Loading...</div>
            ) : profiles.length === 0 ? (
              <div className="text-center text-gray-600 mt-20">
                No profiles found. Select a category or search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => openProfileDetail(p)}
                    className="p-4 border rounded-xl hover:shadow-md hover:border-blue-500 cursor-pointer bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg">{p.designation || p.name}</h4>
                      <div className="text-sm text-gray-500">{p.shape_type}</div>
                    </div>

                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      {p.weight !== undefined && <div>Weight: {p.weight} lb/ft</div>}
                      {p.area !== undefined && <div>Area: {p.area} in²</div>}
                      {/* show a couple of dims if available */}
                      {p.depth && <div>Depth: {p.depth}"</div>}
                      {p.width && <div>Width: {p.width}"</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: profile detail & select */}
        <div className="w-1/3 border-l p-4 overflow-y-auto bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Profile Details</h3>
            <div></div>
          </div>

          {!selectedProfile ? (
            <div className="text-gray-500">Click any profile on the left to view details.</div>
          ) : (
            <div>
              <div className="mb-3">
                <h4 className="font-bold text-xl">{selectedProfile.designation || selectedProfile.name}</h4>
                <div className="text-sm text-gray-600">{selectedProfile.shape_type}</div>
              </div>

              <div className="space-y-2 text-sm text-gray-700 mb-4">
                {selectedProfile.weight !== undefined && <div><strong>Weight:</strong> {selectedProfile.weight} lb/ft</div>}
                {selectedProfile.area !== undefined && <div><strong>Area:</strong> {selectedProfile.area} in²</div>}
                {selectedProfile.Ix !== undefined && <div><strong>Ix:</strong> {selectedProfile.Ix}</div>}
                {selectedProfile.Iy !== undefined && <div><strong>Iy:</strong> {selectedProfile.Iy}</div>}
                {selectedProfile.Zx !== undefined && <div><strong>Zx:</strong> {selectedProfile.Zx}</div>}
                {selectedProfile.Zy !== undefined && <div><strong>Zy:</strong> {selectedProfile.Zy}</div>}
                {selectedProfile.Sx !== undefined && <div><strong>Sx:</strong> {selectedProfile.Sx}</div>}
                {selectedProfile.Sy !== undefined && <div><strong>Sy:</strong> {selectedProfile.Sy}</div>}
                {selectedProfile.rx !== undefined && <div><strong>rx:</strong> {selectedProfile.rx}</div>}
                {selectedProfile.thickness !== undefined && <div><strong>t:</strong> {selectedProfile.thickness}</div>}
                {selectedProfile.material_grade && <div><strong>Material Grade:</strong> {selectedProfile.material_grade}</div>}
                {/* If your backend stores properties_json object, show it */}
                {selectedProfile.properties_json && (
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Properties JSON:</strong>
                    <pre className="max-h-48 overflow-auto text-xs bg-gray-50 p-2 rounded">{JSON.stringify(selectedProfile.properties_json, null, 2)}</pre>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => selectProfile(selectedProfile)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Select Profile
                </button>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="px-4 py-2 bg-gray-100 rounded-lg"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------------------
   GeneralStringerSettings
   - opens AISC modal for nsMaterial or nsMaterialGrade
----------------------------*/
const GeneralStringerSettings = ({ formData, handleChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [activeField, setActiveField] = useState(null);

  const openDatabase = (field) => {
    setActiveField(field);
    setShowModal(true);
  };

  const onProfileSelect = (profile) => {
    // primary stringer profile / designation
    const material = profile.designation || profile.name || "";
    const grade = profile.material_grade || profile.properties_json?.materialGrade || "A992";

    if (activeField === "nsMaterial") {
      handleChange({
        target: { name: "nsMaterial", value: material },
      });
    } else if (activeField === "nsMaterialGrade") {
      handleChange({
        target: { name: "nsMaterialGrade", value: grade },
      });
    }

    // close modal
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">General Stringer Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NS Material */}
        <div>
          <label className="block font-medium mb-1">NS Material</label>
          <div className="relative">
            <input
              type="text"
              name="nsMaterial"
              value={formData.nsMaterial || ""}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg pr-12"
              placeholder="Choose AISC profile..."
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2"
              onClick={() => openDatabase("nsMaterial")}
              title="Open AISC Database"
            >
              <Database className="text-gray-600 hover:text-blue-600" />
            </button>
          </div>
        </div>

        {/* NS Material Grade */}
        <div>
          <label className="block font-medium mb-1">NS Material Grade</label>
          <div className="relative">
            <input
              type="text"
              name="nsMaterialGrade"
              value={formData.nsMaterialGrade || ""}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg pr-12"
              placeholder="Auto from selected profile"
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2"
              onClick={() => openDatabase("nsMaterialGrade")}
              title="Open AISC Database"
            >
              <Database className="text-gray-600 hover:text-blue-600" />
            </button>
          </div>
        </div>

        {/* Surface Finish */}
        <div>
          <label className="block font-medium mb-1">Surface Finish</label>
          <select
            name="surfaceFinish"
            value={formData.surfaceFinish || ""}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          >
            <option value="">Select Finish</option>
            <option value="Mill Finish">Mill Finish</option>
            <option value="Painted">Painted</option>
            <option value="Galvanized">Galvanized</option>
          </select>
        </div>

        {/* NS Stringer Length */}
        <div>
          <label className="block font-medium mb-1">NS Stringer Length on BOM</label>
          <input
            type="text"
            name="nsStringerLength"
            value={formData.nsStringerLength || ""}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          />
        </div>
      </div>

      {/* toggles */}
      <div className="space-y-4 pt-4 border-t">
        {[
          ["shopAssembled", "Shop Assembled"],
          ["attachSupportsToTread", "Attach supports to tread"],
          ["addCNCMarks", "Add CNC marks to stringer"],
        ].map(([name, label]) => (
          <label key={name} className="flex items-center justify-between">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={formData[name] || false}
              onChange={(e) =>
                handleChange({
                  target: { name, value: e.target.checked },
                })
              }
            />
          </label>
        ))}
      </div>

      {/* AISC modal */}
      <AISCDatabaseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onProfileSelect={onProfileSelect}
      />
    </div>
  );
};

export default GeneralStringerSettings;
