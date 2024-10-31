const ocsController = (app, options, done) => {
    // GET one user with email
    app.get("/job-websites", async (request) => {
        const client = await app.pg.connect();
        const sitesResult = await client.query(`SELECT * FROM public.job_websites`);

        client.release();

        return sitesResult.rows;
    });

    done();
}

export default ocsController;