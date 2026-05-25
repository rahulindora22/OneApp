require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth.routes');
const segmentRoutes = require('./src/routes/segment.routes');
const geoRoutes = require('./src/routes/geolocation.routes');
const leadRoutes     = require('./src/routes/lead.routes');
const campaignRoutes      = require('./src/routes/campaign.routes');
const promotionLeadRoutes       = require('./src/routes/promotion_lead.routes');
const telecallerAssignmentRoutes = require('./src/routes/telecaller_assignment.routes');
const templatesRoutes            = require('./src/routes/templates.routes');
const userRolesRoutes            = require('./src/routes/user_roles.routes');

const app = express();

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/segment', segmentRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/lead', leadRoutes);
app.use('/api/campaign', campaignRoutes);
app.use('/api/promotion-lead', promotionLeadRoutes);
app.use('/api/telecaller-assignment', telecallerAssignmentRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/user-roles', userRolesRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 8081;
  app.listen(PORT, '0.0.0.0', () => console.log(`OneApp API running on http://0.0.0.0:${PORT}`));
}

module.exports = app;
