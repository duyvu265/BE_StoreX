// config/tokenConfig.js
export const getTokenConfig = () => {
  return {
    // Access Token - mặc định 15 phút nếu không có trong env
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    
    // Refresh Token - mặc định 7 ngày nếu không có trong env
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    
    // JWT Secrets
    jwtSecret: process.env.JWT_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    
    // Tùy chọn bổ sung
    issuer: process.env.JWT_ISSUER || 'StoreX',
    audience: process.env.JWT_AUDIENCE || 'StoreX-Users'
  };
};

// Function để convert time string sang milliseconds cho database
export const parseTimeToMs = (timeString) => {
  if (!timeString) return null;
  
  const timeRegex = /^(\d+)([smhdMwy])$/;
  const match = timeString.match(timeRegex);
  
  if (!match) {
    console.warn(`Invalid time format: ${timeString}, using default`);
    return 7 * 24 * 60 * 60 * 1000; // 7 ngày mặc định
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers = {
    's': 1000,                    // seconds
    'm': 1000 * 60,              // minutes
    'h': 1000 * 60 * 60,         // hours
    'd': 1000 * 60 * 60 * 24,    // days
    'w': 1000 * 60 * 60 * 24 * 7, // weeks
    'M': 1000 * 60 * 60 * 24 * 30, // months (30 days)
    'y': 1000 * 60 * 60 * 24 * 365 // years (365 days)
  };
  
  return value * multipliers[unit];
};

// Validate token configuration
export const validateTokenConfig = () => {
  const config = getTokenConfig();
  
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is required in environment variables');
  }
  
  // Validate time formats
  const timeRegex = /^(\d+)([smhdMwy])$/;
  
  if (!timeRegex.test(config.accessTokenExpiry)) {
    console.warn(`Invalid ACCESS_TOKEN_EXPIRY format: ${config.accessTokenExpiry}, using default`);
  }
  
  if (!timeRegex.test(config.refreshTokenExpiry)) {
    console.warn(`Invalid REFRESH_TOKEN_EXPIRY format: ${config.refreshTokenExpiry}, using default`);
  }
  
  return config;
};