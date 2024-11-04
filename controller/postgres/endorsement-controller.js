const endorsementController = (app, options, done) => {
    // GET requests by status
    app.get("/endorsement-requests", async (request) => {
        const { status } = request.query;

        const client = await app.pg.connect();
        const reqsResult = await client.query(`SELECT * FROM public.endorsement_requests WHERE status='${status}'`);

        client.release();

        return reqsResult.rows;
    });

    // GET number of requests with status
    app.get("/endorsement-requests/count", async (request) => {
        const { status } = request.query;

        const client = await app.pg.connect();
        const reqsResult = await client.query(`SELECT COUNT(request_id) FROM public.endorsement_requests WHERE status='${status}'`);

        client.release();

        return reqsResult.rows;
    });

    // GET endorsement requests by student (for student history)
    app.get("/endorsement-requests/:studentid", async (request) => {
        const { studentid } = request.params;

        const client = await app.pg.connect();
        const reqsResult = await client.query(`SELECT * FROM public.endorsement_requests WHERE student_id='${studentid}'`);

        client.release();

        return reqsResult.rows;
    });

    // CREATE an HTE endorsement request
    app.post("/endorsement-request/create/hte", async (request) => {
        const {
            studentId,
            studentName,
            studentCourse,
            addresseeName,
            addresseePosition,
            companyName,
            companyAddress
        } = request.body;
        
        return app.pg.transact(async (client) => {
            const createRequest = await client.query(`
                INSERT INTO public.endorsement_requests (request_type, student_id, student_name, student_course, addressee_name, addressee_position, company_name, company_address, status)
                VALUES ('HTE', '${studentId}', '${studentName}' , '${studentCourse}', '${addresseeName}', '${addresseePosition}', '${companyName}', '${companyAddress}', 'Queued')
            `);
            return createRequest;
        });
    });

    // CREATE an HSO endorsement request
    app.post("/endorsement-request/create/hso", async (request) => {
        const {
            studentId,
            studentName,
            studentCourse,
            companyName
        } = request.body;
        
        return app.pg.transact(async (client) => {
            const createRequest = await client.query(`
                INSERT INTO public.endorsement_requests (request_type, student_id, student_name, student_course, company_name, status)
                VALUES ('HSO', '${studentId}', '${studentName}' , '${studentCourse}', '${companyName}', 'Queued')
            `);
            return createRequest;
        });
    });

    // REJECT an endorsement request
    app.post("/endorsement-request/reject/:id", async (request) => {
        const requestId = Number(request.params.id);
        const { rejectionReason } = request.body;
        
        return app.pg.transact(async (client) => {
            const rejectRequest = await client.query(`
                UPDATE public.endorsement_requests
                SET status = 'Rejected', rejection_reason = '${rejectionReason}'
                WHERE request_id = ${requestId}
            `);
            return rejectRequest;
        });
    });

    // APPROVE an endorsement request
    app.post("/endorsement-request/approve/:id", async (request) => {
        const requestId = Number(request.params.id);
        
        return app.pg.transact(async (client) => {
            const approveRequest = await client.query(`
                UPDATE public.endorsement_requests
                SET status = 'Approved'
                WHERE request_id = ${requestId}
            `);
            return approveRequest;
        });
    });

    done();
}

export default endorsementController;