import jwt from 'jsonwebtoken';

const userController = (app, options, done) => {
    const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key'; // Secure your secret key

    // GET all users WITH role names
    app.get('/get-all-users', async () => {
        const client = await app.pg.connect();
        const usersResult = await client.query(`
            SELECT u.systemid, u.dlsuid, u.email, u.lastname, u.firstname, u.middlename, 
                ur.rolename, u.roleid, u.password, u.linkageset, 
                lo.position, lo.rank, s.deployed 
            FROM public.user u
            LEFT JOIN public.lo_info lo ON u.dlsuid = lo.dlsuid
            LEFT JOIN public.student_info s ON u.dlsuid = s.studentid
            INNER JOIN public.user_roles ur ON u.roleid = ur.roleid;
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

    // GET all UNDEPLOYED students
    app.get('/undeployed-students', async (request) => {
        const client = await app.pg.connect();
        const usersResult = await client.query(
            `SELECT u.dlsuid, u.lastname, u.firstname, u.middlename
            FROM public.user u
            INNER JOIN public.student_info s ON u.dlsuid=s.studentid
            WHERE u.roleid = 1 AND s.deployed=false`
        );

        client.release();

        return usersResult.rows;
    });

    /** ✅ Create a New User */
    app.post('/create-user', async (request, reply) => {
        const client = await app.pg.connect();
        try {
            const { dlsuid, roleid, lastname, firstname, middlename, email, password, position, rank } = request.body;

            // 🔹 Validate Required Fields
            if (!dlsuid || !roleid || !lastname || !firstname || !email || !password) {
                return reply.status(400).send({ error: "Missing required fields." });
            }

            // 🔹 Hash Password using pgcrypto
            const query = `
                INSERT INTO public.user (dlsuid, roleid, lastname, firstname, middlename, email, password, linkageset)
                VALUES ($1, $2, $3, $4, $5, $6, crypt($7, gen_salt('bf')), False)
                RETURNING systemid;
            `;

            const { rows } = await client.query(query, [dlsuid, roleid, lastname, firstname, middlename, email, password]);

            // 🔹 If the user is a **student (roleid = 1)**, insert into `student_info`
            if (roleid === 1) {
                const studentQuery = `
                    INSERT INTO public.student_info (studentid, deployed, workhours, companyid, deploymentstart, deploymentend, linkageofficerid, currentsection, degree, hte_supervisor_id, grade_lo, grade_company)
                    VALUES ($1, TRUE, 486, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
                `;
                await client.query(studentQuery, [dlsuid]);
            }

            // If user is a Linkage Officer, insert into lo_info
            if (roleid === 3) {
                const loQuery = `INSERT INTO public.lo_info (dlsuid, position, rank) VALUES ($1, $2, $3);`;
                await client.query(loQuery, [dlsuid, position, rank]);
            }

            await client.query('COMMIT'); // Commit transaction

            return reply.status(201).send({ message: "User created successfully!", systemid: rows[0].systemid });

        } catch (error) {
            console.error('❌ Error creating user:', error);
            return reply.status(500).send({ error: 'Failed to create user.' });
        }
    });

    // ✅ LOGIN Route - Authenticate User and Generate Token
    app.post('/login', async (request, reply) => {
        const { email, password } = request.body;

        if (!email || !password) {
            return reply.status(400).send({ error: "Missing email or password" });
        }

        const client = await app.pg.connect(); // Get a PostgreSQL connection
        try {
            // Check if the user exists
            const userQuery = `SELECT * FROM public.user WHERE email = $1`;
            const result = await client.query(userQuery, [email]);

            if (result.rows.length === 0) {
                return reply.status(401).send({ message: 'Invalid email or password' });
            }

            const user = result.rows[0];

            // ✅ Verify Password using pgcrypto
            const passwordCheckQuery = `
                SELECT email FROM public.user 
                WHERE email = $1 AND password = crypt($2, password)
            `;
            const passwordCheck = await client.query(passwordCheckQuery, [email, password]);

            if (passwordCheck.rows.length === 0) {
                return reply.status(401).send({ message: 'Invalid email or password' });
            }

            // ✅ Generate JWT Token
            const token = jwt.sign(
                { userId: user.systemid, roleId: user.roleid },
                SECRET_KEY,
                { expiresIn: '1h' }
            );

            return reply.send({
                token,
                user: {
                    firstname: user.firstname,
                    lastname: user.lastname,
                    roleid: user.roleid,
                    dlsuid: user.dlsuid,
                    systemid: user.systemid
                }
            });

        } catch (err) {
            console.error('❌ Error during login:', err);
            return reply.status(500).send({ message: 'Server error' });
        } finally {
            client.release(); // Release the PostgreSQL client
        }
    });


   // Update User Information (For Admins only in manage users page)
    app.put('/update-user/:systemid', async (request, reply) => {
        const { systemid } = request.params;
        const { lastname, firstname, middlename, dlsuid, roleid, email, password, position, rank } = request.body;
        
        let client;

        try {
            if (!lastname || !firstname) {
                return reply.status(400).send({ error: "Missing required fields." });
            }

            client = await app.pg.connect();
            await client.query('BEGIN'); // Start Transaction

            // 🔹 Update user info
            let updateQuery = `
                UPDATE public.user
                SET lastname = $1, firstname = $2, middlename = $3, dlsuid = $4, roleid = $5
                WHERE systemid = $6 RETURNING *;
            `;
            let params = [lastname, firstname, middlename, dlsuid, roleid, systemid];

            if (password) {
                updateQuery = `
                    UPDATE public.user
                    SET lastname = $1, firstname = $2, middlename = $3, dlsuid = $4, roleid = $5, password = crypt($6, gen_salt('bf'))
                    WHERE systemid = $7 RETURNING *;
                `;
                params = [lastname, firstname, middlename, dlsuid, roleid, password, systemid];
            }

            const userResult = await client.query(updateQuery, params);
            if (userResult.rowCount === 0) {
                return reply.status(404).send({ error: "User  not found." });
            }

            // 🔹 If role is Linkage Officer, upsert `lo_info`
            if ([2, 3].includes(roleid)) {
                const loUpsertQuery = `
                    INSERT INTO public.lo_info (dlsuid, position, rank)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (dlsuid) DO UPDATE
                    SET position = EXCLUDED.position, rank = EXCLUDED.rank;
                `;
                await client.query(loUpsertQuery, [dlsuid, position, rank]);
            }

            await client.query('COMMIT'); // Commit Transaction

            return reply.status(200).send({ message: "User  updated successfully!" });

        } catch (error) {
            console.error('❌ Error updating user:', error);
            if (client) {
                await client.query('ROLLBACK'); // Rollback Transaction if client is defined
            }
            return reply.status(500).send({ error: "Failed to update user." });
        } finally {
            if (client) {
                client.release(); // Only release if client is defined
            }
        }
    });

    // update user information (for general users)
    app.put('/update-profile/:dlsuid', async (request, reply) => {
        const { dlsuid } = request.params;
        const { lastname, firstname, middlename, roleid, position, rank } = request.body;
        
        let client;
    
        try {
            if (!lastname || !firstname) {
                return reply.status(400).send({ error: "Missing required fields." });
            }
    
            client = await app.pg.connect();
            await client.query('BEGIN'); // Start Transaction
    
            // Update basic user info
            const updateQuery = `
                UPDATE public.user
                SET lastname = $1, firstname = $2, middlename = $3, roleid = $4
                WHERE dlsuid = $5
                RETURNING *;
            `;
            
            const userResult = await client.query(updateQuery, 
                [lastname, firstname, middlename, roleid, dlsuid]);
            
            if (userResult.rowCount === 0) {
                return reply.status(404).send({ error: "User not found." });
            }
    
            // Handle Linkage Officer/Practicum Coordinator info
            if ([2, 3].includes(roleid)) {
                if (!position || !rank) {
                    return reply.status(400).send({ error: "Position and rank are required for this role." });
                }
    
                const loUpsertQuery = `
                    INSERT INTO public.lo_info (dlsuid, position, rank)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (dlsuid) DO UPDATE
                    SET position = EXCLUDED.position, rank = EXCLUDED.rank
                    RETURNING *;
                `;
                await client.query(loUpsertQuery, [dlsuid, position, rank]);
            } else {
                // Remove LO info if role changed to non-LO
                await client.query(`
                    DELETE FROM public.lo_info 
                    WHERE dlsuid = $1
                `, [dlsuid]);
            }
    
            await client.query('COMMIT'); // Commit Transaction
    
            // Return updated user data
            const updatedUser = await client.query(`
                SELECT u.*, ur.rolename, lo.position, lo.rank
                FROM public.user u
                LEFT JOIN public.lo_info lo ON u.dlsuid = lo.dlsuid
                INNER JOIN public.user_roles ur ON u.roleid = ur.roleid
                WHERE u.dlsuid = $1
            `, [dlsuid]);
    
            return reply.status(200).send({ 
                message: "Profile updated successfully!",
                user: updatedUser.rows[0]
            });
    
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            if (client) await client.query('ROLLBACK');
            return reply.status(500).send({ error: "Failed to update profile" });
        } finally {
            if (client) client.release();
        }
    });

    // GET user details by DLSU ID
    app.get('/user-details/:dlsuid', async (request, reply) => {
        const { dlsuid } = request.params;
        const client = await app.pg.connect();
        
        try {
            const userResult = await client.query(`
                SELECT u.systemid, u.dlsuid, u.email, u.lastname, u.firstname, u.middlename, 
                    u.roleid, ur.rolename
                FROM public.user u
                INNER JOIN public.user_roles ur ON u.roleid = ur.roleid
                WHERE u.dlsuid = $1
            `, [dlsuid]);

            if (userResult.rows.length === 0) {
                return reply.status(404).send({ error: "User not found" });
            }

            const userData = userResult.rows[0];
            client.release();
            return userData;
        } catch (error) {
            console.error('Error fetching user details:', error);
            client.release();
            return reply.status(500).send({ error: "Failed to fetch user details" });
        }
    });

    // GET linkage officer info by DLSU ID
    app.get('/lo-info/:dlsuid', async (request, reply) => {
        const { dlsuid } = request.params;
        const client = await app.pg.connect();
        
        try {
            const loResult = await client.query(`
                SELECT position, rank 
                FROM public.lo_info 
                WHERE dlsuid = $1
            `, [dlsuid]);

            if (loResult.rows.length === 0) {
                // Return default values if no record exists yet
                return { position: '', rank: 1 };
            }

            client.release();
            return loResult.rows[0];
        } catch (error) {
            console.error('Error fetching LO info:', error);
            client.release();
            return reply.status(500).send({ error: "Failed to fetch LO info" });
        }
    });


    // Change Password
    app.put('/change-password/:dlsuid', async (request, reply) => {
        const { dlsuid } = request.params;
        const { oldPassword, newPassword } = request.body;
        
        const client = await app.pg.connect();
        try {
            // 1. Verify old password
            const checkQuery = `
                SELECT dlsuid FROM public.user 
                WHERE dlsuid = $1 AND password = crypt($2, password)
            `;
            const checkResult = await client.query(checkQuery, [dlsuid, oldPassword]);
            
            if (checkResult.rows.length === 0) {
                return reply.status(401).send({ error: "Current password is incorrect" });
            }

            // 2. Update password
            const updateQuery = `
                UPDATE public.user
                SET password = crypt($1, gen_salt('bf'))
                WHERE dlsuid = $2
                RETURNING dlsuid
            `;
            await client.query(updateQuery, [newPassword, dlsuid]);

            return reply.send({ message: "Password updated successfully" });
        } catch (error) {
            console.error('Error changing password:', error);
            return reply.status(500).send({ error: "Failed to change password" });
        } finally {
            client.release();
        }
    });

      
    done();
}

export default userController;