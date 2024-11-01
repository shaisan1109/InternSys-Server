const coordController = (app, options, done) => {
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

        return reqsResult.rows[0].count;
    });

    done();
}

export default coordController;