const activePartnersController = (app, options, done) => {
    // Show (read) active partners table
    app.get('/get-all-active-partners', async () => {
        const client = await app.pg.connect();
        const activePartnerResult = await client.query('SELECT * FROM public.active_partners');

        client.release();

        return activePartnerResult.rows;
    });

    /* POSTGRES QUERY EXAMPLE

    app.get('/calc', async () => {
        const client = await app.pg.connect();
        const sumResult = await client.query<{ sum: number }>('SELECT 2 + 2 as sum');

        client.release();

        return {
            sum: sumResult.rows,
        };
    });

    */

    // Create active partner entry

    // Update active partner entry

    // Delete active partner entry

    done();
};

export default activePartnersController;