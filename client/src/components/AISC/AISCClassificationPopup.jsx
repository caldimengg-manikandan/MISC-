import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Edit, Trash2, Database, ChevronRight, ChevronDown, Folder, File } from 'lucide-react';

const AISCClassificationPopup = ({ onClose }) => {
  const [treeData, setTreeData] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [newNodeForm, setNewNodeForm] = useState({ name: '', type: 'category', parentId: null });

  // Initial tree structure
  const initialTreeData = [
    {
      id: '1',
      name: 'Steel Sections',
      type: 'category',
      meta: { displayOrder: 1, showInTree: true },
      children: [
        {
          id: '1-1',
          name: 'I / H Sections',
          type: 'category',
          meta: { family: 'W-shapes', sortOrder: 1, displayRules: 'show_as_beam' },
          children: [
            { id: '1-1-1', name: 'W Sections', type: 'family', meta: { prefix: 'W', example: 'W14x38' } },
            { id: '1-1-2', name: 'M Sections', type: 'family', meta: { prefix: 'M', example: 'M6x15' } },
            { id: '1-1-3', name: 'HP Piles', type: 'family', meta: { prefix: 'HP', example: 'HP10x42' } }
          ]
        },
        {
          id: '1-2',
          name: 'Channels',
          type: 'category',
          meta: { family: 'C-shapes', sortOrder: 2 },
          children: [
            { id: '1-2-1', name: 'C Shapes', type: 'family', meta: { prefix: 'C', example: 'C8x11.5' } },
            { id: '1-2-2', name: 'MC Shapes', type: 'family', meta: { prefix: 'MC', example: 'MC12x31' } }
          ]
        },
        {
          id: '1-3',
          name: 'Angles',
          type: 'category',
          meta: { family: 'L-shapes', sortOrder: 3 },
          children: [
            { id: '1-3-1', name: 'L Equal', type: 'family', meta: { prefix: 'L', example: 'L6x6x½' } },
            { id: '1-3-2', name: 'L Unequal', type: 'family', meta: { prefix: 'L', example: 'L7x4x½' } }
          ]
        },
        {
          id: '1-4',
          name: 'Tubes / Pipes',
          type: 'category',
          meta: { family: 'HSS', sortOrder: 4, displayRules: 'show_pipe_under_tubes' },
          children: [
            { id: '1-4-1', name: 'HSS Rectangular', type: 'family', meta: { prefix: 'HSSR', example: 'HSS8x4x1/4' } },
            { id: '1-4-2', name: 'HSS Square', type: 'family', meta: { prefix: 'HSS', example: 'HSS6x6x3/8' } },
            { id: '1-4-3', name: 'HSS Round', type: 'family', meta: { prefix: 'HSS', example: 'HSS5.5x0.25' } }
          ]
        },
        {
          id: '1-5',
          name: 'Others',
          type: 'category',
          meta: { sortOrder: 5 },
          children: [
            { id: '1-5-1', name: 'Tees', type: 'family', meta: { prefix: 'WT', example: 'WT6x25' } },
            { id: '1-5-2', name: 'Plates', type: 'family', meta: { prefix: 'PL', example: 'PL1/2x12' } },
            { id: '1-5-3', name: 'Studs', type: 'family', meta: { type: 'fastener' } },
            { id: '1-5-4', name: 'Corbels', type: 'family', meta: { type: 'connection' } },
            { id: '1-5-5', name: 'Custom Parametric Shapes', type: 'family', meta: { custom: true } }
          ]
        }
      ]
    }
  ];

  useEffect(() => {
    setTreeData(initialTreeData);
    // Expand root nodes by default
    setExpandedNodes(new Set(['1', '1-1', '1-2', '1-3', '1-4', '1-5']));
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

  const findNode = (nodes, id) => {
    for (let node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const TreeNode = ({ node, depth = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;

    return (
      <div className="select-none">
        <div 
          className={`flex items-center py-1 px-2 rounded hover:bg-gray-100 cursor-pointer ${
            isSelected ? 'bg-blue-50 border border-blue-200' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => setSelectedNode(node)}
        >
          {hasChildren && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-1 hover:bg-gray-200 rounded mr-1"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          )}
          {!hasChildren && <div className="w-5 mr-1" />}
          
          {node.type === 'category' ? (
            <Folder className="w-4 h-4 text-blue-500 mr-2" />
          ) : (
            <File className="w-4 h-4 text-green-500 mr-2" />
          )}
          
          <span className="flex-1 text-sm">
            {editingNode?.id === node.id ? (
              <input
                type="text"
                value={editingNode.name}
                onChange={(e) => setEditingNode({ ...editingNode, name: e.target.value })}
                className="w-full px-1 border rounded"
                autoFocus
                onBlur={() => setEditingNode(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Save logic here
                    setEditingNode(null);
                  }
                }}
              />
            ) : (
              node.name
            )}
          </span>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setEditingNode(node);
              }}
              className="p-1 hover:bg-blue-100 rounded text-blue-600"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                // Delete logic here
              }}
              className="p-1 hover:bg-red-100 rounded text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const NodeDetails = () => {
    if (!selectedNode) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Node Properties</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={selectedNode.name}
              onChange={(e) => {
                const updated = findNode(treeData, selectedNode.id);
                if (updated) {
                  updated.name = e.target.value;
                  setTreeData([...treeData]);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={selectedNode.type}
              onChange={(e) => {
                const updated = findNode(treeData, selectedNode.id);
                if (updated) {
                  updated.type = e.target.value;
                  setTreeData([...treeData]);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="category">Category</option>
              <option value="family">Family</option>
              <option value="subfamily">Sub-Family</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Attributes</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Family"
                value={selectedNode.meta?.family || ''}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <input
                placeholder="Sort Order"
                type="number"
                value={selectedNode.meta?.sortOrder || ''}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <input
                placeholder="Prefix"
                value={selectedNode.meta?.prefix || ''}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <input
                placeholder="Display Rules"
                value={selectedNode.meta?.displayRules || ''}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
              Save Changes
            </button>
            <button className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
              Add Child Node
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Classification Database</h2>
              <p className="text-gray-600 mt-1">Manage profile categories, families, and organization rules</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Tree View */}
          <div className="w-1/2 border-r border-gray-200 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Profile Structure</h3>
              <button className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Add Root Category
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-2 bg-white">
              {treeData.map(node => (
                <TreeNode key={node.id} node={node} />
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Classification Rules</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Categories define the main groups</li>
                <li>• Families contain specific profile types</li>
                <li>• Meta attributes control display and sorting</li>
                <li>• Display rules organize how profiles appear</li>
              </ul>
            </div>
          </div>

          {/* Right Panel - Node Details */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {selectedNode ? (
              <NodeDetails />
            ) : (
              <div className="text-center text-gray-500 py-12">
                <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a node from the tree to view and edit its properties</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Catalog Structure</h4>
              <p className="text-sm text-yellow-800">
                This classification defines how profiles are organized in the tree view, 
                including categories, sub-categories, and naming families with their meta attributes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Classification
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISCClassificationPopup;