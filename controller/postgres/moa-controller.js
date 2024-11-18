const moaController = (app, options, done) => {
    // Log a MOA entry into the moa_forms table
    app.post("/add", async (request) => {
        const {
            docId,
            docName,
            docTypeId,
            docTypeName
        } = request.body;
        
        return app.pg.transact(async (client) => {
            const createRequest = await client.query(`
                INSERT INTO public.moa_forms (doc_id, doc_name, doc_type_id, doc_type_name)
                VALUES (${docId}, '${docName}', ${docTypeId} , '${docTypeName}')
            `);
            return createRequest;
        });
    });

    // Add joint form to a document
    app.patch("/add/joint-form", async (request) => {
        const { jointFormId, docId } = request.body;
        
        return app.pg.transact(async (client) => {
            const updateRequest = await client.query(`
                UPDATE public.moa_forms
                SET joint_form_id = '${jointFormId}'
                WHERE doc_id = ${docId}
            `);
            return updateRequest;
        });
    });

    // Add form 4 to a document
    app.patch("/add/form-four", async (request) => {
        const { formFourId, docId } = request.body;
        
        return app.pg.transact(async (client) => {
            const updateRequest = await client.query(`
                UPDATE public.moa_forms
                SET form_four_id = '${formFourId}'
                WHERE doc_id = ${docId}
            `);
            return updateRequest;
        });
    });

    // Retrieve doc entries for Coordinator MOA queue
    app.get("/queue/coordinator", async (request) => {
        const client = await app.pg.connect();
        const docsResult = await client.query(`SELECT * FROM public.moa_forms WHERE joint_form_id IS NULL AND doc_type_id IN (9, 10)`);

        client.release();

        return docsResult.rows;
    });

    // Retrieve doc entries for OCS MOA queue
    app.get("/queue/ocs", async (request) => {
        const client = await app.pg.connect();
        const docsResult = await client.query(`SELECT * FROM public.moa_forms WHERE joint_form_id IS NULL AND doc_type_id = 8`);

        client.release();

        return docsResult.rows;
    });

    // Retrieve doc entries for OULC unread queue
    app.get("/queue/oulc/unread", async (request) => {
        const client = await app.pg.connect();
        const docsResult = await client.query(`SELECT * FROM public.moa_forms WHERE joint_form_id IS NOT NULL AND oulc_review IS NOT TRUE`);

        client.release();

        return docsResult.rows;
    });

    // Retrieve doc entries for OULC current review queue
    app.get("/queue/oulc/current", async (request) => {
        const client = await app.pg.connect();
        const docsResult = await client.query(`SELECT * FROM public.moa_forms WHERE oulc_review IS TRUE AND oulc_cleared IS NOT TRUE`);

        client.release();

        return docsResult.rows;
    });

    // Set document to current review list
    app.patch("/set/to-review", async (request) => {
        const { docId } = request.body;
        
        return app.pg.transact(async (client) => {
            const updateRequest = await client.query(`
                UPDATE public.moa_forms
                SET oulc_review = true
                WHERE doc_id = ${docId}
            `);
            return updateRequest;
        });
    });

    // Declare document as cleared
    app.patch("/set/cleared", async (request) => {
        const { docId } = request.body;
        
        return app.pg.transact(async (client) => {
            const updateRequest = await client.query(`
                UPDATE public.moa_forms
                SET oulc_cleared = true
                WHERE doc_id = ${docId}
            `);
            return updateRequest;
        });
    });

    done();
}

export default moaController;