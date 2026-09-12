// For a project that currently uses only app.json:
// copy config/with-marasil-branding.cjs and rename THIS file to app.config.js at the project root.
// If a dynamic app.config.js/ts already exists, call the helper on its final config instead.
const { withMarasilBranding } = require('./config/with-marasil-branding.cjs');
module.exports = ({ config }) => withMarasilBranding(config);
