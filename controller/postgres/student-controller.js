const StudentController = (app, options, done) => {

// ✅ Fetch student info including company name
// ✅ Fetch detailed student info including company, work hours, and deployment info
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

        return reply.status(200).send(rows[0]); // ✅ Return student details

    } catch (error) {
        console.error('❌ Error fetching student info:', error);
        return reply.status(500).send({ error: 'Failed to fetch student details' });
    }
});

app.get('/student-reports/:studentId', async (request, reply) => {
    try {
        const studentId = request.params.studentId;

        // 🔹 Fetch Student Info
        const studentQuery = `
            SELECT 
                s.studentid, 
                u.firstname || ' ' || u.lastname AS name, 
                s.degree, 
                sec.coursecode AS section,
                s.workhours, 
                s.deploymentstart, 
                s.deploymentend, 
                p.companyname, 
                a.firstname || ' ' || a.lastname AS adviser,
                h.firstname || ' ' || h.lastname AS hte_supervisor
            FROM student_info s
            JOIN "user" u ON s.studentid = u.dlsuid
            LEFT JOIN active_partners p ON s.companyid = p.companyid
            LEFT JOIN "user" a ON s.linkageofficerid = a.dlsuid
            LEFT JOIN "user" h ON s.hte_supervisor_id = h.dlsuid
            LEFT JOIN sections sec ON s.currentsection = sec.sectionid
            WHERE s.studentid = $1
        `;
        const studentResult = await app.pg.query(studentQuery, [studentId]);

        if (studentResult.rows.length === 0) {
            return reply.status(404).send({ error: 'Student not found' });
        }

        // 🔹 Fetch Attendance Reports
        const attendanceQuery = `SELECT * FROM attendance_report WHERE studentid = $1 ORDER BY report_date DESC`;
        const { rows: attendanceReports } = await app.pg.query(attendanceQuery, [studentId]);

        // 🔹 Fetch Progress Reports
        const progressQuery = `SELECT * FROM progress_report WHERE studentid = $1 ORDER BY report_date DESC`;
        const { rows: progressReports } = await app.pg.query(progressQuery, [studentId]);

        // ✅ Return all data
        return reply.status(200).send({
            studentInfo: studentResult.rows[0],  // Ensure this is wrapped in `studentInfo`
            attendanceReports,
            progressReports
        });

    } catch (error) {
        console.error("❌ Error fetching student reports:", error);
        return reply.status(500).send({ error: "Failed to fetch student details." });
    }
});

// ✅ Create Progress Report
app.post('/progress-report/create', async (request, reply) => {
    try {
        const {
            startdate,
            enddate,
            studentid,
            reporttasks,
            problems,
            solutions,
            report_date,
            projectname,
            projectsupervisor,
            companyname,
            adviser
        } = request.body;

        // 🛑 Validate required fields
        // if (!startdate || !enddate || !studentid || !reporttasks || !report_date || !companyname) {
        //     return reply.status(400).send({ error: "Missing required fields." });
        // }

        // 🔹 Convert tasks object to JSON format for database storage
        const reportTasksJSON = JSON.stringify(reporttasks);

        // 📌 SQL Query to insert the progress report into the database
        const query = `
            INSERT INTO progress_report (
                startdate, enddate, studentid, reporttasks, 
                problems, solutions, report_date, projectname, 
                projectsupervisor, companyname, adviser, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $13) RETURNING reportid
        `;

        // 🔹 Execute the query
        const { rows } = await app.pg.query(query, [
            startdate,
            enddate,
            studentid,
            reportTasksJSON,
            problems || null,
            solutions || null,
            report_date,
            projectname || null,
            projectsupervisor || null,
            companyname || null,
            adviser || null,
            'Pending'
        ]);

        console.log("✅ Progress Report saved with ID:", rows[0].reportid);

        return reply.status(201).send({ message: "Progress Report saved successfully!", reportId: rows[0].reportid });

    } catch (error) {
        console.error("❌ Error saving Progress Report:", error);
        return reply.status(500).send({ error: "Failed to save progress report." });
    }
});

app.post('/attendance-report/create', async (request, reply) => {
    try {
        const {
            startdate,
            enddate,
            studentid,
            companyname,
            linkageadviser,
            projectname,
            projectsupervisor,
            totalabsences,
            totalhours,
            runningtotal,
            attendanceRecords,
            report_date
        } = request.body;

        // 🛑 Validate required fields
        if (!startdate || !enddate || !studentid || !companyname || !projectname || !projectsupervisor || !report_date) {
            return reply.status(400).send({ error: "Missing required fields." });
        }

        // 🔹 Convert attendance records to JSON format for database storage
        const attendanceRecordsJSON = JSON.stringify(attendanceRecords.map(record => ({
            date: record.date,
            inTime: record.inTime,
            outTime: record.outTime,
            hoursLate: record.hoursLate,
            hoursWorked: record.hoursWorked,
            remarks: record.remarks
        })));

        // 📌 SQL Query to insert the attendance report into the database
        const query = `
            INSERT INTO attendance_report (
                startdate, enddate, studentid, companyname, linkageadviser, 
                projectname, projectsupervisor, totalabsences, totalhours, 
                runningtotal, attendance, report_date, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING reportid
        `;

        // 🔹 Execute the query
        const { rows } = await app.pg.query(query, [
            startdate, enddate, studentid, companyname, linkageadviser, 
            projectname, projectsupervisor, totalabsences || 0, totalhours || 0, 
            runningtotal || 0, attendanceRecordsJSON, report_date, 'Pending'
        ]);

        console.log("✅ Attendance Report saved with ID:", rows[0].reportid);
        return reply.status(201).send({ message: "Attendance Report saved successfully!", reportId: rows[0].reportid });

    } catch (error) {
        console.error("❌ Error saving Attendance Report:", error);
        return reply.status(500).send({ error: "Failed to save attendance report." });
    }
});


// ✅ Update Report Status (Complete or Decline)
app.put('/:reportType-report/update-status', async (request, reply) => {
    try {
        const { reportId, status, remarks, workHours } = request.body;
        const reportType = request.params.reportType;

        if (!reportId || !status) {
            return reply.status(400).send({ error: "Missing required fields." });
        }

        // 🔹 If attendance report is marked complete, update student work hours
        if (reportType === 'attendance' && status === 'Completed' && workHours !== undefined) {
            const updateStudentQuery = `UPDATE student_info SET workhours = $1 WHERE studentid = (
                SELECT studentid FROM attendance_report WHERE reportid = $2
            )`;
            await app.pg.query(updateStudentQuery, [workHours, reportId]);
        }

        // 🔹 Update Report Status
        const updateQuery = `
            UPDATE ${reportType}_report
            SET status = $1, remarks = $2
            WHERE reportid = $3
        `;
        await app.pg.query(updateQuery, [status, remarks || null, reportId]);

        // If Attendance Report is marked as complete, update student work hours
        if (reportType === 'attendance' && workHours !== undefined) {
            await app.pg.query(`UPDATE student_info SET workhours = $1 WHERE studentid = (SELECT studentid FROM attendance_report WHERE reportid = $2)`, 
            [workHours, reportId]);
        }

        console.log(`✅ ${reportType} report ID ${reportId} updated to status: ${status}`);
        return reply.status(200).send({ message: "Report status updated successfully." });
    } catch (error) {
        console.error("❌ Error updating report status:", error);
        return reply.status(500).send({ error: "Failed to update report status." });
    }
});


    done();
};

export default StudentController;
