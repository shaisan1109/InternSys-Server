const cisTpController = (app, options, done) => {
    app.post("/log", async (request) => {
        const {
            docId,
            uploaderId
        } = request.body;
        
        return app.pg.transact(async (client) => {
            const createLog = await client.query(`
                INSERT INTO public.cis_tp_log (document_id, uploader_id)
                VALUES (${docId}, ${uploaderId})
            `);
            return createLog;
        });
    });

    app.patch("/log/:id/student", async (request) => {
        const { id } = request.params;
        const { studentId } = request.body;

        return app.pg.transact(async (client) => {
            const updateLog = await client.query(`
                UPDATE public.cis_tp_log
                SET student_id = ${studentId}
                WHERE document_id = ${id}
            `);
            return updateLog;
        });
    });

    done();
};

export default cisTpController;