import React from 'react';
import { Calculator } from 'lucide-react';
import StairVisualization2D from '../StairVisualization2D';
import StairGeometrySection from '../StairGeometrySection'; 
const DimensionsSection = ({
  formData,
  handleChange,
  calculatedValues,
}) => {
  return (
    <div className="space-y-8">
      {/* Interactive Stair Geometry Calculator */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-purple-600" />
          Interactive Stair Geometry Calculator
        </h3>

        <StairVisualization2D
          horizontalDistance={formData.nosingToNosingHorizontal ? parseFloat(formData.nosingToNosingHorizontal) : undefined}
          verticalDistance={formData.nosingToNosingVertical ? parseFloat(formData.nosingToNosingVertical) : undefined}
          numberOfRisers={formData.numberOfRisers ? parseInt(formData.numberOfRisers) : undefined}
          stairWidth={formData.stairWidth ? parseFloat(formData.stairWidth) : undefined}
          onDimensionChange={(newDimensions) => {
            if (newDimensions.horizontal !== undefined) {
              handleChange({ target: { name: 'nosingToNosingHorizontal', value: newDimensions.horizontal.toString() } });
            }
            if (newDimensions.vertical !== undefined) {
              handleChange({ target: { name: 'nosingToNosingVertical', value: newDimensions.vertical.toString() } });
            }
            if (newDimensions.risers !== undefined) {
              handleChange({ target: { name: 'numberOfRisers', value: newDimensions.risers.toString() } });
            }
            if (newDimensions.width !== undefined) {
              handleChange({ target: { name: 'stairWidth', value: newDimensions.width.toString() } });
            }
          }}
        />
      </div>
    </div>
  );
};

export default DimensionsSection;