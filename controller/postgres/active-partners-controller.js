const activePartnersController = (app, options, done) => {
    // Get contact by ID
    app.get('/active-partner/:id/contact', async (request) => {
        const client = await app.pg.connect();
        const activePartnerResult = await client.query(`SELECT * FROM public.company_contact WHERE company_id=${request.params.id}`);

        client.release();

        return activePartnerResult.rows;
    });

    // GET all contacts
    app.get('/active-partners/contact', async (request) => {
        const client = await app.pg.connect();
        const activePartnerResult = await client.query(`SELECT * FROM public.company_contact`);

        client.release();

        return activePartnerResult.rows;
    });

    // Create contact
    app.post("/active-partner/contact/create", async (request) => {
        const {
            companyId,
            name,
            phone,
            email,
            website
        } = request.body;
        
        return app.pg.transact(async (client) => {
            const createLink = await client.query(`
                INSERT INTO public.company_contact (company_id, contact_name, contact_telephone, contact_email, contact_website)
                VALUES ('${companyId}', '${name}', '${phone}', '${email}', '${website}')
            `);
            return createLink;
        });
    });

    // Update contact
    app.patch("/active-partner/:id/contact", async (request) => {
        const { id } = request.params;
        const { name, phone, email, website } = request.body;
        
        return app.pg.transact(async (client) => {
            const updateLink = await client.query(`
                UPDATE public.company_contact
                SET contact_name = '${name}', contact_telephone = '${phone}', contact_email = '${email}', contact_website = '${website}'
                WHERE contact_id = ${id}
            `);
            return updateLink;
        });
    });

    // Delete contact
    app.delete("/active-partner/:id/contact", async (request) => {
        const { id } = request.params;
        const idNumber = Number(id);

        return app.pg.transact(async (client) => {
            const deleteLink = await client.query(`
                DELETE FROM public.company_contact
                WHERE contact_id = ${idNumber}
            `);
            return deleteLink;
        });
    });

    done();
};

export default activePartnersController;