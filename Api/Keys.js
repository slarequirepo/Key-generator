// api/keys.js - Cole este arquivo na pasta /api/ do seu projeto Vercel

const ADMIN_EMAIL = "m44166327@gmail.com";

// Banco de dados simulado (em produção, use MongoDB, PostgreSQL, etc)
// Para começar, vamos usar um objeto em memória
let keysDatabase = {
  // Formato: "KEY": { userId: 123456, username: "Player", expiry: timestamp, createdBy: "email" }
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, email, key, userId, username } = req.body || {};

  // ====== GERAR KEY ======
  if (action === 'generate' && req.method === 'POST') {
    // Verifica se é o admin
    if (email !== ADMIN_EMAIL) {
      return res.status(403).json({ 
        success: false, 
        error: "Acesso negado. Apenas o admin pode gerar keys." 
      });
    }

    if (!userId || !username) {
      return res.status(400).json({ 
        success: false, 
        error: "userId e username são obrigatórios" 
      });
    }

    // Gera uma key única
    const newKey = generateKey();
    const expiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 dias

    keysDatabase[newKey] = {
      userId: parseInt(userId),
      username: username,
      expiry: expiryDate,
      createdBy: email,
      createdAt: Date.now()
    };

    return res.status(200).json({
      success: true,
      key: newKey,
      data: keysDatabase[newKey]
    });
  }

  // ====== VALIDAR KEY ======
  if (action === 'validate' && req.method === 'POST') {
    if (!key || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: "key e userId são obrigatórios" 
      });
    }

    const keyData = keysDatabase[key];

    if (!keyData) {
      return res.status(404).json({ 
        success: false, 
        error: "Key não encontrada" 
      });
    }

    // Verifica se a key pertence ao usuário
    if (keyData.userId !== parseInt(userId)) {
      return res.status(403).json({ 
        success: false, 
        error: "Esta key não pertence a você" 
      });
    }

    // Verifica se a key expirou
    if (keyData.expiry < Date.now()) {
      return res.status(410).json({ 
        success: false, 
        error: "Key expirada" 
      });
    }

    return res.status(200).json({
      success: true,
      message: "Key válida",
      data: {
        username: keyData.username,
        expiresIn: Math.floor((keyData.expiry - Date.now()) / (24 * 60 * 60 * 1000))
      }
    });
  }

  // ====== LISTAR KEYS (apenas admin) ======
  if (action === 'list' && req.method === 'POST') {
    if (email !== ADMIN_EMAIL) {
      return res.status(403).json({ 
        success: false, 
        error: "Acesso negado" 
      });
    }

    const keysList = Object.entries(keysDatabase).map(([key, data]) => ({
      key,
      username: data.username,
      userId: data.userId,
      expiry: new Date(data.expiry).toISOString(),
      isExpired: data.expiry < Date.now()
    }));

    return res.status(200).json({
      success: true,
      total: keysList.length,
      keys: keysList
    });
  }

  // ====== DELETAR KEY (apenas admin) ======
  if (action === 'delete' && req.method === 'POST') {
    if (email !== ADMIN_EMAIL) {
      return res.status(403).json({ 
        success: false, 
        error: "Acesso negado" 
      });
    }

    if (!key) {
      return res.status(400).json({ 
        success: false, 
        error: "key é obrigatória" 
      });
    }

    if (keysDatabase[key]) {
      delete keysDatabase[key];
      return res.status(200).json({
        success: true,
        message: "Key deletada com sucesso"
      });
    }

    return res.status(404).json({ 
      success: false, 
      error: "Key não encontrada" 
    });
  }

  return res.status(400).json({ 
    success: false, 
    error: "Ação inválida ou método não suportado" 
  });
}

// Função auxiliar para gerar keys
function generateKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "SF-";
  for (let i = 0; i < 16; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
    if ((i + 1) % 4 === 0 && i !== 15) {
      key += "-";
    }
  }
  return key;
        }
