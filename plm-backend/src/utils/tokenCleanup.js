const pool = require('../config/db');

async function cleanupExpiredTokens() {
  try {
    const result = await pool.query(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
    );
    if (result.rowCount > 0) {
      console.log(`[TokenCleanup] Removed ${result.rowCount} expired refresh tokens`);
    }
  } catch (err) {
    console.error('[TokenCleanup] Error:', err.message);
  }
}

// Run every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

// Run once on startup
cleanupExpiredTokens();

module.exports = { cleanupExpiredTokens };
