const HteSupervisorController = (app, options, done) => {
    app.get('/students/:hteSupervisorId', async (request, reply) => {
        try {
            const { hteSupervisorId } = request.params;
    
            const query = `
                SELECT u.dlsuid, u.firstname, u.middlename, u.lastname, s.studentid
                FROM student_info s
                JOIN "user" u ON s.studentid = u.dlsuid
                WHERE s.hte_supervisor_id = $1
            `;
    
            const { rows } = await app.pg.query(query, [hteSupervisorId]);
    
            if (rows.length === 0) {
                return reply.status(404).send({ message: "No students assigned to this supervisor." });
            }
    
            return reply.status(200).send(rows);
        } catch (error) {
            console.error("❌ Error fetching students:", error);
            return reply.status(500).send({ error: "Failed to retrieve students." });
        }
    });
    
    app.get('/student-reports/:studentId', async (request, reply) => {
        try {
            const studentId = request.params.studentId;

            // 🔹 Fetch Attendance Reports
            const attendanceQuery = `
                SELECT * FROM attendance_report
                WHERE studentid = $1
                ORDER BY report_date DESC
            `;
            const { rows: attendanceReports } = await app.pg.query(attendanceQuery, [studentId]);

            // 🔹 Fetch Progress Reports
            const progressQuery = `
                SELECT * FROM progress_report
                WHERE studentid = $1
                ORDER BY report_date DESC
            `;
            const { rows: progressReports } = await app.pg.query(progressQuery, [studentId]);

            return reply.status(200).send({ attendanceReports, progressReports });

        } catch (error) {
            console.error("❌ Error fetching reports:", error);
            return reply.status(500).send({ error: "Failed to fetch reports." });
        }
    });

    app.put('/update-report-status/:reportType', async (request, reply) => {
        try {
            const { reportId, status, approvedBy, signature, reason } = request.body;
            
            const reporttype = request.params.reportType;
            let query = '';

            if(reporttype === 'progress'){
                query = `UPDATE progress_report SET status = $1 WHERE reportid = $2`;
            } else if(reporttype === 'attendance'){
                query = `UPDATE attendance_report SET status = $1 WHERE reportid = $2`;
            } 
            let params = [status, reportId];
    
            if (status === 'Approved') {
                if(reporttype === 'progress'){
                    query = `UPDATE progress_report SET status = $1 WHERE reportid = $2`;
                } else if(reporttype === 'attendance'){
                    query = `UPDATE attendance_report SET status = $1 WHERE reportid = $2`;
                }   
                params = [status, reportId];
            }
    
            if (status === 'Declined') {
                if(reporttype === 'progress'){
                    query = `UPDATE progress_report SET status = $1, remarks = $2 WHERE reportid = $3`;
                } else if(reporttype === 'attendance'){
                    query = `UPDATE attendance_report SET status = $1, remarks = $2 WHERE reportid = $3`;
                }
                params = [status, reason, reportId];
            }
    
            await app.pg.query(query, params);
            return reply.status(200).send({ message: "Report updated successfully!" });
    
        } catch (error) {
            console.error("❌ Error updating report status:", error);
            return reply.status(500).send({ error: "Failed to update report status." });
        }
    });


    


    


        done();
    };
    
    export default HteSupervisorController;
    