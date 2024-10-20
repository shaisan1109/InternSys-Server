import Fastify from "fastify";

// Import Postgres
import postgres from '@fastify/postgres';

// Postgres controller imports
import activePartnersController from './controller/postgres/active-partners-controller.js';
import userController from "./controller/postgres/user-controller.js";

// Mayan controller imports
import templatesController from "./controller/mayan/templates-controller.js";
import typesController from "./controller/mayan/types-controller.js";

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
app.register(activePartnersController, { prefix: '/api/active-partners' });
app.register(userController, { prefix: '/api/user' });
//app.register(coordController, { prefix: '/coordinator' });
//app.register(linkageController, { prefix: '/linkage-officer' });
//app.register(hteController, { prefix: '/hte' });

// Mayan routes
app.register(templatesController, { prefix: '/api/mayan/templates' });
app.register(typesController, { prefix: '/api/mayan' });

// Listen for main server port
app.listen({ port: 8080 }, err => {
    if (err) throw err
    console.log(`Server listening on ${app.server.address().port}`)
});