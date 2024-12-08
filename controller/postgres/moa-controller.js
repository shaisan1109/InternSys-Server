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

    // GET joint_form_id of a document
    app.get("/:id/joint-form", async (request) => {
        const { id } = request.params;

        const client = await app.pg.connect();
        const reqsResult = await client.query(`SELECT joint_form_id FROM public.moa_forms WHERE doc_id='${id}'`);

        client.release();

        // Returns a number
        return reqsResult.rows[0].joint_form_id;
    });

    done();
}

export default moaController;