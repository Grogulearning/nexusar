const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  try {
    const dataPath = path.join('/tmp', 'experiences.json');
    
    if (!fs.existsSync(dataPath)) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([])
      };
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const experiences = JSON.parse(rawData);

    // Filtrar solo públicas
    const publicExperiences = experiences.filter(exp => exp.public !== false);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publicExperiences)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
