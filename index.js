import Fastify from "fastify";
import cors from "@fastify/cors";
// import multipart from "@fastify/multipart";
import fastifyMultipart from "@fastify/multipart";

// Import Postgres
import postgres from '@fastify/postgres';

// Postgres controller imports
import activePartnersController from './controller/postgres/active-partners-controller.js';
import userController from "./controller/postgres/user-controller.js";
import ocsController from "./controller/postgres/ocs-controller.js";
import endorsementController from "./controller/postgres/endorsement-controller.js";
import deadlineController from "./controller/postgres/deadline-controller.js";
import moaController from "./controller/postgres/moa-controller.js";
import linkageOfficerController from './controller/postgres/linkage-controller.js';
import StudentController from './controller/postgres/student-controller.js';
import HteSupervisorController from './controller/postgres/hte-supervisor-controller.js';
import CoordinatorController from './controller/postgres/coordinator-controller.js';

// Mayan controller imports
import mayanGetController from "./controller/mayan/get-controller.js";
import mayanEditController from "./controller/mayan/edit-controller.js";
import projectController from "./controller/postgres/project-controller.js";
import cisTpController from "./controller/postgres/cis-tp-controller.js";
import notificationsController from "./controller/postgres/notifications-controller.js";
import coordinatorController from "./controller/postgres/coordinator-controller.js";

// Email controller imports
import emailController from "./controller/email/email-controller.js";


// Logging is enabled for debugging purposes
const app = Fastify({
    logger: true
});

app.register(cors, {
    // origin: "http://localhost:4200", // Allow only frontend requests
   origin: [
        "http://localhost:4200",    // Angular dev server
        "http://ccscloud.dlsu.edu.ph:31602"  // Production domain
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
});

// Register the PostgreSQL plugin to connect to the database
app.register(postgres, {
    host: 'localhost',
    //port: 5432,
    port: 31603,
    database: 'dlsu_internsys',
    user: 'intersys_user',
    password: 'DLSU1234!'
});


// Register multipart plugin
// app.register(multipart); 
// app.register(fastifyMultipart);
app.register(fastifyMultipart, {
    attachFieldsToBody: true,  // ✅ Ensure fields are parsed
    limits: { fileSize: 10 * 1024 * 1024 } // ✅ 10MB file limit
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
app.register(linkageOfficerController, { prefix: '/api/db/linkage' });
app.register(StudentController, { prefix: '/api/db/student' });
app.register(HteSupervisorController, { prefix: '/api/db/hte-supervisor' });
app.register(CoordinatorController, { prefix: '/api/db/coordinator' });

// Mayan routes
app.register(mayanGetController, { prefix: '/api/mayan' });
app.register(mayanEditController, { prefix: '/api/mayan' });

// Ensure this line is present:
app.register(emailController, { prefix: '/api/email' });

// Listen for main server port
app.listen({ port: 8080 }, err => {
    if (err) throw err
});
