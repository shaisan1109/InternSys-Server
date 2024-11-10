const deadlineController = (app, options, done) => {
    // GET requests by status
    app.get("/pre-deployment/all", async (request) => {
        const client = await app.pg.connect();
        const reqsResult = await client.query(`SELECT * FROM public.predeployment_stages`);

        client.release();

        return reqsResult.rows;
    });

    done();
}

export default deadlineController;