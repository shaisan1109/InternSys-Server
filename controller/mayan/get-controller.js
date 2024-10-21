const mayanGetController = (app, options, done) => {
    // GET list of documents in a cabinet
    app.get('/cabinet/:id', async (request, reply) => {
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/cabinets/${request.params.id}/documents/?_fields_only=id,label`,
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

    // GET all document types
    app.get('/get-all-doc-types', async (request, reply) => {
        const response = await fetch('http://ccscloud.dlsu.edu.ph:12707/api/v4/document_types/?_fields_only=id,label,documents_url',
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

    // GET all documents
    app.get('/documents', async (request, reply) => {
        const response = await fetch('http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/',
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

    // GET all documents of a certain document type
    app.get('/documents-of-type/:id', async (request, reply) => {
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/document_types/${request.params.id}/documents/`,
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

    // GET all tags on a document
    app.get('/document/:id/tags', async (request, reply) => {
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/tags/`,
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

export default mayanGetController;