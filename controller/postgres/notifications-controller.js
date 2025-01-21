const notificationsController = (app, options, done) => {
    // GET notifications for one user
    app.get('/notifications/:userid', async (request) => {
        const client = await app.pg.connect();
        const notifResult = await client.query(
            `SELECT * FROM public.notifications
            WHERE recipient_id = ${request.params.userid}`
        );

        client.release();

        return notifResult.rows;
    });

    // CREATE notification
    app.post("/notification/create", async (request) => {
        const { recipientId, title, content, timePosted } = request.body;
        
        return app.pg.transact(async (client) => {
            const createNotif = await client.query(`
                INSERT INTO public.notifications (recipient_id, title, content)
                VALUES (${recipientId}, '${title}', '${content}')
            `);      
            return createNotif;
        });
    });

    // DELETE notification by id
    app.delete('/notification/:id/delete', async (request, reply) => {
        const { id } = request.params;
        const idNumber = Number(id);

        return app.pg.transact(async (client) => {
            const deleteNotif = await client.query(`
                DELETE FROM public.notifications
                WHERE notif_id = ${idNumber}
            `);
            return deleteNotif;
        });
    });

    done();
}

export default notificationsController;