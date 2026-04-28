const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { name, imgURL, vidURL, viewerURL } = data;

    if (!name || !imgURL || !vidURL) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Faltan datos requeridos' })
      };
    }

    // Crear objeto de experiencia
    const experience = {
      id: Date.now().toString(),
      name,
      imgURL,
      vidURL,
      viewerURL: viewerURL || '',
      created: new Date().toISOString(),
      public: true // Por defecto todas son públicas
    };

    // Leer experiencias existentes
    const dataPath = path.join('/tmp', 'experiences.json');
    let experiences = [];
    
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      experiences = JSON.parse(rawData);
    }

    // Agregar nueva experiencia
    experiences.unshift(experience);

    // Guardar (máximo 100 experiencias)
    fs.writeFileSync(dataPath, JSON.stringify(experiences.slice(0, 100), null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        id: experience.id,
        message: 'Experiencia guardada' 
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
