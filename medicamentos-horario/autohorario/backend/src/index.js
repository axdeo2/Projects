const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

app.use('/api/login', require('./routes/auth'));
app.use('/api/medications', require('./routes/medications'));

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
