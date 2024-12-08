const projectController = (app, options, done) => {
    // GET all projects by a supervisor
    app.get('/hte-projects/by-supervisor/:id', async (request) => {
        const client = await app.pg.connect();
        const projectResult = await client.query(`SELECT * FROM public.hte_projects WHERE supervisor_id=${request.params.id}`);

        client.release();

        return projectResult.rows;
    });

    // GET project by id
    app.get('/hte-project/:id', async (request) => {
        const client = await app.pg.connect();
        const projectResult = await client.query(`SELECT * FROM public.hte_projects WHERE project_id=${request.params.id}`);

        client.release();

        return projectResult.rows;
    });

    // DELETE project by id
    app.delete('/hte-project/:id', async (request) => {
        const { id } = request.params;
        const idNumber = Number(id);

        return app.pg.transact(async (client) => {
            const deleteProj = await client.query(`
                DELETE FROM public.hte_projects
                WHERE project_id = ${idNumber}
            `);
            return deleteProj;
        });
    });

    // CREATE a project
    app.post('/hte-project/create', async (request) => {
        const {
            supervisor_id,
            title,
            objective,
            description,
            overtime,
            special_proj,
            special_proj_hours,
            type
        } = request.body;
        
        return app.pg.transact(async (client) => {
            const createLink = await client.query(`
                INSERT INTO public.hte_projects (supervisor_id, title, objectives, description, overtime, special_proj, special_proj_hours, proj_type)
                VALUES (${supervisor_id}, '${title}', '${objective}', '${description}', ${overtime}, ${special_proj}, ${special_proj_hours}, $1)
            `, [type]);
            return createLink;
        });
    });

    done();
};

export default projectController;