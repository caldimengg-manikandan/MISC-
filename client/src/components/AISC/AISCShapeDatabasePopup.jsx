import React, { useState, useEffect } from 'react';
import { X, Search, Database, ChevronRight, ChevronDown, Folder, File, Calculator, Download } from 'lucide-react';
import API_BASE_URL from '../../config/api';

const AISCShapeDatabasePopup = ({ onClose }) => {
  const [treeData, setTreeData] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ categories: 0, profiles: 0 });
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch AISC tree data
  const fetchAISCTreeData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/aisc/tree`);
      if (!response.ok) throw new Error('Failed to fetch AISC tree data');
      
      const data = await response.json();
      setTreeData(data);
      
      // Expand all nodes by default for full visibility
      const allNodeIds = getAllNodeIds(data);
      setExpandedNodes(new Set(allNodeIds));
      
      // Get statistics
      const healthResponse = await fetch('http://localhost:3002/api/aisc/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setStats({
          categories: healthData.categories,
          profiles: healthData.profiles
        });
      }
      
    } catch (err) {
      console.error('Error fetching AISC tree data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAllNodeIds = (nodes) => {
    let ids = [];
    nodes.forEach(node => {
      ids.push(node.id);
      if (node.children) {
        ids = [...ids, ...getAllNodeIds(node.children)];
      }
    });
    return ids;
  };

  // Fetch profiles for selected category
  const fetchProfiles = async (categoryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/aisc/profiles/category/${categoryId}`);
      if (!response.ok) throw new Error('Failed to fetch profiles');
      
      const data = await response.json();
      setProfiles(data);
      setSelectedProfile(null); // Clear previous selection
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  };

  // Fetch full profile details by profile id (useful if list items are partial)
// Fetch full profile details by profile id (useful if list items are partial)
const fetchProfileDetails = async (profileId) => {
  setProfileLoading(true);
  try {
    // NOTE: the server exposes the detail endpoint at /api/aisc/profiles/:id (plural)
    const response = await fetch(`${API_BASE_URL}/api/aisc/profiles/${profileId}`);
    if (!response.ok) {
      // If the endpoint 404s or errors, fall back to the profile we already have in the list
      console.warn(`Profile detail fetch returned status ${response.status}, falling back to local list`);
      const fallback = profiles.find(p => p.id === profileId);
      if (fallback) {
        setSelectedProfile(fallback);
        return fallback;
      }
      throw new Error('Profile not found on server and not present in local list');
    }

    const data = await response.json();
    // set the full profile so the right panel renders complete properties
    setSelectedProfile(data);
    return data;
  } catch (err) {
    console.error('Error fetching profile details:', err);
    const fallback = profiles.find(p => p.id === profileId);
    if (fallback) setSelectedProfile(fallback);
    return fallback || null;
  } finally {
    setProfileLoading(false);
  }
};


  useEffect(() => {
    fetchAISCTreeData();
  }, []);

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const TreeNode = ({ node, depth = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isCategory = node.type === 'category';

    return (
      <div className="select-none">
        <div 
          className={`flex items-center py-2 px-3 rounded hover:bg-gray-100 cursor-pointer transition-colors ${
            node.profileCount > 0 ? 'border-l-4 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          onClick={() => {
            if (isCategory && node.profileCount > 0) {
              fetchProfiles(node.id);
            }
          }}
        >
          {hasChildren && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-1 hover:bg-gray-200 rounded mr-2 transition-colors"
            >
              {isExpanded ? 
                <ChevronDown className="w-4 h-4 text-gray-600" /> : 
                <ChevronRight className="w-4 h-4 text-gray-600" />
              }
            </button>
          )}
          {!hasChildren && <div className="w-6 mr-2" />}
          
          {isCategory ? (
            <Folder className="w-5 h-5 text-blue-500 mr-3" />
          ) : (
            <File className="w-5 h-5 text-green-500 mr-3" />
          )}
          
          <span className="flex-1 text-sm font-medium text-gray-900">{node.name}</span>
          
          {node.profileCount > 0 && (
            <span className="text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded-full min-w-8 text-center">
              {node.profileCount}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4 border-l border-gray-200">
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const ProfileDetails = () => {
    if (!selectedProfile) return null;

    // Safe access to nested properties
    const dimensions = selectedProfile.dimensions || {};
    const sectionProperties = selectedProfile.sectionProperties || {};
    const allProperties = selectedProfile.allProperties || {};

    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProfile.name}</h2>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                  {selectedProfile.category || 'N/A'}
                </span>
                {selectedProfile.hssType && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                    {selectedProfile.hssType}
                  </span>
                )}
                {selectedProfile.materialGrade && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                    {selectedProfile.materialGrade}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{selectedProfile.weight || 'N/A'} lb/ft</div>
              <div className="text-sm text-gray-600">Weight</div>
            </div>
          </div>
        </div>

        {profileLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Main Properties Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {/* Dimensions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Dimensions
                </h3>
                <div className="space-y-3">
                  {dimensions.height && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Height (Ht):</span>
                      <span className="font-semibold text-gray-900">{dimensions.height}"</span>
                    </div>
                  )}
                  {dimensions.width && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Width (B):</span>
                      <span className="font-semibold text-gray-900">{dimensions.width}"</span>
                    </div>
                  )}
                  {dimensions.depth && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Depth (d):</span>
                      <span className="font-semibold text-gray-900">{dimensions.depth}"</span>
                    </div>
                  )}
                  {dimensions.od && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">OD:</span>
                      <span className="font-semibold text-gray-900">{dimensions.od}"</span>
                    </div>
                  )}
                  {dimensions.thickness && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Thickness (tdes):</span>
                      <span className="font-semibold text-gray-900">{dimensions.thickness}"</span>
                    </div>
                  )}
                  {dimensions.nominalThickness && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Nominal Thickness (tnom):</span>
                      <span className="font-semibold text-gray-900">{dimensions.nominalThickness}"</span>
                    </div>
                  )}
                  {Object.keys(dimensions).length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No dimension data available
                    </div>
                  )}
                </div>
              </div>

              {/* Section Properties */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Section Properties
                </h3>
                <div className="space-y-3">
                  {sectionProperties.Ix && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Ix:</span>
                      <span className="font-semibold text-gray-900">{sectionProperties.Ix} in⁴</span>
                    </div>
                  )}
                  {sectionProperties.Iy && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Iy:</span>
                      <span className="font-semibold text-gray-900">{sectionProperties.Iy} in⁴</span>
                    </div>
                  )}
                  {sectionProperties.Zx && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Zx:</span>
                      <span className="font-semibold text-gray-900">{sectionProperties.Zx} in³</span>
                    </div>
                  )}
                  {sectionProperties.Zy && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Zy:</span>
                      <span className="font-semibold text-gray-900">{sectionProperties.Zy} in³</span>
                    </div>
                  )}
                  {sectionProperties.Sx && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Sx:</span>
                      <span className="font-semibold text-gray-900">{sectionProperties.Sx} in³</span>
                    </div>
                  )}
                  {sectionProperties.Sy && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Sy:</span>
                      <span className="font-semibold text-gray-900">{sectionProperties.Sy} in³</span>
                    </div>
                  )}
                  {Object.keys(sectionProperties).length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No section properties available
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Properties */}
    <div className="bg-white rounded-xl border border-gray-200 p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
    Additional Properties
  </h3>
  <div className="space-y-3">
    {selectedProfile.area && (
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-gray-600">Area (A):</span>
        <span className="font-semibold text-gray-900">{selectedProfile.area} in²</span>
      </div>
    )}
    {sectionProperties.rx && (
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-gray-600">rx:</span>
        <span className="font-semibold text-gray-900">{sectionProperties.rx} in</span>
      </div>
    )}
    {sectionProperties.ry && (
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-gray-600">ry:</span>
        <span className="font-semibold text-gray-900">{sectionProperties.ry} in</span>
      </div>
    )}
                 
                  {!selectedProfile.area && Object.keys(sectionProperties).length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No additional properties available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold">
                <Calculator className="w-5 h-5" />
                Calculate Load Capacity
              </button>
              <button className="flex items-center gap-3 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold">
                <Download className="w-5 h-5" />
                Export to CAD
              </button>
              <button className="flex items-center gap-3 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold">
                Add to Project
              </button>
            </div>

            {/* Raw Properties (Collapsible) */}
            {Object.keys(allProperties).length > 0 && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                <details>
                  <summary className="cursor-pointer text-lg font-semibold text-gray-900 mb-4">
                    All Properties
                  </summary>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                    {Object.entries(allProperties).map(([key, value]) => (
                      <div key={key} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="text-sm font-medium text-gray-500">{key}</div>
                        <div className="text-lg font-semibold text-gray-900">{value}</div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-2xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">AISC Shape Database</h2>
              <p className="text-gray-600 mt-1 text-lg">
                {stats.categories} categories • {stats.profiles} profiles
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Tree View */}
          <div className="w-80 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50">
            <div className="mb-6">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search profiles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Shape Categories</h3>
              {treeData.map(node => (
                <TreeNode key={node.id} node={node} />
              ))}
            </div>
          </div>

          {/* Middle Panel - Profile List */}
          <div className="w-96 border-r border-gray-200 p-6 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">Profiles</h3>
            {profiles.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <File className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a category to view profiles</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profiles.map(profile => (
                  <div
                    key={profile.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedProfile?.id === profile.id 
                        ? 'bg-blue-50 border-blue-500 shadow-md' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => fetchProfileDetails(profile.id)} // CHANGED THIS LINE
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-gray-900 text-lg">{profile.name}</div>
                      <div className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {profile.weight} lb/ft
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {profile.dimensions?.height && profile.dimensions?.width && (
                        <div>{profile.dimensions.height}" × {profile.dimensions.width}"</div>
                      )}
                      {profile.area && <div>Area: {profile.area} in²</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Profile Details (Full Width) */}
          <div className="flex-1 p-8 overflow-y-auto bg-white">
            {selectedProfile ? (
              <ProfileDetails />
            ) : (
              <div className="text-center text-gray-500 py-20">
                <File className="w-24 h-24 mx-auto mb-6 text-gray-300" />
                <h3 className="text-2xl font-semibold text-gray-400 mb-2">No Profile Selected</h3>
                <p className="text-lg">Select a profile from the list to view detailed properties</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISCShapeDatabasePopup;