import Fastify from "fastify";

// Import Postgres
import postgres from '@fastify/postgres';

// Postgres controller imports
import activePartnersController from './controller/postgres/active-partners-controller.js';
import userController from "./controller/postgres/user-controller.js";
import ocsController from "./controller/postgres/ocs-controller.js";
import endorsementController from "./controller/postgres/endorsement-controller.js";
import deadlineController from "./controller/postgres/deadline-controller.js";
import moaController from "./controller/postgres/moa-controller.js";

// Mayan controller imports
import mayanGetController from "./controller/mayan/get-controller.js";
import mayanEditController from "./controller/mayan/edit-controller.js";
import projectController from "./controller/postgres/project-controller.js";
import cisTpController from "./controller/postgres/cis-tp-controller.js";
import notificationsController from "./controller/postgres/notifications-controller.js";

// Logging is enabled for debugging purposes
const app = Fastify({
    logger: true
});

// Register the PostgreSQL plugin to connect to the database
app.register(postgres, {
    host: 'localhost',
    port: 5432,
    database: 'dlsu_internsys',
    user: 'postgres',
    password: '1234'
});

// Postgres routes
app.register(activePartnersController, { prefix: '/api/db' });
app.register(userController, { prefix: '/api/db/users' });
app.register(ocsController, { prefix: '/api/db/ocs' });
app.register(endorsementController, { prefix: '/api/db' });
app.register(deadlineController, { prefix: '/api/db/deadlines' });
app.register(moaController, { prefix: '/api/db/moa' });
app.register(projectController, { prefix: '/api/db' });
app.register(cisTpController, { prefix: '/api/db/cis-tp' });
app.register(notificationsController, { prefix: '/api/db' });

// Mayan routes
app.register(mayanGetController, { prefix: '/api/mayan' });
app.register(mayanEditController, { prefix: '/api/mayan' });

// Listen for main server port
app.listen({ port: 8080 }, err => {
    if (err) throw err
});