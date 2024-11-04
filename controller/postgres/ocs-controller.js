const ocsController = (app, options, done) => {
    // GET all job websites
    app.get("/job-websites", async () => {
        const client = await app.pg.connect();
        const sitesResult = await client.query(`SELECT * FROM public.job_websites`);

        client.release();

        return sitesResult.rows;
    });

    // CREATE a job website
    app.post("/job-website/create", async (request) => {
        const { title, desc, link } = request.body;
        
        return app.pg.transact(async (client) => {
            const createLink = await client.query(`
                INSERT INTO public.job_websites (title, description, link)
                VALUES ('${title}', '${desc}', '${link}')
            `);      
            return createLink;
        });
    });

    // UPDATE a job website (working)
    app.patch("/job-website/update/:id", async (request) => {
        const { id } = request.params;
        const { title, desc, link } = request.body;
        
        return app.pg.transact(async (client) => {
            const updateLink = await client.query(`
                UPDATE public.job_websites
                SET title = '${title}', description = '${desc}', link = '${link}'
                WHERE websiteid = ${id}
            `);
            return updateLink;
        });
    });

    // DELETE a job website (working)
    app.delete("/job-website/delete/:id", async (request) => {
        const { id } = request.params;
        const idNumber = Number(id);

        return app.pg.transact(async (client) => {
            const deleteLink = await client.query(`
                DELETE FROM public.job_websites
                WHERE websiteid = ${idNumber}
            `);
            return deleteLink;
        });
    });

    done();
}

export default ocsController;