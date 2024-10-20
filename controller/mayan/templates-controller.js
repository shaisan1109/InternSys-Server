const templatesController = (app, options, done) => {

    // GET list of pre-deployment documents
    app.get('/pre-deployment', async (request, reply) => {
        const response = await fetch('http://ccscloud.dlsu.edu.ph:12707/api/v4/cabinets/2/documents/?_fields_only=id,label',
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );
        const json = await response.json();
        return reply.send(json);
    });

    // GET list of deployment documents
    app.get('/deployment', async (request, reply) => {
        const response = await fetch('http://ccscloud.dlsu.edu.ph:12707/api/v4/cabinets/3/documents/?_fields_only=id,label',
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );
        const json = await response.json();
        return reply.send(json);
    });

    // GET list of pre-deployment documents
    app.get('/post-deployment', async (request, reply) => {
        const response = await fetch('http://ccscloud.dlsu.edu.ph:12707/api/v4/cabinets/4/documents/?_fields_only=id,label',
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );
        const json = await response.json();
        return reply.send(json);
    });

    done();
}

export default templatesController;