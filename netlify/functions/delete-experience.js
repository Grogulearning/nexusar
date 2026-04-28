const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CLOUD_NAME = 'dc7luprai';
const API_KEY = '474818474224319';
const API_SECRET = 'y-RkFtDP_5XjiC-x5RO5rf5Ciw0';

// Extraer public_id de URL de Cloudinary
function extractPublicID(url) {
  const match = url.match(/\/v\d+\/(.+)\.\w+$/);
  return match ? match[1] : null;
}

// Eliminar archivo de Cloudinary
async function deleteFromCloudinary(publicId, resourceType = 'image') {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = crypto
    .createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
    .digest('hex');

  const formData = new URLSearchParams();
  formData.append('public_id', publicId);
  formData.append('signature', signature);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp);

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/destroy`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  return response.json();
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { id, imgURL, vidURL } = JSON.parse(event.body);

    if (!id) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'ID requerido' })
      };
    }

    // Leer experiencias
    const dataPath = path.join('/tmp', 'experiences.json');
    if (!fs.existsSync(dataPath)) {
      return { 
        statusCode: 404, 
        body: JSON.stringify({ error: 'No se encontraron experiencias' })
      };
    }

    let experiences = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Buscar y eliminar
    const index = experiences.findIndex(exp => exp.id === id);
    if (index === -1) {
      return { 
        statusCode: 404, 
        body: JSON.stringify({ error: 'Experiencia no encontrada' })
      };
    }

    const experience = experiences[index];

    // Eliminar de Cloudinary
    const results = { image: null, video: null };

    if (imgURL) {
      const imgID = extractPublicID(imgURL);
      if (imgID) {
        results.image = await deleteFromCloudinary(imgID, 'image');
      }
    }

    if (vidURL) {
      const vidID = extractPublicID(vidURL);
      if (vidID) {
        results.video = await deleteFromCloudinary(vidID, 'video');
      }
    }

    // Eliminar del JSON
    experiences.splice(index, 1);
    fs.writeFileSync(dataPath, JSON.stringify(experiences, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Experiencia y archivos eliminados',
        cloudinary: results
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
