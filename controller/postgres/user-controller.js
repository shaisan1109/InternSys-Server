const userController = (app, options, done) => {
    // GET all users WITH role names
    app.get('/get-all-users', async () => {
        const client = await app.pg.connect();
        const usersResult = await client.query(`
            SELECT u.systemid, u.dlsuid, u.email, u.lastname, u.firstname, u.middlename, ur.rolename 
            FROM public.user u
            INNER JOIN public.user_roles ur ON u.roleid=ur.roleid
        `);

        client.release();

        return usersResult.rows;
    });

    // GET one user with email
    app.get("/user", async (request) => {
        const { email } = request.query;

        const client = await app.pg.connect();
        const userResult = await client.query(`SELECT * FROM public.user WHERE email=${email}`);

        client.release();

        return userResult.rows;
    });

    // GET all user types
    app.get('/user-types', async () => {
        const client = await app.pg.connect();
        const typesResult = await client.query(`SELECT * FROM public.user_roles`);

        client.release();

        return typesResult.rows;
    });

    // GET all users of one type
    app.get('/user-type/:roleid', async (request) => {
        const client = await app.pg.connect();
        const usersResult = await client.query(
            `SELECT u.systemid, u.dlsuid, u.email, u.lastname, u.firstname, u.middlename, ur.rolename 
            FROM public.user u
            INNER JOIN public.user_roles ur ON u.roleid=ur.roleid
            WHERE u.roleid=${request.params.roleid}`
        );

        client.release();

        return usersResult.rows;
    });

    done();
}

export default userController;