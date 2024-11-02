const endorsementController = (app, options, done) => {
    // GET requests by status
    app.get("/", async (request) => {
        const { status } = request.query;

        const client = await app.pg.connect();
        const reqsResult = await client.query(`SELECT * FROM public.endorsement_requests WHERE status='${status}'`);

        client.release();

        return reqsResult.rows;
    });

    // GET number of requests with status
    app.get("/count", async (request) => {
        const { status } = request.query;

        const client = await app.pg.connect();
        const reqsResult = await client.query(`SELECT COUNT(request_id) FROM public.endorsement_requests WHERE status='${status}'`);

        client.release();

        return Number(reqsResult.rows[0].count);
    });

    // GET endorsement requests by student (for student history)
    app.get("/:studentid", async (request) => {
        const { studentid } = request.params;

        const client = await app.pg.connect();
        const reqsResult = await client.query(`SELECT * FROM public.endorsement_requests WHERE student_id='${studentid}'`);

        client.release();

        return reqsResult.rows;
    });

    done();
}

export default endorsementController;