const linkageOfficerController = (app, options, done) => {
    // GET all unassigned students (students without a linkage officer in student_info)
    app.get('/unassigned-students', async () => {
        const client = await app.pg.connect();
        const result = await client.query(`
            SELECT u.dlsuid, u.lastname, u.firstname, u.middlename
            FROM public.user u
            LEFT JOIN public.student_info s ON u.dlsuid = s.studentid
            WHERE u.roleid = 1 AND s.deployed = true
            AND COALESCE(s.linkageofficerid, 0) = 0
        `);
        client.release();
        return result.rows;
    });    

    // GET all assigned students (Students linked to a linkage officer via student_info table)
    app.get('/assigned-students', async () => {
        const client = await app.pg.connect();
        const result = await client.query(`
            SELECT u.dlsuid, u.firstname, u.lastname, s.linkageofficerid AS linkage_officer
            FROM public.student_info s
            JOIN public.user u ON u.dlsuid = s.studentid
            WHERE s.linkageofficerid IS NOT NULL AND s.deployed = true
        `);
        client.release();
        return result.rows;
    });

    // GET all linkage officers
    app.get('/linkage-officers', async () => {
        const client = await app.pg.connect();
        const result = await client.query(`
            SELECT u.dlsuid, u.lastname, u.firstname, u.middlename
            FROM public.user u
            WHERE u.roleid = 3
        `);
        client.release();
        return result.rows;
    });

    // POST - Assign a student to a linkage officer (Update student_info table)
    app.post('/assign-student', async (request, reply) => {
        const { studentId, linkageOfficerId } = request.body;

        if (!studentId || !linkageOfficerId) {
            return reply.status(400).send({ error: "Missing studentId or linkageOfficerId" });
        }

        const client = await app.pg.connect();
        try {
            await client.query(`
                UPDATE public.student_info 
                SET linkageofficerid = $1
                WHERE studentid = $2
            `, [linkageOfficerId, studentId]);

            reply.send({ message: "Student successfully assigned" });
        } catch (error) {
            reply.status(500).send({ error: error.message });
        } finally {
            client.release();
        }
    });

    // DELETE - Unassign a student (Set linkageofficerid to NULL in student_info)
    app.delete('/unassign-student/:studentId', async (request, reply) => {
        const { studentId } = request.params;
        const client = await app.pg.connect();
        try {
            await client.query(`
                UPDATE public.student_info 
                SET linkageofficerid = NULL
                WHERE studentid = $1
            `, [studentId]);

            reply.send({ message: "Student unassigned successfully" });
        } catch (error) {
            reply.status(500).send({ error: error.message });
        } finally {
            client.release();
        }
    });

    // ✅ GET all students assigned to a specific linkage officer
    app.get('/assigned-students/:linkageOfficerId', async (request, reply) => {
        const { linkageOfficerId } = request.params;

        const client = await app.pg.connect();
        try {
            const result = await client.query(`
                SELECT u.dlsuid, u.firstname, u.lastname, u.middlename, sec.coursecode, s.companyid 
                FROM public.student_info s
                JOIN public.user u ON u.dlsuid = s.studentid
                LEFT JOIN public.sections sec ON s.currentsection = sec.sectionid
                WHERE s.linkageofficerid = $1 AND s.deployed = true
            `, [linkageOfficerId]);

            reply.send(result.rows);
        } catch (error) {
            reply.status(500).send({ error: error.message });
        } finally {
            client.release();
        }
    });

    // CREATE an LO report 1
    app.post("/lo-report/create/1", async (request) => {
        const {
            linkageOfficerId,
            companyName,
            companyAddress,
            contactPerson,
            emailAddress,
            contactNos,
            natureOfCompany,
            numberOfStudents,
            studentNames,
            strengthsStudents,
            improvementStudents,
            strengthsCompany,
            improvementCompany,
            projectsTasks,
            computingPlatform,
            studentAllowance,
            participationDates,
            assessmentRecommendation,
            visit1Date,
            visit1Highlights,
            visit2Date,
            visit2Highlights,
        } = request.body;
        
        return app.pg.transact(async (client) => {
            const createRequest = await client.query(`
                INSERT INTO public.lo_reports (
                    linkage_officer,
                    company_name,
                    company_address,
                    contact_person,
                    email_address,
                    contact_no,
                    nature_of_company,
                    number_of_students,
                    student_names,
                    strengths_students,
                    improvements_students,
                    strengths_company,
                    improvements_company,
                    project_tasks,
                    computing_platform,
                    student_allowance,
                    participation_dates,
                    assessment_recommendation,
                    visit1_date,
                    visit1_highlights,
                    visit2_date,
                    visit2_highlights
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
                ) RETURNING *;
            `, [
                linkageOfficerId,
                companyName,
                companyAddress,
                contactPerson,
                emailAddress,
                contactNos,
                natureOfCompany,
                numberOfStudents,
                studentNames,
                strengthsStudents,
                improvementStudents,
                strengthsCompany,
                improvementCompany,
                projectsTasks,
                computingPlatform,
                studentAllowance,
                participationDates,
                assessmentRecommendation,
                visit1Date,
                visit1Highlights,
                visit2Date,
                visit2Highlights,
            ]);
            return createRequest;
        });
    });


    


    done();
};

export default linkageOfficerController;
