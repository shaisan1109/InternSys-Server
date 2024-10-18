const userController = (app, options, done) => {
    // GET all users
    app.get('/get-all-users', async () => {
        const client = await app.pg.connect();
        const usersResult = await client.query('SELECT * FROM public.user');

        client.release();

        return usersResult.rows;
    });

    // GET one user with ID
    app.post('/get-user-by-id',  async (request, reply) => {
        // Connect to db
        const client = await app.pg.connect();

        // Set query
        const { id } = request.body;
        const query = {
            text: `SELECT * FROM public.user WHERE systemId = $1`,
            values: [id] // 'email' comes from the schema
        }

        // Execute query
        const userResult = await client.query(query);
        client.release();

        return userResult.rows;
    });

    // GET user login information
    app.post('/get-login-info',  async (request, reply) => {
        // Connect to db
        const client = await app.pg.connect();

        // Set query
        const { email } = request.body;
        const query = {
            text: `SELECT email, password FROM public.user WHERE email = $1`,
            values: [email] // 'email' comes from the schema
        }

        // Execute query
        const userResult = await client.query(query);
        client.release();

        return userResult.rows;
    });

    done();
}

export default userController;