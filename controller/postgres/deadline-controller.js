const deadlineController = (app, options, done) => {
    // GET all pre-deployment deadlines
    app.get("/pre-deployment/all", async (request) => {
        const client = await app.pg.connect();
        const deadlineResult = await client.query(`SELECT * FROM public.predeployment_stages`);

        client.release();

        return deadlineResult.rows;
    });

    // GET only active pre-deployment deadlines
    app.get("/pre-deployment/active", async (request) => {
        const client = await app.pg.connect();
        const deadlineResult = await client.query(`SELECT * FROM public.predeployment_stages WHERE active=true`);

        client.release();

        return deadlineResult.rows;
    });

    // GET pre-deployment deadline by id
    app.get("/pre-deployment/:id", async (request) => {
        const { id } = request.params;

        const client = await app.pg.connect();
        const deadlineResult = await client.query(`SELECT * FROM public.predeployment_stages WHERE step_id = ${id}`);

        client.release();

        return deadlineResult.rows;
    });

    // UPDATE (change) pre-deployment stage name
    app.patch("/pre-deployment/edit/:id/name", async (request) => {
        const stepId = Number(request.params.id);
        const { newName } = request.body;
        
        return app.pg.transact(async (client) => {
            const newNameQuery = await client.query(`
                UPDATE public.predeployment_stages
                SET step_name = '${newName}'
                WHERE step_id = ${stepId}
            `);
            return newNameQuery;
        });
    });

    // UPDATE (change) pre-deployment stage deadline
    app.patch("/pre-deployment/edit/:id/deadline", async (request) => {
        const stepId = Number(request.params.id);
        const { newDueDate } = request.body;
        
        return app.pg.transact(async (client) => {
            const newDeadlineQuery = await client.query(`
                UPDATE public.predeployment_stages
                SET due_date = '${newDueDate}'
                WHERE step_id = ${stepId}
            `);
            return newDeadlineQuery;
        });
    });

    // UPDATE whether pre-deployment step is active or not
    app.patch("/pre-deployment/edit/:id/activity", async (request) => {
        const stepId = Number(request.params.id);
        const { newActive } = request.body;
        
        return app.pg.transact(async (client) => {
            const newActiveQuery = await client.query(`
                UPDATE public.predeployment_stages
                SET active = ${newActive}
                WHERE step_id = ${stepId}
            `);
            return newActiveQuery;
        });
    });

    done();
}

export default deadlineController;