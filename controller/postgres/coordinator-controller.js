const CoordinatorController = (app, options, done) => {
    app.get('/deployed-sections', async (request, reply) => {
        try {
            const query = `SELECT sectionid, coursecode, section, termnumber FROM sections WHERE deployed = true`;
            const { rows } = await app.pg.query(query);
            return reply.status(200).send(rows);
        } catch (error) {
            return reply.status(500).send({ error: "Failed to fetch sections." });
        }
    });

    app.get('/grades/:sectionId', async (request, reply) => {
        try {
            const { sectionId } = request.params;
    
            const query = `
                    SELECT 
                    s.studentid, 
                    u.lastname || ', ' || u.firstname AS name, 
                    s.degree,
                    sec.section, 
                    sec.coursecode,
                    s.workhours, 
                    s.deploymentstart, 
                    s.deploymentend, 
                    p.companyname, 
                    a.firstname || ' ' || a.lastname AS adviser,
                    h.firstname || ' ' || h.lastname AS hte_supervisor,
                    s.grade_lo,
                    s.grade_company
                FROM student_info s
                JOIN "user" u ON s.studentid = u.dlsuid
                LEFT JOIN active_partners p ON s.companyid = p.companyid
                LEFT JOIN "user" a ON s.linkageofficerid = a.dlsuid
                LEFT JOIN "user" h ON s.hte_supervisor_id = h.dlsuid
                LEFT JOIN sections sec ON s.currentsection = sec.sectionid
                WHERE s.currentsection = $1 and s.deployed = true
            `;
    
            const { rows } = await app.pg.query(query, [sectionId]);
            return reply.status(200).send(rows);
        } catch (error) {
            return reply.status(500).send({ error: "Failed to fetch student grades." });
        }
    });

    // app.put('/sections/:sectionId', async (request, reply) => {
    //     try {
    //         const { sectionId } = request.params;
    //         const { coursecode, section, termnumber, deployed } = request.body;
    //         await app.pg.query(`
    //             UPDATE sections SET coursecode = $1, section = $2, termnumber = $3, deployed = $4
    //             WHERE sectionid = $5`, [coursecode, section, termnumber, deployed, sectionId]);
    //         return reply.status(200).send({ message: "Section updated successfully." });
    //     } catch (error) {
    //         return reply.status(500).send({ error: "Failed to update section." });
    //     }
    // });

    // app.post('/sections', async (request, reply) => {
    //     try {
    //         const { coursecode, section, termnumber, deployed } = request.body;
    //         await app.pg.query(`
    //             INSERT INTO sections (coursecode, section, termnumber, deployed)
    //             VALUES ($1, $2, $3, $4)`, [coursecode, section, termnumber, deployed]);
    //         return reply.status(201).send({ message: "Section created successfully." });
    //     } catch (error) {
    //         return reply.status(500).send({ error: "Failed to create section." });
    //     }
    // });

    /** 🔹 Fetch all sections */
    app.get('/sections', async (request, reply) => {
        try {
            const query = ` SELECT s.sectionid, s.coursecode, s.section, s.termnumber, s.deployed , COUNT(i.studentid) as student_count
                            FROM sections s
                            LEFT JOIN student_info i ON s.sectionid = i.currentsection
                            GROUP BY s.sectionid, s.coursecode, s.section, s.termnumber, s.deployed
                            `;
            const { rows } = await app.pg.query(query);
            return reply.status(200).send(rows);
        } catch (error) {
            return reply.status(500).send({ error: "Failed to fetch sections." });
        }
    });

    /** 🔹 Add a new section */
    app.post('/sections', async (request, reply) => {
        try {
            const { coursecode, section, termnumber, deployed } = request.body;
            await app.pg.query(`
                INSERT INTO sections (coursecode, section, termnumber, deployed)
                VALUES ($1, $2, $3, $4)`, [coursecode, section, termnumber, deployed]);
            return reply.status(201).send({ message: "Section created successfully." });
        } catch (error) {
            return reply.status(500).send({ error: "Failed to create section." });
        }
    });

    /** 🔹 Update a section */
    app.put('/sections/:sectionId', async (request, reply) => {
        try {
            const { sectionId } = request.params;
            const { coursecode, section, termnumber, deployed } = request.body;
            await app.pg.query(`
                UPDATE sections SET coursecode = $1, section = $2, termnumber = $3, deployed = $4
                WHERE sectionid = $5`, [coursecode, section, termnumber, deployed, sectionId]);
            return reply.status(200).send({ message: "Section updated successfully." });
        } catch (error) {
            return reply.status(500).send({ error: "Failed to update section." });
        }
    });

    /** 🔹 Delete a section */
    app.delete('/sections/:sectionId', async (request, reply) => {
        try {
            const { sectionId } = request.params;
            await app.pg.query(`DELETE FROM sections WHERE sectionid = $1`, [sectionId]);
            return reply.status(200).send({ message: "Section deleted successfully." });
        } catch (error) {
            return reply.status(500).send({ error: "Failed to delete section." });
        }
    });

    /** 🔹 Toggle deployment status */
    app.put('/sections/:sectionId/deployment', async (request, reply) => {
        try {
            const { sectionId } = request.params;
            const { deployed } = request.body;
            await app.pg.query(`UPDATE sections SET deployed = $1 WHERE sectionid = $2`, [deployed, sectionId]);
            return reply.status(200).send({ message: "Deployment status updated." });
        } catch (error) {
            return reply.status(500).send({ error: "Failed to update deployment status." });
        }
    });

    /** 🔹 Fetch students assigned to a section */
    app.get('/sections/:sectionId/students', async (request, reply) => {
        try {
            const { sectionId } = request.params;
            const query = `
                SELECT u.dlsuid AS studentid, u.firstname || ' ' || u.lastname AS name, s.degree,
                lo.firstname || ' ' || lo.lastname AS linkage_officer
                FROM student_info s
                JOIN "user" u ON s.studentid = u.dlsuid
                LEFT JOIN "user" lo ON s.linkageofficerid = lo.dlsuid
                WHERE s.currentsection = $1
            `;
            const { rows } = await app.pg.query(query, [sectionId]);
            return reply.status(200).send(rows);
        } catch (error) {
            return reply.status(500).send({ error: "Failed to fetch students." });
        }
    });

    /** 🔹 Assign student to a section */
    app.put('/students/:studentId/assign/:sectionId', async (request, reply) => {
        try {
            const { studentId, sectionId } = request.params;
            await app.pg.query(`UPDATE student_info SET currentsection = $1 WHERE studentid = $2`, [sectionId, studentId]);
            return reply.status(200).send({ message: "Student assigned to section." });
        } catch (error) {
            return reply.status(500).send({ error: "Failed to assign student." });
        }
    });       
    

    /** 🔹 Remove student from a section */
    app.put('/students/:studentId/remove', async (request, reply) => {
        try {
            const { studentId } = request.params;
            await app.pg.query(`UPDATE student_info SET currentsection = NULL WHERE studentid = $1`, [studentId]);
            return reply.status(200).send({ message: "Student removed from section." });
        } catch (error) {
            return reply.status(500).send({ error: "Failed to remove student." });
        }
    });

    app.get('/students/unassigned', async (request, reply) => {
        try {
            const query = `
                SELECT 
                    u.dlsuid AS studentid, 
                    u.firstname || ' ' || u.lastname AS name,
                    s.degree
                FROM public.user u
                LEFT JOIN public.student_info s ON u.dlsuid = s.studentid
                WHERE u.roleid = 1 
                AND (s.currentsection IS NULL OR s.currentsection = 0) 
            `;

            const { rows } = await app.pg.query(query);

            return reply.status(200).send(rows);
        } catch (error) {
            console.error("❌ Error fetching unassigned students:", error);
            return reply.status(500).send({ error: "Failed to retrieve unassigned students." });
        }
    });
    
    done();
}

export default CoordinatorController;