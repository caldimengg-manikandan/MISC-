/**
 * stairs.validation.js
 * 
 * INPUT VALIDATION LAYER
 */

function validateStairInput(input) {
  const fields = ['riseIn', 'runIn', 'totalHeightFt', 'widthFt'];
  
  fields.forEach(field => {
    const val = Number(input[field]);
    if (input[field] === undefined || input[field] === null || isNaN(val) || val <= 0) {
      throw new Error(`${field} must be a valid number greater than zero.`);
    }
  });

  const extents = ['extBotNS', 'extBotFS', 'extTopNS', 'extTopFS'];
  extents.forEach(ext => {
    if (input[ext] !== undefined && Number(input[ext]) < 0) {
      throw new Error(`${ext} cannot be negative.`);
    }
  });

  return true;
}

module.exports = {
  validateStairInput
};
