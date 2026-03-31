const app = require('./src/app');
const env = require('./src/config/env');

// Start token cleanup job
require('./src/utils/tokenCleanup');

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`PLM ECO Backend running on port ${PORT} [${env.NODE_ENV}]`);
});
