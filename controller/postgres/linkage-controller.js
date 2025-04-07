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
            SELECT u.dlsuid, u.firstname, u.lastname, s.linkageofficerid AS linkage_officer, sec.coursecode || ' - ' || sec.section AS section
            FROM public.student_info s
            JOIN public.user u ON u.dlsuid = s.studentid
            LEFT JOIN public.sections sec ON s.currentsection = sec.sectionid
            WHERE s.linkageofficerid IS NOT NULL AND s.deployed = true
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
                SELECT u.dlsuid, u.firstname, u.lastname, u.middlename, sec.coursecode || ' - ' || sec.section AS section, s.companyid 
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
    app.post("/lo-report/create/:series", async (request) => {
        const series = Number(request.params.series);
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
            studentid
        } = request.body;
        if (!linkageOfficerId || !companyName || !companyAddress || !contactPerson || !emailAddress) {
            console.error("❌ Missing required fields:", request.body);
            return reply.status(400).send({ error: "Missing required fields." });
        }

        console.log(`📥 Creating LO Report for Series ${series}`, request.body);

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
                    visit2_highlights,
                    studentid,
                    series
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
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
                visit2Date || null,  // ✅ Allow null for Series 1
                visit2Highlights || null, // ✅ Allow null for Series 1
                studentid,
                series 
            ]);
            return createRequest;
        });
    });


    // ✅ Fetch previous Linkage Reports
    app.get('/lo-report/:series/:studentId', async (request, reply) => {
        try {
            const {series, studentId} = request.params;

            const query = `
                SELECT * FROM lo_reports
                WHERE studentid = $1 AND series = $2
            `;

            const { rows } = await app.pg.query(query, [studentId, series]);

            return reply.status(200).send(rows.length ? rows[0] : null);

        } catch (error) {
            console.error('❌ Error fetching linkage report:', error);
            return reply.status(500).send({ error: 'Failed to fetch linkage report' });
        }
    });

    app.get('/student-info/:id', async (request, reply) => {
        try {
            const studentId = request.params.id;
    
            const query = `
                SELECT 
                    s.studentid,
                    u.firstname || ' ' || u.lastname AS name, 
                    s.degree, 
                    sec.coursecode AS section,
                    s.workhours,
                    s.deploymentstart,
                    s.deploymentend,
                    p.companyname,
                    p.address,          
                    p.lineofbusiness, 
                    a.firstname || ' ' || a.lastname AS adviser,
                    hte.firstname || ' ' || hte.lastname AS hte_supervisor
                FROM student_info s
                JOIN "user" u ON s.studentid = u.dlsuid
                LEFT JOIN active_partners p ON s.companyid = p.companyid
                LEFT JOIN "user" a ON s.linkageofficerid = a.dlsuid
                LEFT JOIN "user" hte ON s.hte_supervisor_id = hte.dlsuid
                LEFT JOIN sections sec ON s.currentsection = sec.sectionid
                WHERE s.studentid = $1
            `;
    
            const { rows } = await app.pg.query(query, [studentId]);
    
            if (rows.length === 0) {
                return reply.status(404).send({ error: 'Student not found' });
            }
    
            return reply.status(200).send(rows[0]); 
        } catch (error) {
            console.error('❌ Error fetching student info:', error);
            return reply.status(500).send({ error: 'Failed to fetch student details' });
        }
    });

    app.put('/submit-grade/:studentId', async (request, reply) => {
        const { studentId } = request.params;
        const { loGrade, companyGrade } = request.body;
    
        if (!loGrade || loGrade < 70 || loGrade > 100 || !companyGrade || companyGrade < 70 || companyGrade > 100) {
            return reply.status(400).send({ error: "Invalid grade input." });
        }
    
        try {
            await app.pg.query(`
                UPDATE student_info
                SET grade_lo = $1, grade_company = $2
                WHERE studentid = $3
            `, [loGrade, companyGrade, studentId]);
    
            reply.send({ message: "Grades submitted successfully" });
        } catch (error) {
            console.error('❌ Error submitting grades:', error);
            reply.status(500).send({ error: "Failed to submit grades" });
        }
    });
    

    // manage linkage lab coord

    // GET all linkage officers
    app.get('/linkage-officers', async () => {
        const client = await app.pg.connect();
        const result = await client.query(`
            SELECT u.dlsuid, u.lastname, u.firstname, u.middlename, u.linkageset
            FROM public.user u
            WHERE u.roleid IN (2, 3);
        `);
        client.release();
        return result.rows;
    });

    app.get('/linkage-officers-active', async () => {
        const client = await app.pg.connect();
        const result = await client.query(`
            SELECT u.dlsuid, u.lastname, u.firstname, u.middlename, u.linkageset, COUNT(s.studentid) AS student_count, l.position || ' ' || l.rank AS rank 
            FROM public.user u
            LEFT JOIN student_info s ON u.dlsuid = s.linkageofficerid
            LEFT JOIN lo_info l ON u.dlsuid = l.dlsuid
            WHERE u.roleid IN (2, 3) AND u.linkageset = true
            GROUP BY u.dlsuid, u.lastname, u.firstname, u.middlename, u.linkageset, l.position, l.rank
        `);
        client.release();
        return result.rows;
    });

    app.get('/linkage-officers-inactive', async () => {
        const client = await app.pg.connect();
        const result = await client.query(`
            SELECT u.dlsuid, u.lastname, u.firstname, u.middlename, u.linkageset, l.position || ' ' || l.rank AS rank
            FROM public.user u
            LEFT JOIN lo_info l ON u.dlsuid = l.dlsuid
            WHERE u.roleid IN (2, 3) AND u.linkageset = false
        `);
        client.release();
        return result.rows;
    });

    app.put('/linkage-officer/:officerId/status', async (request, reply) => {
        const { officerId } = request.params;
        const { linkageset } = request.body;
    
        const client = await app.pg.connect();
        try {
            await client.query(`UPDATE public.user SET linkageset = $1 WHERE dlsuid = $2`, [linkageset, officerId]);
            reply.send({ message: `Linkage Officer ${linkageset ? 'Activated' : 'Deactivated'}` });
        } catch (error) {
            console.error('Error updating officer status:', error);
            reply.status(500).send({ error: "Failed to update status" });
        } finally {
            client.release();
        }
    });
    
    app.post('/assign-multiple-students', async (request, reply) => {
        const { studentIds, linkageOfficerId } = request.body;
    
        if (!studentIds || studentIds.length === 0) {
            return reply.status(400).send({ error: "No students selected" });
        }
    
        const client = await app.pg.connect();
        try {
            await client.query('BEGIN');
            for (const studentId of studentIds) {
                await client.query(`UPDATE student_info SET linkageofficerid = $1 WHERE studentid = $2`, [linkageOfficerId, studentId]);
            }
            await client.query('COMMIT');
    
            reply.send({ message: "Students assigned successfully" });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error assigning students:', error);
            reply.status(500).send({ error: "Failed to assign students" });
        } finally {
            client.release();
        }
    });
    


    done();
};

export default linkageOfficerController;
